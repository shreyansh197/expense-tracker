"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { ClearingScene } from "@/components/ui/illustrations/terrain/ClearingScene";

/* ── 4-Screen "Arrival" Flow ─────────────────────────────── */

const SCREENS = [
  {
    title: "Welcome to\nthe clearing.",
    body: "A calm place to understand where your money goes.",
    illustration: true,
  },
  {
    title: "Drop a stone.",
    body: "Each expense is a stone dropped into the stream. Tap the button below to log what you spend.",
    tips: ["Swipe months to browse history", "Set a budget to unlock forecasts"],
  },
  {
    title: "Explore the\noverlook.",
    body: "Charts and patterns emerge as your stream of expenses grows. The more you track, the clearer the view.",
    tips: ["Categories colour your spending", "Recurring expenses are detected automatically"],
  },
  {
    title: "Your clearing\nawaits.",
    body: "Start tracking and make this space yours.",
    final: true,
  },
] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

/* ── Component ────────────────────────────────────────────── */

interface WelcomeTutorialProps {
  onComplete: () => void;
}

export function WelcomeTutorial({ onComplete }: WelcomeTutorialProps) {
  const [screen, setScreen] = useState(-1); // -1 = splash
  const [dir, setDir] = useState(1);
  const isLast = screen === SCREENS.length - 1;

  // Splash auto-advance after 2s
  useEffect(() => {
    if (screen !== -1) return;
    const t = setTimeout(() => { setDir(1); setScreen(0); }, 2000);
    return () => clearTimeout(t);
  }, [screen]);

  const next = () => {
    if (isLast) { onComplete(); return; }
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
                style={{ background: "var(--es-moss, #3D5A3E)" }}
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

  const current = SCREENS[screen];

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
                    style={{ background: "var(--es-moss, #3D5A3E)", opacity: 0.6 }}
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
          {SCREENS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === screen ? 20 : 6,
                background: i === screen ? "var(--es-moss, #3D5A3E)" : "var(--border)",
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
            style={{ background: "var(--es-moss, #3D5A3E)" }}
          >
            {isLast ? "Enter the clearing" : screen === 0 ? "Begin" : "Next"}
            {!isLast && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
