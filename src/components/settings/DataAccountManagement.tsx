"use client";

import { useState } from "react";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const COPY = {
  dataMgmtTitle: "Workspace Removal",
  deleteWorkspaceTitle: "Workspace Removal",
  deleteWorkspaceHelp:
    "Permanently remove all expenses, ledgers, and attachments in this workspace. This action cannot be undone.",
  confirmDeletePrompt: "Type the workspace name to confirm.",
  confirmDeleteCta: "Remove All Data",
};

interface DataAccountManagementProps {
  onScrollToExport?: () => void;
}

export function DataAccountManagement({ onScrollToExport }: DataAccountManagementProps) {
  const { workspaces, activeWorkspaceId } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [deleting, setDeleting] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceName = activeWorkspace?.name ?? "My Expenses";
  const isOwner = activeWorkspace?.role === "OWNER";

  const handleExportFirst = () => {
    if (onScrollToExport) {
      onScrollToExport();
    } else {
      const el = document.getElementById("section-export-import");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDeleteWorkspaceData = async () => {
    const wid = getActiveWorkspaceId();
    if (!wid) return;

    const ok = await confirm({
      title: COPY.deleteWorkspaceTitle,
      message: `${COPY.deleteWorkspaceHelp}\n\n${COPY.confirmDeletePrompt}`,
      confirmLabel: COPY.confirmDeleteCta,
      variant: "danger",
      requireInput: workspaceName,
      requireInputLabel: `Type "${workspaceName}" to confirm:`,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await authFetch(`/api/workspaces/${wid}/data`, {
        method: "DELETE",
      });
      if (res.ok) {
        // Clear local storage keys for settings, goals, recurring, smart rules
        const keysToRemove = [
          "expenstream-auto-rules",
          "expenstream-recurring-applied",
          "expenstream-last-category",
          "expenstream-kpi-expanded",
          "expenstream-expenses-sort",
        ];
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        // Settings keys are user-scoped (expenstream-settings or expenstream-settings-{userId})
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key?.startsWith("expenstream-settings")) localStorage.removeItem(key);
        }
        toast("All workspace data has been deleted.");
        // Force a full page reload to reset all client state
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Failed to delete data. Try again.", "error");
      }
    } catch {
      toast("Failed to delete data. Try again.", "error");
    }
    setDeleting(false);
  };

  return (
    <div className="space-y-5">
      {/* ─── Delete Workspace Data ─── */}
      {isOwner && (
        <div className="border-t border-red-100 pt-5 dark:border-red-900/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                {COPY.deleteWorkspaceTitle}
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                {COPY.deleteWorkspaceHelp}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportFirst}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <Download size={14} />
                  Export first
                </button>
                <button
                  disabled={deleting}
                  onClick={handleDeleteWorkspaceData}
                  className="flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors dark:border-red-500 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white"
                >
                  <Trash2 size={14} />
                  {deleting ? "Deleting..." : COPY.confirmDeleteCta}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
