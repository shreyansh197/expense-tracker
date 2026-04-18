import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/server/prisma";

/**
 * POST /api/push/send
 * Cron endpoint: sends evening reminder push notifications to all users
 * who have them enabled and whose reminder time matches the current hour.
 *
 * Secured by a CRON_SECRET header to prevent unauthorized calls.
 * Call this every minute from an external cron service.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret — supports Vercel Cron (Authorization: Bearer) and custom header
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const secret = bearer || req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || process.env.EMAIL_FROM || "mailto:noreply@expenstream.app";

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  webpush.setVapidDetails(
    vapidEmail.startsWith("mailto:") ? vapidEmail : `mailto:${vapidEmail}`,
    vapidPublic,
    vapidPrivate,
  );

  const now = new Date();
  const currentHH = String(now.getHours()).padStart(2, "0");
  const currentMM = String(now.getMinutes()).padStart(2, "0");
  const currentTime = `${currentHH}:${currentMM}`;
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  // Find all workspace settings where notifications are enabled
  // and the evening reminder time matches the current minute
  let workspaceRows: Array<{ workspace_id: string; notification_prefs: Record<string, unknown> }>;
  try {
    workspaceRows = await prisma.$queryRawUnsafe<
      Array<{ workspace_id: string; notification_prefs: Record<string, unknown> }>
    >(
      `SELECT workspace_id, notification_prefs
       FROM workspace_settings
       WHERE notification_prefs IS NOT NULL
         AND (notification_prefs->>'enabled')::boolean = true
         AND (notification_prefs->>'eveningReminder')::boolean = true`,
    );
  } catch (e) {
    console.error("[push/send] Query failed:", e);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  // Filter to those whose reminderTime matches current minute
  const matchingWorkspaceIds = workspaceRows
    .filter((row) => {
      const time = (row.notification_prefs?.eveningReminderTime as string) || "21:00";
      return time === currentTime;
    })
    .map((row) => row.workspace_id);

  if (matchingWorkspaceIds.length === 0) {
    return NextResponse.json({ sent: 0, time: currentTime });
  }

  // Get all push subscriptions for those workspaces
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { workspaceId: { in: matchingWorkspaceIds } },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, time: currentTime, workspaces: matchingWorkspaceIds.length });
  }

  const payload = JSON.stringify({
    title: "ExpenStream",
    body: "Log your day? A quick note keeps your stream flowing.",
    icon: "/icons/icon-192.png",
    tag: `evening-reminder-${todayStr}`,
    data: { url: "/", type: "evening-reminder" },
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 3600 }, // 1 hour expiry
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // 404 or 410 = subscription expired/unsubscribed, clean it up
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error(`[push/send] Failed for endpoint ${sub.endpoint.slice(0, 50)}…:`, err);
        }
      }
    }),
  );

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }

  console.log(`[push/send] time=${currentTime} sent=${sent} failed=${failed} stale=${staleEndpoints.length}`);

  return NextResponse.json({
    sent,
    failed,
    staleRemoved: staleEndpoints.length,
    time: currentTime,
  });
}
