import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p
        className="text-6xl font-bold tabular-nums"
        style={{ color: "var(--text-muted)" }}
      >
        404
      </p>
      <h2
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Page not found
      </h2>
      <Link
        href="/"
        className="text-sm font-medium transition-colors"
        style={{ color: "var(--accent)" }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
