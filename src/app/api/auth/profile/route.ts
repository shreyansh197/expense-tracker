import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth, jsonError } from "@/lib/server/guards";
import { profileUpdateSchema } from "@/lib/validators";

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body", 400);

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid profile data", 400);
  }

  const { name, avatarUrl } = parsed.data;

  const data: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) {
    data.name = name.trim().slice(0, 120);
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl === null) {
      data.avatarUrl = null;
    } else if (typeof avatarUrl === "string") {
      if (avatarUrl.startsWith("data:image/")) {
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
