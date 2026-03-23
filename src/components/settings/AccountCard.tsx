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
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <User size={18} className="text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        </div>
      </div>

      {/* Current Workspace */}
      {activeWorkspace && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Active Workspace</p>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">{activeWorkspace.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{activeWorkspace.role}</p>
          </div>
        </div>
      )}

      {/* Workspace Switcher */}
      {workspaces.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Switch Workspace</p>
          <div className="space-y-1">
            {workspaces
              .filter((w) => w.id !== activeWorkspaceId)
              .map((w) => (
                <button
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>{w.name}</span>
                  <span className="text-xs text-gray-400">{w.role}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
