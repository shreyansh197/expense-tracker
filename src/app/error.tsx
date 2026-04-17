"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { FallenLog } from "@/components/ui/illustrations/terrain/FallenLog";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background: "var(--es-chalk, #FAF7F2)" }}
    >
      <FallenLog className="w-32 h-32 opacity-70" />

      <div className="space-y-2">
        <h1
          className="font-display italic text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          Something shifted underfoot.
        </h1>
        <p
          className="max-w-xs text-sm font-body-terrain"
          style={{ color: "var(--text-secondary)" }}
        >
          An unexpected error occurred. Your data is safe — this was a momentary stumble.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-all active:scale-95"
          style={{ background: "var(--es-moss, #3D5A3E)" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full px-5 py-2.5 text-sm font-medium transition-all hover:opacity-70"
          style={{ color: "var(--text-secondary)" }}
        >
          Head back
        </Link>
      </div>
    </div>
  );
}
