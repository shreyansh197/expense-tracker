"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X } from "lucide-react";

/* ── Step definitions ─────────────────────────────────────── */

interface Step {
  /** querySelector to find the target element — desktop variant used at lg+ */
  selector: string;
  selectorDesktop?: string;
  title: string;
  body: string;
  /** If true, show a centered card instead of anchored to an element */
  centered?: boolean;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="fab"]',
    selectorDesktop: '[data-tour="fab-desktop"]',
    title: "Add your first expense",
    body: "Tap this button to log what you spend. Every entry helps ExpenStream track your habits.",
  },
  {
    selector: '[data-tour="dashboard"]',
    title: "Your spending at a glance",
    body: "Switch months here to browse your spending history. You can also swipe left or right anywhere on the screen to jump between months.",
  },
  {
    selector: '[data-tour="nav-settings"]',
    selectorDesktop: '[data-tour="nav-settings-desktop"]',
    title: "Make it yours",
    body: "Set a monthly budget, customise categories, recurring expenses, and savings goals.",
  },
  {
    selector: "",
    title: "Pro tips \u2728",
    body: "\u2022 Swipe left / right to switch months\n\u2022 Press Shift + ? to see all keyboard shortcuts\n\u2022 Enable Business Mode in Settings for ledger tracking & invoices\n\u2022 Set a budget in Settings to unlock forecasts & alerts",
    centered: true,
  },
  {
    selector: "",
    title: "You\u2019re all set!",
    body: "Start tracking your expenses and take control of your finances.",
    centered: true,
  },
];

/* ── Helpers ──────────────────────────────────────────────── */

const PAD = 8; // spotlight padding around the target

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function getTargetRect(step: Step): Rect | null {
  if (step.centered) return null;
  const isDesktop = window.innerWidth >= 1024;
  const sel = isDesktop && step.selectorDesktop ? step.selectorDesktop : step.selector;
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

/* ── Component ────────────────────────────────────────────── */

interface WelcomeTutorialProps {
  onComplete: () => void;
}

export function WelcomeTutorial({ onComplete }: WelcomeTutorialProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const measure = useCallback(() => {
    setRect(getTargetRect(STEPS[step]));
  }, [step]);

  // Measure on step change + scroll/resize
  useEffect(() => {
    const frame = requestAnimationFrame(() => measure());
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Skip step if target element is missing (e.g. FAB hidden on settings page)
  useEffect(() => {
    if (current.centered) return;
    const isDesktop = window.innerWidth >= 1024;
    const sel = isDesktop && current.selectorDesktop ? current.selectorDesktop : current.selector;
    if (!document.querySelector(sel)) {
      const id = requestAnimationFrame(() => {
        if (isLast) onComplete();
        else setStep((s) => s + 1);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [step, current, isLast, onComplete]);

  /* ── Card positioning ───────────────────────────────────── */
  const cardWidth = Math.min(320, (typeof window !== "undefined" ? window.innerWidth : 360) - 32);

  const cardStyle: React.CSSProperties = {};
  if (rect) {
    const targetCenterY = rect.top + rect.height / 2;
    const aboveCenter = targetCenterY < window.innerHeight / 2;
    if (aboveCenter) {
      cardStyle.top = Math.min(rect.top + rect.height + 16, window.innerHeight - 200);
    } else {
      cardStyle.bottom = Math.max(window.innerHeight - rect.top + 16, 16);
    }
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    cardStyle.left = left;
    cardStyle.width = cardWidth;
  }

  const centeredStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: cardWidth,
  };

  return (
    <div className="fixed inset-0 z-[200]" aria-modal="true" role="dialog">
      {/* Overlay with spotlight cutout */}
      {rect ? (
        <div
          className="fixed rounded-xl transition-all duration-300 ease-out"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/60" />
      )}

      {/* Card — always above overlay */}
      <div
        className="fixed z-[201] rounded-2xl p-5 shadow-2xl transition-all duration-300"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          ...(rect ? cardStyle : centeredStyle),
        }}
      >
        {/* Close / Skip */}
        <div className="flex justify-end">
          <button
            onClick={onComplete}
            className="rounded-lg p-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Skip tutorial"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <h2
          className="text-base font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {current.title}
        </h2>
        <p
          className="mt-1.5 whitespace-pre-line text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {current.body}
        </p>

        {/* Dots */}
        <div className="mt-4 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 20 : 6,
                background: i === step ? "var(--accent)" : "var(--border)",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? onComplete() : setStep((s) => s + 1))}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:scale-[0.97]"
          >
            {isLast ? "Get Started" : "Next"}
            {!isLast && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
