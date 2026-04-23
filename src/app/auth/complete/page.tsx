"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { setAuthState } from "@/lib/authClient";
import { switchSettingsUser } from "@/hooks/useSettings";

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
        const res = await fetch("/api/auth/google/exchange", { method: "POST", credentials: "include" });
        if (!res.ok) {
          router.replace("/?error=oauth_exchange");
          return;
        }
        const data = await res.json();
        setAuthState({
          user: data.user,
          tokens: {
            accessToken: data.accessToken,
          },
          workspaces: data.workspaces,
          activeWorkspaceId: data.activeWorkspaceId,
        });
        if (data.user?.id) {
          switchSettingsUser(data.user.id);
        }
        router.replace("/");
      } catch {
        router.replace("/?error=oauth_exchange");
      }
    })();
  }, [router]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6"
      style={{ background: "var(--es-chalk, #FAF7F2)" }}
    >
      {/* ExpenStream wordmark */}
      <p
        className="font-display italic text-2xl"
        style={{
          color: "var(--accent)",
          animation: "es-fade-in 0.4s ease forwards",
        }}
      >
        ExpenStream
      </p>

      {/* Three-dot ambient breath — Watcher signature */}
      <div className="flex items-center gap-2" aria-label="Signing you in" role="status">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width: 7,
              height: 7,
              background: "var(--accent)",
              animation: `es-dot-pulse 1.6s ${i * 0.28}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Tagline — delayed fade */}
      <p
        className="font-body-terrain text-sm"
        style={{
          color: "var(--text-muted)",
          animation: "es-fade-in 0.5s 0.8s ease both",
        }}
      >
        Getting your space ready.
      </p>

      <style>{`
        @keyframes es-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes es-dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50%       { opacity: 0.8; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
