"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { User } from "lucide-react";

export function AccountCard() {
  const { user, workspaces, activeWorkspaceId, switchWorkspace } = useAuth();

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
    </div>
  );
}
