"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authFetch } from "@/lib/authClient";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [preview, setPreview] = useState<{
    workspaceName: string;
    role: string;
    invitedBy: string;
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    async function loadPreview() {
      const res = await fetch(`/api/invites/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Invalid invite link");
        return;
      }
      setPreview(await res.json());
    }
    loadPreview();
  }, [token]);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Redirect to register/login with invite context
      router.push(`/login?invite=${token}`);
      return;
    }

    setAccepting(true);
    const res = await authFetch(`/api/invites/${token}/accept`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to accept invite");
      setAccepting(false);
      return;
    }

    setAccepted(true);
    setTimeout(() => router.push("/"), 1500);
  };

  // ── Error state ────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Invite Not Available
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 mx-auto text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Loading state ──────────────────────────────────────────

  if (!preview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Joined Successfully!
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Redirecting to {preview.workspaceName}...
          </p>
        </div>
      </div>
    );
  }

  // ── Preview state ──────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900 mx-auto mb-4">
          <Users className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
        </div>

        <h2 className="text-center text-lg font-bold text-slate-900 dark:text-white mb-1">
          You&apos;re Invited!
        </h2>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
          {preview.invitedBy} invited you to join
        </p>

        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800 mb-6">
          <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {preview.workspaceName}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="h-3.5 w-3.5" />
            You&apos;ll join as {preview.role.toLowerCase()}
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isAuthenticated ? "Accept Invite" : "Sign In to Accept"}
        </button>
      </div>
    </div>
  );
}
