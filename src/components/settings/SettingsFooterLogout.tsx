"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";

export function SettingsFooterLogout() {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast("Logged out");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div
        className="mt-6 pt-6"
        style={{ borderTop: '1px solid var(--border)', paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Logs out the current session only.{" "}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("settings:open-section", { detail: "security" }));
              requestAnimationFrame(() => {
                document.getElementById("header-security")?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            className="underline transition-colors"
            style={{ color: 'var(--secondary-text)' }}
          >
            Log out of all devices
          </button>
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 sm:w-auto"
          style={{ borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
    </div>
  );
}
