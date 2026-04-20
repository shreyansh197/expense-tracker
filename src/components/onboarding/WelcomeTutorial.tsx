"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { ClearingScene } from "@/components/ui/illustrations/terrain/ClearingScene";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";

/* ── 5-Screen Onboarding Flow ────────────────────────────── */

const CONTENT_SCREENS = [
  {
    key: "welcome",
    title: "Welcome to\nExpenStream.",
    body: "A calm place to understand where your money goes.",
    illustration: true,
  },
  {
    key: "log",
    title: "Log an expense.",
    body: "Tap the + button to record what you spend. It takes seconds.",
    tips: ["Swipe left or right to browse months", "Set a budget to unlock forecasts"],
  },
  {
    key: "setup",
    title: "Quick setup.",
    body: "Choose your currency and set a monthly budget. You can always change these later in Settings.",
    interactive: true,
  },
  {
    key: "insights",
    title: "See your\ninsights.",
    body: "Charts and patterns emerge as your spending history grows. The more you track, the clearer the picture.",
    tips: ["Categories colour your spending", "Recurring expenses are detected automatically"],
  },
  {
    key: "done",
    title: "You're all set.",
    body: "Start tracking and make this space yours.",
    final: true,
  },
] as const;

const TOTAL_SCREENS = CONTENT_SCREENS.length;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

/* ── Component ────────────────────────────────────────────── */

interface WelcomeTutorialProps {
  onComplete: () => void;
  onSetup?: (currency: string, budget: number) => void;
}

export function WelcomeTutorial({ onComplete, onSetup }: WelcomeTutorialProps) {
  const [screen, setScreen] = useState(-1); // -1 = splash
  const [dir, setDir] = useState(1);
  const [currency, setCurrency] = useState("INR");
  const [budgetInput, setBudgetInput] = useState("");
  const isLast = screen === TOTAL_SCREENS - 1;

  // Splash auto-advance after 2s
  useEffect(() => {
    if (screen !== -1) return;
    const t = setTimeout(() => { setDir(1); setScreen(0); }, 2000);
    return () => clearTimeout(t);
  }, [screen]);

  const commitSetup = useCallback(() => {
    const budget = parseFloat(budgetInput) || 0;
    onSetup?.(currency, budget);
  }, [currency, budgetInput, onSetup]);

  const next = () => {
    if (isLast) { commitSetup(); onComplete(); return; }
    // Persist setup when leaving the setup screen
    if (CONTENT_SCREENS[screen]?.key === "setup") commitSetup();
    setDir(1);
    setScreen((s) => s + 1);
  };
  const back = () => { setDir(-1); setScreen((s) => Math.max(0, s - 1)); };

  /* ── Splash screen ─────────────────────────────────────── */
  if (screen === -1) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ background: "var(--es-chalk, #FAF7F2)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="block w-2.5 h-2.5 rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.15, 0.8] }}
                transition={{ duration: 2, delay: i * 0.35, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
          <h1 className="font-display italic text-2xl" style={{ color: "var(--text-primary)" }}>
            ExpenStream
          </h1>
        </motion.div>
      </div>
    );
  }

  const current = CONTENT_SCREENS[screen];
  const currencyMeta = SUPPORTED_CURRENCIES.find((c) => c.code === currency) ?? SUPPORTED_CURRENCIES[0];

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      aria-modal="true"
      role="dialog"
      style={{
        background: "var(--es-chalk, #FAF7F2)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Skip button */}
      <div className="flex justify-end p-4">
        <button
          onClick={onComplete}
          className="rounded-lg p-2 min-h-11 min-w-11 flex items-center justify-center"
          style={{ color: "var(--text-muted)" }}
          aria-label="Skip onboarding"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={screen}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full max-w-sm text-center"
          >
            {/* Illustration on first screen */}
            {"illustration" in current && current.illustration && (
              <div className="mb-8 flex justify-center">
                <ClearingScene className="w-48 h-48 opacity-80" />
              </div>
            )}

            {/* Final screen dots */}
            {"final" in current && current.final && (
              <div className="flex justify-center gap-2 mb-6" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block w-2.5 h-2.5 rounded-full"
                    style={{ background: "var(--accent)", opacity: 0.6 }}
                  />
                ))}
              </div>
            )}

            <h2
              className="font-display italic whitespace-pre-line"
              style={{ color: "var(--text-primary)", fontSize: "1.5rem", lineHeight: 1.25 }}
            >
              {current.title}
            </h2>

            <p
              className="mt-3 text-sm leading-relaxed font-body-terrain"
              style={{ color: "var(--text-secondary)" }}
            >
              {current.body}
            </p>

            {/* Interactive setup screen */}
            {"interactive" in current && current.interactive && (
              <div className="mt-6 space-y-5 text-left">
                {/* Currency selector */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-tertiary)" }}>
                    Currency
                  </label>
                  <div className="flex gap-2">
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => setCurrency(c.code)}
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                        style={{
                          background: currency === c.code ? "var(--accent)" : "var(--surface-secondary)",
                          color: currency === c.code ? "#fff" : "var(--text-secondary)",
                          border: currency === c.code ? "1px solid transparent" : "1px solid var(--border)",
                        }}
                      >
                        {c.symbol} {c.code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget input */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-tertiary)" }}>
                    Monthly budget
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {currencyMeta.symbol}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={budgetInput}
                      onChange={(e) => setBudgetInput(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full rounded-xl py-3 pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                      aria-label="Monthly budget amount"
                    />
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    Optional — you can skip this and set it later.
                  </p>
                </div>
              </div>
            )}

            {/* Tips */}
            {"tips" in current && current.tips && (
              <div className="mt-5 grid grid-cols-1 gap-2">
                {current.tips.map((tip) => (
                  <div
                    key={tip}
                    className="rounded-2xl px-4 py-3 text-left text-xs leading-snug font-body-terrain"
                    style={{
                      background: "var(--surface, rgba(61,90,62,0.04))",
                      border: "1px solid var(--border, rgba(61,90,62,0.08))",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + buttons */}
      <div className="px-8 pb-8">
        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {CONTENT_SCREENS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === screen ? 20 : 6,
                background: i === screen ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {screen > 0 && (
            <button
              onClick={back}
              className="flex-1 rounded-full px-4 py-3 text-sm font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-3 text-sm font-medium text-white transition-all active:scale-95"
            style={{ background: "var(--accent)" }}
          >
            {isLast ? "Get started" : screen === 0 ? "Begin" : "Next"}
            {!isLast && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
