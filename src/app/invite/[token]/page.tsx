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
        <div className="w-full max-w-sm card-terrain rounded-2xl p-6">
        <XCircle className="mx-auto h-10 w-10 mb-4" style={{ color: 'var(--danger)' }} />
          <h2 className="font-display italic text-xl mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
            Invite unavailable.
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 mx-auto text-sm text-data hover:underline"
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
        <Loader2 className="h-8 w-8 animate-spin text-data" />
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm card-terrain rounded-2xl p-6 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 mb-4" style={{ color: 'var(--accent)' }} />
          <h2 className="font-display italic text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Joined.
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Redirecting to {preview.workspaceName}...
          </p>
        </div>
      </div>
    );
  }

  // ── Preview state ──────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm card-terrain rounded-2xl p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full mx-auto mb-4" style={{ background: 'var(--es-chalk)', border: '1px solid var(--border)' }}>
          <Users className="h-6 w-6" style={{ color: 'var(--accent)' }} />
        </div>

        <h2 className="text-center font-display italic text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>
          You&apos;re invited.
        </h2>
        <p className="text-center text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {preview.invitedBy} invited you to join
        </p>

        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-secondary)' }}>
          <div className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {preview.workspaceName}
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Shield className="h-3.5 w-3.5" />
            You&apos;ll join as {preview.role.toLowerCase()}
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full rounded-full py-3 text-base font-semibold text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)' }}
        >
          {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isAuthenticated ? "Accept Invite" : "Sign In to Accept"}
        </button>
      </div>
    </div>
  );
}
