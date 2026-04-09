"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-sm rounded-2xl p-8 shadow-xl text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-200 dark:ring-emerald-800/40">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Password Reset!
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => router.replace("/")}
            className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 50%, var(--accent) 100%)",
              boxShadow: "0 6px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
            }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm rounded-2xl p-8 shadow-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef0ff] dark:bg-[rgba(123,135,255,0.15)] ring-1 ring-[#c7cbff] dark:ring-[#4C5CFF]/40">
          <KeyRound className="h-5 w-5 text-[#4C5CFF] dark:text-[#7B87FF]" />
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Set new password
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 mb-7">
          Enter your new password below. Must be at least 8 characters.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              className="w-full rounded-xl py-3.5 pl-10 pr-11 text-sm transition-all focus:outline-none focus:ring-2 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl py-3.5 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)", color: "var(--text-primary)", "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e); }}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/40">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 50%, var(--accent) 100%)",
              boxShadow: "0 6px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Reset Password
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-4">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="font-medium hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
