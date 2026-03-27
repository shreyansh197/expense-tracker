"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Smartphone, Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { authFetch } from "@/lib/authClient";

export default function DeviceLinkPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      router.push(`/login?device-link=${token}`);
      return;
    }

    setAccepting(true);
    const res = await authFetch(`/api/devices/accept/${token}`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to link device");
      setAccepting(false);
      return;
    }

    setAccepted(true);
    setTimeout(() => router.push("/"), 1500);
  };

  // Auto-accept if already authenticated
  useEffect(() => {
    if (isAuthenticated && !accepting && !accepted && !error) {
      handleAccept();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl text-center" style={{ background: 'var(--surface)' }}>
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Device Link Failed
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
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

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl text-center" style={{ background: 'var(--surface)' }}>
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Device Linked!
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl text-center" style={{ background: 'var(--surface)' }}>
        <Smartphone className="mx-auto h-12 w-12 text-indigo-500 mb-4" />
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Link This Device
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {isAuthenticated
            ? "Connecting this device to your workspace..."
            : "Sign in to link this device to your account."}
        </p>

        {!isAuthenticated && (
          <button
            onClick={handleAccept}
            className="w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Sign In to Link
          </button>
        )}

        {isAuthenticated && accepting && (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
        )}
      </div>
    </div>
  );
}
