import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body", 400);

  const { name, avatarUrl } = body as {
    name?: string;
    avatarUrl?: string | null;
  };

  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) {
    data.name = name.trim().slice(0, 100);
  }
  if (avatarUrl !== undefined) {
    // Allow null to clear, or a valid URL string / data URI
    if (avatarUrl === null) {
      data.avatarUrl = null;
    } else if (typeof avatarUrl === "string") {
      if (avatarUrl.startsWith("data:image/")) {
        // Data URI — allow up to ~2 MB base64 payload (~2.75 MB string)
        if (avatarUrl.length > 3_000_000) {
          return jsonError("Avatar too large", 400);
        }
        data.avatarUrl = avatarUrl;
      } else if (avatarUrl.length < 2048) {
        try {
          new URL(avatarUrl);
          data.avatarUrl = avatarUrl;
        } catch {
          return jsonError("Invalid avatar URL", 400);
        }
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return jsonError("No fields to update", 400);
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data,
    select: { id: true, email: true, name: true, avatarUrl: true },
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
    },
  });
}
