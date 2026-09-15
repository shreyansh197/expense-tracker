"use client";

import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, ArrowLeftRight } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useCurrency } from "@/hooks/useCurrency";
import {
  getPendingMoneyConflicts,
  onMoneyConflictsChange,
  resolveMoneyConflict,
  type ConflictChoice,
  type ConflictEntity,
  type MoneyConflict,
} from "@/lib/syncEngine";

/** Human-readable label for each conflicting entity. */
const ENTITY_LABEL: Record<ConflictEntity, string> = {
  expense: "expense",
  ledger: "ledger",
  payment: "payment",
};

/** Human-readable label for each contested money field. */
const FIELD_LABEL: Record<string, string> = {
  amount: "Amount",
  expectedAmount: "Expected amount",
};

function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? "Amount";
}

/**
 * ConflictReviewSheet — deterministic resolution UI for money-field conflicts.
 *
 * The sync engine never silently overwrites a money field (T-2.3.1); when two
 * devices edit the same `amount`/`expectedAmount` it preserves the local value
 * and registers a pending {@link MoneyConflict}. This sheet surfaces those
 * conflicts one at a time and lets the user pick the winning side — the only
 * path that reconciles a contested money field (`resolveMoneyConflict`).
 *
 * Money is a scalar quantity, so there is no meaningful automatic "merge": the
 * user makes an explicit keep-mine / keep-theirs choice, which is the
 * deterministic contract established in T-2.3.1.
 *
 * Fully keyboard operable (focus-trapped dialog via {@link BottomSheet}) and
 * reduced-motion respectful (BottomSheet honours `prefers-reduced-motion`).
 */
export function ConflictReviewSheet() {
  const { formatCurrency } = useCurrency();
  const [conflicts, setConflicts] = useState<MoneyConflict[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setConflicts(getPendingMoneyConflicts());
    return onMoneyConflictsChange(setConflicts);
  }, []);

  const current = conflicts[0];

  const handleResolve = useCallback(
    async (choice: ConflictChoice) => {
      if (!current || busy) return;
      setBusy(true);
      try {
        await resolveMoneyConflict(current.key, choice);
      } finally {
        setBusy(false);
      }
    },
    [current, busy],
  );

  if (!current) return null;

  const total = conflicts.length;
  const entity = ENTITY_LABEL[current.entity];
  const label = fieldLabel(current.field);

  return (
    <BottomSheet
      open={total > 0}
      onClose={() => { /* Money conflicts must be resolved explicitly, not dismissed. */ }}
      label="Review conflicting amount"
    >
      <div className="px-5 pb-6 pt-2">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--warning-soft)", color: "var(--warning-text)" }}
          >
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              Conflicting {label.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              This {entity} was edited on another device. Choose which value to keep — nothing is
              changed until you pick.
            </p>
          </div>
        </div>

        {total > 1 && (
          <p className="mt-3 text-caption font-medium" style={{ color: "var(--text-muted)" }}>
            1 of {total} conflicts to review
          </p>
        )}

        <div
          className="mt-4 grid grid-cols-2 gap-3"
          role="group"
          aria-label={`${label} comparison`}
        >
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)" }}
          >
            <p className="text-caption font-medium" style={{ color: "var(--text-muted)" }}>
              This device
            </p>
            <p
              className="mt-1 text-lg font-bold text-amount tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(current.localValue)}
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)" }}
          >
            <p className="text-caption font-medium" style={{ color: "var(--text-muted)" }}>
              Other device
            </p>
            <p
              className="mt-1 text-lg font-bold text-amount tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {formatCurrency(current.serverValue)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => handleResolve("mine")}
            disabled={busy}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            Keep this device&rsquo;s value
          </button>
          <button
            type="button"
            onClick={() => handleResolve("theirs")}
            disabled={busy}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-60"
            style={{
              background: "var(--surface-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <ArrowLeftRight size={16} aria-hidden="true" />
            Use the other device&rsquo;s value
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
