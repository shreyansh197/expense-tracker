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
      className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800"
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Logs out the current session only.{" "}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("settings:open-section", { detail: "security" }));
              requestAnimationFrame(() => {
                document.getElementById("header-security")?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 underline"
          >
            Log out of all devices
          </button>
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-6 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 sm:w-auto"
        >
          <LogOut size={16} />
          {loggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>
    </div>
  );
}
