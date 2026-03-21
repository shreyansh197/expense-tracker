"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, UserPlus } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { getSyncCode, clearSyncCode } from "@/lib/deviceId";
import { supabase } from "@/lib/supabase";

export function DangerZoneCard() {
  const { resetSettings } = useSettings();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const syncCode = getSyncCode();
  const [deleting, setDeleting] = useState(false);

  const handleStartFresh = async () => {
    const ok = await confirm({
      title: "Start fresh?",
      message:
        "Create a new account or join a different sync code. Your existing data stays safe in the cloud under the old sync code.",
      confirmLabel: "Start Fresh",
      variant: "warning",
    });
    if (!ok) return;
    clearSyncCode();
    resetSettings();
    window.location.href = "/";
  };

  const handleDeleteAll = async () => {
    if (!syncCode) return;
    const ok = await confirm({
      title: "Delete all data",
      message:
        "This will permanently delete ALL your expenses. This cannot be undone.",
      confirmLabel: "Delete Everything",
      variant: "danger",
      requireInput: syncCode,
      requireInputLabel: `Type your sync code (${syncCode}) to confirm:`,
    });
    if (!ok) return;

    setDeleting(true);
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("device_id", syncCode);
    setDeleting(false);

    if (error) {
      toast("Failed to delete data. Try again.", "error");
      console.error("Delete error:", error);
    } else {
      clearSyncCode();
      resetSettings();
      toast("All data deleted.");
      window.location.href = "/";
    }
  };

  return (
    <div className="space-y-4">
      {/* Start Fresh */}
      <div>
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Create a new account or join a different sync code. Your existing data
          stays safe in the cloud.
        </p>
        <button
          onClick={handleStartFresh}
          className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <UserPlus size={16} />
          New User / Switch Account
        </button>
      </div>

      {/* Delete All */}
      {syncCode && (
        <div className="border-t border-red-100 pt-4 dark:border-red-900/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                Delete All Data
              </h3>
              <p className="mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                Permanently delete all expenses linked to your sync code. This
                cannot be undone.
              </p>
              <button
                disabled={deleting}
                onClick={handleDeleteAll}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deleting ? "Deleting..." : "Delete All Expenses"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
