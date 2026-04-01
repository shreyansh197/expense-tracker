"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setAuthState } from "@/lib/authClient";

/**
 * /auth/complete
 * Landed on after Google OAuth callback. Exchanges the httpOnly temp
 * token cookie for full auth data, stores it in localStorage, then
 * redirects to the dashboard.
 */
export default function AuthCompletePage() {
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/google/exchange", { method: "POST" });
        if (!res.ok) {
          router.replace("/?error=oauth_exchange");
          return;
        }
        const data = await res.json();
        setAuthState({
          user: data.user,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          workspaces: data.workspaces,
          activeWorkspaceId: data.activeWorkspaceId,
        });
        router.replace("/");
      } catch {
        router.replace("/?error=oauth_exchange");
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Signing you in…</p>
      </div>
    </div>
  );
}
