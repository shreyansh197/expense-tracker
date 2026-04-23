import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError , getClientIp} from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";
import { hashIp } from "@/lib/server/tokens";
import { clearRefreshTokenCookie } from "@/lib/server/cookies";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  // Revoke the session
  await prisma.session.update({
    where: { id: auth.sessionId },
    data: { revokedAt: new Date() },
  });

  await audit({
    userId: auth.userId,
    entityType: "session",
    entityId: auth.sessionId,
    action: "user.logout",
    ipHash: hashIp(
      getClientIp(req),
    ),
  });

  const res = NextResponse.json({ ok: true });
  clearRefreshTokenCookie(res);
  return res;
}
