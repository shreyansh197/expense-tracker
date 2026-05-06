import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/server/prisma";

/**
 * POST /api/push/send
 * Cron endpoint — runs every minute. Dispatches four notification types:
 *
 *  1. Evening reminder  — at user's saved eveningReminderTime (local tz)
 *  2. Weekly digest     — Sundays at eveningReminderTime
 *  3. Budget alerts     — daily at 12:00 local, when monthly spend ≥ 75 % of budget
 *  4. Smart nudges      — daily at 09:00 (morning) and 14:00 (afternoon) local
 *                         = max 2 nudges per day
 *
 * Secured by CRON_SECRET header. Call every minute from cron-job.org.
 */

// ── Smart nudge message pools ─────────────────────────────────
// Indexed by day-of-year so each day gets a fresh message automatically.
const MORNING_NUDGES = [
  "Start the day right — have you set a spending intention for today?",
  "Good morning! Tracking even small purchases leads to big savings.",
  "Tip: logging expenses takes just 30 seconds and saves hours of confusion.",
  "A fresh day, a fresh budget check. How are you tracking this month?",
  "Did you know? People who log expenses daily save noticeably more.",
  "Morning habit: log yesterday's expenses before your first coffee.",
  "Consistency is key — your future self will thank you for logging today.",
];

const AFTERNOON_NUDGES = [
  "Midday check-in: any purchases to log from this morning?",
  "Quick log now saves a big catch-up later. Take 30 seconds!",
  "Remember to log any lunch or subscription expenses today.",
  "How's your spending going today? A quick check keeps you on track.",
  "Afternoon reminder: small untracked purchases are the #1 budget buster.",
  "Take a moment to log any expenses from your morning. Stay in control!",
  "Budget check: are you on pace for the month? Log and find out.",
];

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const secret = bearer || req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── VAPID setup ───────────────────────────────────────────────
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

  // ── Time helpers ──────────────────────────────────────────────
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const utcYear  = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth() + 1; // 1-based
  const utcTime  = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;

  // Day of year (1-based) — used to rotate nudge messages
  const startOfYear = Date.UTC(utcYear, 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000);

  /** HH:MM in a given IANA timezone, UTC fallback on error */
  function localTimeIn(tz?: string): string {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false,
        timeZone: tz || "UTC",
      }).formatToParts(now);
      return `${parts.find(p => p.type === "hour")!.value}:${parts.find(p => p.type === "minute")!.value}`;
    } catch {
      return utcTime;
    }
  }

  /** 0 = Sunday … 6 = Saturday in a given IANA timezone */
  function localDayOfWeekIn(tz?: string): number {
    try {
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz || "UTC" })
        .format(now);
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
    } catch {
      return now.getUTCDay();
    }
  }

  /** YYYY-MM for the current month in a given IANA timezone */
  function localMonthStrIn(tz?: string): string {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        year: "numeric", month: "2-digit", timeZone: tz || "UTC",
      }).formatToParts(now);
      return `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}`;
    } catch {
      return `${utcYear}-${String(utcMonth).padStart(2, "0")}`;
    }
  }

  // ── Query all enabled workspaces ──────────────────────────────
  let workspaceRows: Array<{
    workspace_id: string;
    currency: string;
    notification_prefs: Record<string, unknown>;
    monthly_budgets: Record<string, number> | null;
    category_budgets: Record<string, number> | null;
  }>;

  try {
    workspaceRows = await prisma.$queryRawUnsafe<typeof workspaceRows>(
      `SELECT workspace_id, currency, notification_prefs, monthly_budgets, category_budgets
       FROM workspace_settings
       WHERE notification_prefs IS NOT NULL
         AND (notification_prefs->>'enabled')::boolean = true`,
    );
  } catch (e) {
    console.error("[push/send] Query failed:", e);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (workspaceRows.length === 0) {
    return NextResponse.json({ sent: 0, time: utcTime });
  }

  // ── Decide which notifications to send per workspace ──────────
  // { workspaceId → payload[] }
  const notifMap = new Map<string, string[]>();

  // Workspaces needing a budget query (budgetAlerts=true AND local time is 12:00)
  const budgetCheckIds: string[] = [];

  for (const row of workspaceRows) {
    const prefs   = row.notification_prefs;
    const tz      = (prefs.timezone as string) || undefined;
    const localT  = localTimeIn(tz);
    const localD  = localDayOfWeekIn(tz);
    const wid     = row.workspace_id;
    const remind  = (prefs.eveningReminderTime as string) || "21:00";

    const push = (payload: object) => {
      if (!notifMap.has(wid)) notifMap.set(wid, []);
      notifMap.get(wid)!.push(JSON.stringify(payload));
    };

    // 1. Evening reminder
    if (prefs.eveningReminder && localT === remind) {
      push({
        title: "ExpenStream",
        body: "Log your day? A quick note keeps your stream flowing.",
        icon: "/icons/icon-192.png",
        tag: `evening-reminder-${todayStr}`,
        data: { url: "/", type: "evening-reminder" },
      });
    }

    // 2. Weekly digest — Sundays at eveningReminderTime
    if (prefs.weeklyDigest && localD === 0 && localT === remind) {
      push({
        title: "Your Weekly Digest",
        body: "Your weekly spending summary is ready. See how you did this week!",
        icon: "/icons/icon-192.png",
        tag: `weekly-digest-${todayStr}`,
        data: { url: "/", type: "weekly-digest" },
      });
    }

    // 3. Budget alerts — check at 12:00 local once per day
    if (prefs.budgetAlerts && localT === "12:00") {
      budgetCheckIds.push(wid);
    }

    // 4. Smart nudges — morning at 09:00, afternoon at 14:00 (= 2/day max)
    if (prefs.smartNudges) {
      if (localT === "09:00") {
        push({
          title: "ExpenStream",
          body: MORNING_NUDGES[dayOfYear % MORNING_NUDGES.length],
          icon: "/icons/icon-192.png",
          tag: `smart-nudge-morning-${todayStr}`,
          data: { url: "/", type: "smart-nudge" },
        });
      }
      if (localT === "14:00") {
        push({
          title: "ExpenStream",
          body: AFTERNOON_NUDGES[dayOfYear % AFTERNOON_NUDGES.length],
          icon: "/icons/icon-192.png",
          tag: `smart-nudge-afternoon-${todayStr}`,
          data: { url: "/", type: "smart-nudge" },
        });
      }
    }
  }

  // ── Budget alerts: query monthly spend once for all qualifying workspaces ──
  if (budgetCheckIds.length > 0) {
    // Current month as numeric year/month for the expenses table
    // (expenses store year/month as SmallInt, not a date column)
    const expTotals = await prisma.$queryRawUnsafe<Array<{ workspace_id: string; total: number }>>(
      `SELECT workspace_id, COALESCE(SUM(amount), 0)::float AS total
       FROM expenses
       WHERE workspace_id = ANY($1::uuid[])
         AND deleted_at IS NULL
         AND year  = $2
         AND month = $3
       GROUP BY workspace_id`,
      budgetCheckIds,
      utcYear,
      utcMonth,
    );

    const totalByWid = Object.fromEntries(expTotals.map(r => [r.workspace_id, r.total]));

    for (const row of workspaceRows.filter(r => budgetCheckIds.includes(r.workspace_id))) {
      const wid      = row.workspace_id;
      const currency = row.currency || "INR";
      const total    = totalByWid[wid] ?? 0;
      const tz       = (row.notification_prefs.timezone as string) || undefined;
      const monthStr = localMonthStrIn(tz); // YYYY-MM in user's local tz

      // Resolve monthly budget: explicit override → sum of category budgets → skip
      const monthlyOverride = (row.monthly_budgets as Record<string, number> | null)?.[monthStr] ?? 0;
      const categoryTotal   = row.category_budgets
        ? Object.values(row.category_budgets).reduce((a, b) => a + (Number(b) || 0), 0)
        : 0;
      const budget = monthlyOverride || categoryTotal;
      if (budget <= 0) continue;

      const pct = Math.round((total / budget) * 100);

      const push = (payload: object) => {
        if (!notifMap.has(wid)) notifMap.set(wid, []);
        notifMap.get(wid)!.push(JSON.stringify(payload));
      };

      if (pct >= 100) {
        push({
          title: "Budget Limit Reached!",
          body: `You've hit 100% of your ${currency} budget this month (${Math.round(total).toLocaleString()} / ${Math.round(budget).toLocaleString()}). Time to review!`,
          icon: "/icons/icon-192.png",
          // Tag includes month so alert resets next month; browser replaces duplicate tags
          tag: `budget-alert-100-${monthStr}`,
          data: { url: "/", type: "budget-alert", pct: 100 },
        });
      } else if (pct >= 75) {
        push({
          title: "Budget Alert",
          body: `You've used ${pct}% of your ${currency} budget this month. Keep an eye on spending!`,
          icon: "/icons/icon-192.png",
          tag: `budget-alert-75-${monthStr}`,
          data: { url: "/", type: "budget-alert", pct },
        });
      }
    }
  }

  if (notifMap.size === 0) {
    return NextResponse.json({ sent: 0, time: utcTime });
  }

  // ── Fetch push subscriptions for all involved workspaces ──────
  const involvedIds = [...notifMap.keys()];
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { workspaceId: { in: involvedIds } },
  });

  if (subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, time: utcTime, workspaces: involvedIds.length });
  }

  const subsByWorkspace = new Map<string, typeof subscriptions>();
  for (const sub of subscriptions) {
    if (!subsByWorkspace.has(sub.workspaceId)) subsByWorkspace.set(sub.workspaceId, []);
    subsByWorkspace.get(sub.workspaceId)!.push(sub);
  }

  // ── Send notifications ────────────────────────────────────────
  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  await Promise.allSettled(
    [...notifMap.entries()].flatMap(([workspaceId, payloads]) => {
      const subs = subsByWorkspace.get(workspaceId) ?? [];
      return subs.flatMap(sub =>
        payloads.map(async (payload) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload,
              { TTL: 3600 },
            );
            sent++;
          } catch (err: unknown) {
            failed++;
            const statusCode = (err as { statusCode?: number })?.statusCode;
            if (statusCode === 404 || statusCode === 410) {
              staleEndpoints.push(sub.endpoint);
            } else {
              console.error(`[push/send] Failed for endpoint ${sub.endpoint.slice(0, 50)}…:`, err);
            }
          }
        }),
      );
    }),
  );

  // ── Clean up stale subscriptions ──────────────────────────────
  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }

  console.log(`[push/send] utc=${utcTime} sent=${sent} failed=${failed} stale=${staleEndpoints.length}`);

  return NextResponse.json({ sent, failed, staleRemoved: staleEndpoints.length, time: utcTime });
}
