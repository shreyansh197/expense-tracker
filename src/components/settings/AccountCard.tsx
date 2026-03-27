"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { authFetch, clearAuthState } from "@/lib/authClient";
import { User, Trash2 } from "lucide-react";

const ALL_LOCAL_STORAGE_KEYS = [
  "expense-tracker-auth",
  "expense-tracker-sync-cursor",
  "expense-tracker-offline-mutations",
  "expense-tracker-offline-queue",
  "expense-tracker-recurring-applied",
  "expense-tracker-app-mode",
  "expense-tracker-auto-rules",
  "expense-device-id",
  "theme",
  "spendly-kpi-expanded",
  "spendly-last-category",
  "spendly-expenses-sort",
  "spendly-tutorial-seen",
  "settings:v2:lastOpen",
];

export function AccountCard() {
  const { user, workspaces, activeWorkspaceId, switchWorkspace } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="space-y-4">
      {/* Account Info */}
      <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: 'var(--surface-secondary)' }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <User size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
        </div>
      </div>

      {/* Current Workspace */}
      {activeWorkspace && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Active Workspace</p>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-900/20">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{activeWorkspace.name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{activeWorkspace.role}</p>
          </div>
        </div>
      )}

      {/* Workspace Switcher */}
      {workspaces.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Switch Workspace</p>
          <div className="space-y-1">
            {workspaces
              .filter((w) => w.id !== activeWorkspaceId)
              .map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <span>{w.name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{w.role}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Delete Account */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-red-500">Danger Zone</p>
        <p className="mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Permanently delete your account, all workspaces, expenses, and settings. This cannot be undone.
        </p>
        <button
          onClick={async () => {
            const ok = await confirm({
              title: "Delete Account",
              message: "This will permanently delete your account and all associated data including workspaces, expenses, and settings. Export your data first from Data Management if needed.",
              confirmLabel: "Delete My Account",
              variant: "danger",
              requireInput: user.email,
              requireInputLabel: `Type your email "${user.email}" to confirm`,
            });
            if (!ok) return;
            setDeleting(true);
            try {
              const res = await authFetch("/api/auth/delete-account", { method: "DELETE" });
              if (!res.ok) throw new Error("Failed to delete account");
              // Clear all local data
              ALL_LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
              // Also remove per-user settings keys
              for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key?.startsWith("expense-tracker-settings")) localStorage.removeItem(key);
              }
              clearAuthState();
              window.location.replace("/");
            } catch {
              toast("Failed to delete account. Please try again.");
              setDeleting(false);
            }
          }}
          disabled={deleting}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
