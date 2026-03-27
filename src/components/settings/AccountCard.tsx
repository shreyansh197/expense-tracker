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
      <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <User size={18} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Current Workspace */}
      {activeWorkspace && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Active Workspace</p>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-900/20">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{activeWorkspace.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeWorkspace.role}</p>
          </div>
        </div>
      )}

      {/* Workspace Switcher */}
      {workspaces.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Switch Workspace</p>
          <div className="space-y-1">
            {workspaces
              .filter((w) => w.id !== activeWorkspaceId)
              .map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  <span>{w.name}</span>
                  <span className="text-xs text-slate-400">{w.role}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
