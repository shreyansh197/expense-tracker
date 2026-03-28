"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/providers/AuthProvider";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { authFetch, clearAuthState, setAuthState, getAuthState } from "@/lib/authClient";
import { User, Trash2, Camera, Eye, EyeOff, Loader2, X, ImagePlus } from "lucide-react";

const ALL_LOCAL_STORAGE_KEYS = [
  // Current keys
  "expenstream-auth",
  "expenstream-sync-cursor",
  "expenstream-offline-mutations",
  "expenstream-offline-queue",
  "expenstream-recurring-applied",
  "expenstream-app-mode",
  "expenstream-auto-rules",
  "expenstream-settings",
  "expenstream-kpi-expanded",
  "expenstream-last-category",
  "expenstream-expenses-sort",
  "expenstream-tutorial-seen",
  "expenstream-migrated",
  // Legacy keys (clear on logout)
  "expense-tracker-auth",
  "expense-tracker-sync-cursor",
  "expense-tracker-offline-mutations",
  "expense-tracker-offline-queue",
  "expense-tracker-recurring-applied",
  "expense-tracker-app-mode",
  "expense-tracker-auto-rules",
  "spendly-kpi-expanded",
  "spendly-last-category",
  "spendly-expenses-sort",
  "spendly-tutorial-seen",
  // Non-branded keys
  "expense-device-id",
  "theme",
  "settings:v2:lastOpen",
];

export function AccountCard() {
  const { user, workspaces, activeWorkspaceId, switchWorkspace } = useAuth();
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  // Password change state
  const [showPwForm, setShowPwForm] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Avatar state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showAvatarPopup, setShowAvatarPopup] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on outside click
  useEffect(() => {
    if (!showAvatarPopup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowAvatarPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAvatarPopup]);

  if (!user) return null;

  const avatarSrc = user.avatarUrl;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be under 5 MB", "error");
      return;
    }

    setAvatarUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setAuthState({ user: { ...getAuthState().user!, avatarUrl: data.user.avatarUrl } });
        toast("Profile picture updated");
        setShowAvatarPopup(false);
      } else {
        toast("Failed to update picture", "error");
      }
    } catch {
      toast("Failed to update picture", "error");
    }
    setAvatarUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try {
      const res = await authFetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (res.ok) {
        setAuthState({ user: { ...getAuthState().user!, avatarUrl: null } });
        toast("Profile picture removed");
        setShowAvatarPopup(false);
      } else {
        toast("Failed to remove picture", "error");
      }
    } catch {
      toast("Failed to remove picture", "error");
    }
    setAvatarUploading(false);
  };

  const handlePasswordChange = async () => {
    if (!newPw || newPw.length < 8) {
      toast("New password must be at least 8 characters", "error");
      return;
    }
    setPwSaving(true);
    try {
      const res = await authFetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw || undefined, newPassword: newPw }),
      });
      if (res.ok) {
        toast("Password updated");
        setShowPwForm(false);
        setCurrentPw("");
        setNewPw("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error ?? "Failed to change password", "error");
      }
    } catch {
      toast("Failed to change password", "error");
    }
    setPwSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Account Info with Avatar */}
      <div className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ background: 'var(--surface-secondary)' }}>
        <div className="relative" ref={popupRef}>
          {/* Avatar — click to view full photo */}
          <button
            type="button"
            onClick={() => avatarSrc ? setShowFullPhoto(true) : setShowAvatarPopup(true)}
            className="block rounded-full transition-opacity hover:opacity-80"
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <User size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
          </button>
          {/* Edit badge */}
          <button
            onClick={() => setShowAvatarPopup(!showAvatarPopup)}
            disabled={avatarUploading}
            className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            {avatarUploading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          {/* Floating popup */}
          {showAvatarPopup && (
            <div
              className="absolute left-0 top-full z-50 mt-2 w-40 animate-in fade-in slide-in-from-top-1 rounded-xl py-1.5 shadow-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {avatarSrc && (
                <button
                  onClick={() => { setShowAvatarPopup(false); setShowFullPhoto(true); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <Eye size={14} style={{ color: 'var(--text-tertiary)' }} />
                  View Photo
                </button>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={avatarUploading}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={e => { if (!avatarUploading) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                <ImagePlus size={14} style={{ color: 'var(--text-tertiary)' }} />
                {avatarUploading ? "Uploading..." : avatarSrc ? "Change Photo" : "Upload Photo"}
              </button>
              {avatarSrc && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 transition-colors dark:text-red-400 disabled:opacity-50"
                  onMouseEnter={e => { if (!avatarUploading) e.currentTarget.style.background = 'var(--surface-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                >
                  <Trash2 size={14} />
                  Remove Photo
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
        </div>
      </div>

      {/* Fullscreen photo viewer — portaled to body to avoid scroll/overflow issues */}
      {showFullPhoto && avatarSrc && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowFullPhoto(false)}
        >
          <button
            onClick={() => setShowFullPhoto(false)}
            className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt={user.name}
            className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}

      {/* Password Change */}
      <div>
        {!showPwForm ? (
          <button
            onClick={() => setShowPwForm(true)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            Change password
          </button>
        ) : (
          <div className="space-y-2 rounded-lg p-3" style={{ background: 'var(--surface-secondary)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</p>
            <div className="relative">
              <input
                type={showCurrentPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password (if set)"
                className="form-input w-full pr-8 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (min 8 chars)"
                className="form-input w-full pr-8 text-xs"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              >
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {pwSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => { setShowPwForm(false); setCurrentPw(""); setNewPw(""); }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

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
                if (key?.startsWith("expenstream-settings") || key?.startsWith("expense-tracker-settings")) localStorage.removeItem(key);
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
