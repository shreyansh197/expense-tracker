"use client";

import { m } from "framer-motion";
import { Check, PlusCircle, BarChart3, Target } from "lucide-react";
import { ClearingScene } from "@/components/ui/illustrations/terrain/ClearingScene";
import Link from "next/link";

interface NewUserChecklistProps {
  userName?: string;
  hasBudget: boolean;
  onAddExpense: () => void;
}

export function NewUserChecklist({ userName, hasBudget, onAddExpense }: NewUserChecklistProps) {
  const completedSteps = hasBudget ? 1 : 0;
  const greeting = userName ? `Welcome, ${userName.split(" ")[0]}!` : "Welcome!";

  return (
    <m.div
      className="card-terrain p-6 space-y-5"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Greeting + illustration */}
      <div className="flex flex-col items-center text-center">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ClearingScene className="mx-auto mb-3 w-36 sm:w-44" />
        </m.div>
        <h2 className="font-display italic text-lg" style={{ color: "var(--text-primary)" }}>
          {greeting}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Let&apos;s get you set up in a few quick steps.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>{completedSteps} of 3 steps complete</span>
          <span>{Math.round((completedSteps / 3) * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
          <m.div
            className="h-full rounded-full"
            style={{ background: "var(--accent)" }}
            initial={{ width: 0 }}
            animate={{ width: `${(completedSteps / 3) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          />
        </div>
      </div>

      {/* Steps checklist */}
      <div className="space-y-2.5">
        {/* Step 1: Set budget */}
        <ChecklistItem
          done={hasBudget}
          icon={Target}
          label="Set a monthly budget"
          sublabel={hasBudget ? "Done — you can adjust in Settings anytime" : undefined}
          action={!hasBudget ? { label: "Set budget", href: "/settings" } : undefined}
        />

        {/* Step 2: Add first expense */}
        <ChecklistItem
          done={false}
          icon={PlusCircle}
          label="Add your first expense"
          sublabel="Takes just a few seconds"
          action={{ label: "Add expense", onClick: onAddExpense }}
          highlighted
        />

        {/* Step 3: Unlock analytics */}
        <ChecklistItem
          done={false}
          icon={BarChart3}
          label="Unlock spending insights"
          sublabel="Add 3 expenses to see trends and patterns"
          disabled
        />
      </div>
    </m.div>
  );
}

/* ── Checklist item sub-component ─────────────────────────── */

interface ChecklistItemProps {
  done: boolean;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  sublabel?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  highlighted?: boolean;
  disabled?: boolean;
}

function ChecklistItem({ done, icon: Icon, label, sublabel, action, highlighted, disabled }: ChecklistItemProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors"
      style={{
        background: highlighted ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "var(--surface-secondary)",
        opacity: disabled ? 0.55 : 1,
        border: highlighted ? "1px solid color-mix(in srgb, var(--accent) 18%, transparent)" : "1px solid transparent",
      }}
    >
      {/* Status circle */}
      <div
        className="flex-shrink-0 mt-0.5 flex items-center justify-center rounded-full w-5 h-5"
        style={{
          background: done ? "var(--accent)" : "var(--surface)",
          border: done ? "none" : "1.5px solid var(--border)",
        }}
      >
        {done ? (
          <Check size={12} className="text-white" />
        ) : (
          <span style={{ color: "var(--text-muted)" }}>
            <Icon size={10} />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: done ? "line-through" : "none" }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {sublabel}
          </p>
        )}
      </div>

      {/* Action */}
      {action && !done && !disabled && (
        action.href ? (
          <Link
            href={action.href}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
