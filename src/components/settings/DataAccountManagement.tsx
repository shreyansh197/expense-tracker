"use client";

import { useState } from "react";
import { Download, LogOut, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authFetch, getActiveWorkspaceId } from "@/lib/authClient";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const COPY = {
  dataMgmtTitle: "Data & Account Management",
  resetSwitchTitle: "Reset / Switch",
  resetSwitchHelp:
    "Create a new account or join a different workspace. Your current data remains available in this workspace.",
  exportBackupTitle: "Export / Backup",
  exportBackupHelp:
    "Download your data or import from a backup before making significant changes.",
  deleteWorkspaceTitle: "Delete Workspace Data",
  deleteWorkspaceHelp:
    "Permanently delete all expenses, ledgers, and attachments in this workspace. This action cannot be undone.",
  confirmDeletePrompt: "Type the workspace name to confirm.",
  confirmDeleteCta: "Delete Workspace Data",
};

interface DataAccountManagementProps {
  onScrollToExport?: () => void;
}

export function DataAccountManagement({ onScrollToExport }: DataAccountManagementProps) {
  const { logout, workspaces, activeWorkspaceId } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [deleting, setDeleting] = useState(false);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceName = activeWorkspace?.name ?? "My Expenses";
  const isOwner = activeWorkspace?.role === "OWNER";

  const handleResetSwitch = async () => {
    const ok = await confirm({
      title: COPY.resetSwitchTitle,
      message: COPY.resetSwitchHelp,
      confirmLabel: "Log Out & Switch",
      variant: "warning",
    });
    if (!ok) return;
    await logout();
  };

  const handleExportFirst = () => {
    if (onScrollToExport) {
      onScrollToExport();
    } else {
      // Scroll to export section via hash
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
      {/* ─── Reset / Switch ─── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {COPY.resetSwitchTitle}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {COPY.resetSwitchHelp}
        </p>
        <button
          onClick={handleResetSwitch}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <LogOut size={16} />
          Log Out &amp; Switch Account
        </button>
      </div>

      {/* ─── Export / Backup ─── */}
      <div className="border-t border-gray-100 pt-5 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {COPY.exportBackupTitle}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {COPY.exportBackupHelp}
        </p>
        <button
          onClick={handleExportFirst}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <Download size={16} />
          Go to Export &amp; Import
        </button>
      </div>

      {/* ─── Delete Workspace Data ─── */}
      {isOwner && (
        <div className="border-t border-red-100 pt-5 dark:border-red-900/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                {COPY.deleteWorkspaceTitle}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {COPY.deleteWorkspaceHelp}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportFirst}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                >
                  <Download size={14} />
                  Export first
                </button>
                <button
                  disabled={deleting}
                  onClick={handleDeleteWorkspaceData}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
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
