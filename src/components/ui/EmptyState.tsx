"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  secondaryIcon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    color?: "indigo" | "emerald";
  };
}

export function EmptyState({ icon: Icon, secondaryIcon: SecondaryIcon, title, description, action }: EmptyStateProps) {
  const btnColor = action?.color === "emerald"
    ? "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97]"
    : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97]";

  return (
    <div className="fade-in flex flex-col items-center justify-center gap-3 py-16">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-secondary)' }}>
        <Icon size={28} style={{ color: 'var(--text-muted)' }} />
        {SecondaryIcon && (
          <div
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <SecondaryIcon size={14} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        )}
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <p className="max-w-xs text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${btnColor}`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
