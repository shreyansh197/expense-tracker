"use client";

import { useState } from "react";
import {
  PlusCircle,
  PieChart,
  Bell,
  Palette,
  ArrowRight,
  X,
} from "lucide-react";

const STEPS = [
  {
    icon: PlusCircle,
    color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
    title: "Add your first expense",
    body: "Tap the + button at the bottom to log what you spend. Every entry helps Spendly track your habits.",
  },
  {
    icon: PieChart,
    color: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    title: "See where your money goes",
    body: "Your dashboard shows category breakdowns, daily trends, and a month-end forecast — all updating in real time.",
  },
  {
    icon: Bell,
    color: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
    title: "Stay on track",
    body: "Set a monthly budget in Settings to unlock spending alerts, pace targets, and savings insights.",
  },
  {
    icon: Palette,
    color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    title: "Make it yours",
    body: "Customise categories, set recurring expenses, and create savings goals — all from the Settings page.",
  },
];

interface WelcomeTutorialProps {
  onComplete: () => void;
}

export function WelcomeTutorial({ onComplete }: WelcomeTutorialProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Close */}
        <div className="flex justify-end">
          <button
            onClick={onComplete}
            className="rounded-lg p-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Skip tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${current.color}`}>
            <Icon size={28} />
          </div>
        </div>

        {/* Content */}
        <h2
          className="mt-4 text-center text-lg font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {current.title}
        </h2>
        <p
          className="mt-2 text-center text-sm leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          {current.body}
        </p>

        {/* Dots */}
        <div className="mt-5 flex justify-center gap-1.5">
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
        <div className="mt-5 flex gap-2">
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
