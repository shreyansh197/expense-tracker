"use client";

import { useMemo, useState } from "react";
import { Trash2, Banknote, CreditCard, Smartphone, FileText, HelpCircle, X, Hash, StickyNote, Calendar, TrendingUp } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Payment, PaymentMethod } from "@/types";

const methodIcons: Record<PaymentMethod, typeof Banknote> = {
  bank_transfer: CreditCard,
  upi: Smartphone,
  cash: Banknote,
  cheque: FileText,
  other: HelpCircle,
};

const methodLabels: Record<PaymentMethod, string> = {
  bank_transfer: "Bank Transfer",
  upi: "UPI",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
};

const methodColors: Record<PaymentMethod, string> = {
  bank_transfer: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  upi: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  cash: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  cheque: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  other: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

interface PaymentWithRunning extends Payment {
  runningTotal: number;
}

interface PaymentListProps {
  payments: Payment[];
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Detail Modal ──────────────────────────────────────────────
function PaymentDetailModal({
  payment,
  onClose,
  onDelete,
}: {
  payment: PaymentWithRunning;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const Icon = payment.method ? methodIcons[payment.method] : HelpCircle;
  const { formatCurrency } = useCurrency();
  const colorClass = payment.method ? methodColors[payment.method] : methodColors.other;

  function handleDelete() {
    onDelete(payment.id);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl shadow-2xl
                    sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        style={{ background: 'var(--surface)', animation: 'et-screen-in 0.22s ease both' }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Payment Details
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Close payment details"
          >
            <X size={18} />
          </button>
        </div>

        {/* Amount hero */}
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-900/20">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(payment.amount)}
            </p>
            {payment.method && (
              <p className="text-xs text-emerald-600/70 dark:text-emerald-500">
                via {methodLabels[payment.method]}
              </p>
            )}
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-0 divide-y px-5" style={{ borderColor: 'var(--border)' }}>
          <DetailRow icon={<Calendar size={14} />} label="Date" value={formatDate(payment.date)} />
          {payment.method && (
            <DetailRow
              icon={<Icon size={14} />}
              label="Payment Method"
              value={methodLabels[payment.method]}
            />
          )}
          {payment.reference && (
            <DetailRow
              icon={<Hash size={14} />}
              label="Reference / Txn ID"
              value={payment.reference}
              mono
            />
          )}
          {payment.notes && (
            <DetailRow
              icon={<StickyNote size={14} />}
              label="Notes"
              value={payment.notes}
              multiline
            />
          )}
          <DetailRow
            icon={<TrendingUp size={14} />}
            label="Running Total"
            value={formatCurrency(payment.runningTotal)}
          />
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 pt-4">
          <button
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <Trash2 size={15} />
            Delete Payment
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono = false,
  multiline = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 shrink-0" style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        <p
          className={`mt-0.5 text-sm ${mono ? "font-mono" : ""} ${multiline ? "whitespace-pre-wrap" : "break-all"}`}
          style={{ color: 'var(--text-secondary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Payment List ──────────────────────────────────────────────
export function PaymentList({ payments, onDelete }: PaymentListProps) {
  const { formatCurrency } = useCurrency();
  const [selected, setSelected] = useState<PaymentWithRunning | null>(null);

  const withRunning = useMemo(() => {
    if (payments.length === 0) return [];
    let total = 0;
    return [...payments]
      .reverse()
      .map((p) => {
        total += p.amount;
        return { ...p, runningTotal: total };
      })
      .reverse();
  }, [payments]);

  if (payments.length === 0) {
    return (
      <p className="py-6 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
        No payments logged yet
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {withRunning.map((p) => {
          const Icon = p.method ? methodIcons[p.method] : HelpCircle;
          const iconColor = p.method ? methodColors[p.method] : methodColors.other;

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected(p)}
              onKeyDown={(e) => e.key === "Enter" && setSelected(p)}
              className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition
                         hover:opacity-80 active:opacity-70"
              style={{ ['--hover-bg' as string]: 'var(--surface-secondary)' }}
            >
              {/* Method icon */}
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconColor}`}>
                <Icon size={15} />
              </div>

              {/* Info block */}
              <div className="min-w-0 flex-1">
                {/* Amount */}
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(p.amount)}
                </p>

                {/* Method badge */}
                {p.method && (
                  <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium ${iconColor}`}>
                    {methodLabels[p.method]}
                  </span>
                )}

                {/* Date */}
                <p className="mt-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDate(p.date)}
                </p>

                {/* Reference */}
                {p.reference && (
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Ref:</span>{" "}
                    {p.reference}
                  </p>
                )}

                {/* Notes preview */}
                {p.notes && (
                  <p className="mt-0.5 truncate text-[11px] italic" style={{ color: 'var(--text-tertiary)' }}>
                    {p.notes}
                  </p>
                )}
              </div>

              {/* Running total */}
              <div className="shrink-0 text-right">
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Running</p>
                <p className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(p.runningTotal)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selected && (
        <PaymentDetailModal
          payment={selected}
          onClose={() => setSelected(null)}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
