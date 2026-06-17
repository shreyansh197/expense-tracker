import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ExpenStream — Track Every Rupee, Own Every Month",
  description:
    "A beautiful offline-first expense tracker PWA. Set budgets, track categories, get smart insights — all private, all yours.",
};

function FeatureCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5 space-y-2"
      style={{ background: "var(--surface-secondary, #F3EFE8)", borderColor: "var(--border-color, #E2DAD0)" }}
    >
      <div className="text-2xl">{emoji}</div>
      <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary, #1A1B2E)" }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary, #6B6878)" }}>
        {body}
      </p>
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-2xl font-bold tabular-nums"
        style={{ color: "var(--accent, #2E7D5E)", fontFamily: "var(--font-sora, sans-serif)" }}
      >
        {value}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted, #9E9BAE)" }}>
        {label}
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--es-chalk, #FAF7F2)", color: "var(--text-primary, #1A1B2E)" }}
    >
      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
        <span
          className="font-bold text-lg tracking-tight"
          style={{ fontFamily: "var(--font-sora, sans-serif)", color: "var(--accent, #2E7D5E)" }}
        >
          ExpenStream
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary, #6B6878)" }}
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-white"
            style={{ background: "var(--accent, #2E7D5E)" }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="px-6 pt-12 pb-10 max-w-2xl mx-auto text-center">
        <div
          className="inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4"
          style={{ background: "var(--accent-soft, #D4EDDF)", color: "var(--accent, #2E7D5E)" }}
        >
          Free · No ads · Offline-first
        </div>
        <h1
          className="text-4xl font-bold leading-tight mb-4"
          style={{ fontFamily: "var(--font-sora, sans-serif)" }}
        >
          Track every rupee.
          <br />
          <span style={{ color: "var(--accent, #2E7D5E)" }}>Own every month.</span>
        </h1>
        <p className="text-base leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: "var(--text-secondary, #6B6878)" }}>
          ExpenStream is a beautiful expense tracker that works offline, respects your privacy, and gives you
          real insights — not spreadsheet overload.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="rounded-2xl px-8 py-3.5 text-sm font-bold text-white text-center transition-all active:scale-95 hover:opacity-90"
            style={{ background: "var(--accent, #2E7D5E)" }}
          >
            Start tracking free →
          </Link>
          <Link
            href="/login"
            className="rounded-2xl px-8 py-3.5 text-sm font-semibold text-center border transition-colors hover:bg-[var(--surface-secondary)]"
            style={{ borderColor: "var(--border-color, #E2DAD0)", color: "var(--text-secondary, #6B6878)" }}
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────── */}
      <section
        className="mx-6 max-w-2xl md:mx-auto rounded-3xl p-6 mb-10"
        style={{ background: "var(--surface-secondary, #F3EFE8)", border: "1px solid var(--border-color, #E2DAD0)" }}
      >
        <div className="grid grid-cols-3 gap-4 divide-x" style={{ borderColor: "var(--border-color, #E2DAD0)" }}>
          <StatPill value="100%" label="Offline ready" />
          <StatPill value="0" label="Ads or trackers" />
          <StatPill value="AES" label="256 encrypted" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="px-6 pb-12 max-w-2xl mx-auto">
        <h2
          className="text-xs font-bold uppercase tracking-widest text-center mb-6"
          style={{ color: "var(--text-muted, #9E9BAE)" }}
        >
          Everything you need
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            emoji="📊"
            title="Smart Analytics"
            body="Month-over-month comparisons, year-over-year charts, category velocity, and spending forecasts."
          />
          <FeatureCard
            emoji="🔔"
            title="Budget Alerts"
            body="Get notified when you hit 75% or 100% of your budget. Bill reminders so nothing sneaks up on you."
          />
          <FeatureCard
            emoji="🔁"
            title="Recurring Expenses"
            body="Set up monthly bills and subscriptions once. ExpenStream tracks them automatically every month."
          />
          <FeatureCard
            emoji="📤"
            title="Export Anywhere"
            body="Export your data as CSV, JSON, Excel, or PDF. Your data is always yours — no lock-in."
          />
          <FeatureCard
            emoji="🌐"
            title="Multi-Currency"
            body="Travel or work internationally? Log expenses in any currency with live exchange rate conversion."
          />
          <FeatureCard
            emoji="🔐"
            title="Private by Default"
            body="PIN lock, 2FA, passkeys, AES-256 encryption. Your finances stay between you and your device."
          />
          <FeatureCard
            emoji="⚡"
            title="Offline First"
            body="Works with zero internet. Changes sync instantly when you're back online — across all your devices."
          />
          <FeatureCard
            emoji="🎯"
            title="Savings Goals"
            body="Define goals, track progress, and celebrate milestones. Turn intentions into achievements."
          />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section
        className="mx-6 max-w-2xl md:mx-auto rounded-3xl p-6 mb-10"
        style={{ background: "var(--surface-secondary, #F3EFE8)", border: "1px solid var(--border-color, #E2DAD0)" }}
      >
        <h2
          className="text-xs font-bold uppercase tracking-widest text-center mb-6"
          style={{ color: "var(--text-muted, #9E9BAE)" }}
        >
          Up and running in 60 seconds
        </h2>
        <div className="space-y-4">
          {[
            { n: "1", title: "Create your account", body: "Sign up with email or Google. No credit card." },
            { n: "2", title: "Set your budget", body: "Enter your monthly income and category budgets." },
            { n: "3", title: "Log expenses", body: "Add expenses in 2 taps. Categories auto-suggest." },
            { n: "4", title: "Watch insights appear", body: "Smart tips, forecasts, and streaks motivate you." },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--accent, #2E7D5E)" }}
              >
                {step.n}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary, #1A1B2E)" }}>
                  {step.title}
                </p>
                <p className="text-xs" style={{ color: "var(--text-secondary, #6B6878)" }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="px-6 pb-16 max-w-2xl mx-auto text-center">
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-sora, sans-serif)" }}
        >
          Ready to take control?
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary, #6B6878)" }}>
          Free forever. Install as an app on any device.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-2xl px-10 py-4 text-sm font-bold text-white transition-all active:scale-95 hover:opacity-90"
          style={{ background: "var(--accent, #2E7D5E)" }}
        >
          Start for free →
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer
        className="border-t px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-2xl mx-auto text-xs"
        style={{ borderColor: "var(--border-color, #E2DAD0)", color: "var(--text-muted, #9E9BAE)" }}
      >
        <span>© {new Date().getFullYear()} ExpenStream</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/login" className="hover:underline">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
