"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--danger-soft)" }}
      >
        <AlertTriangle size={28} style={{ color: "var(--danger)" }} />
      </div>
      <h2
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Something went wrong
      </h2>
      <p className="max-w-sm text-sm" style={{ color: "var(--text-secondary)" }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        style={{
          background: "var(--surface-secondary)",
          color: "var(--text-primary)",
        }}
      >
        <RefreshCw size={14} />
        Try Again
      </button>
    </div>
  );
}
