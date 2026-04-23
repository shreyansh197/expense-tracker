"use client";

import { useMemo, useState } from "react";
import { Trash2, Banknote, CreditCard, Smartphone, FileText, HelpCircle, X, Hash, StickyNote, Calendar, TrendingUp } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";
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
  bank_transfer: "bg-[var(--biz-pending-bg)] text-[var(--biz-pending-text)]",
  upi: "bg-[var(--biz-upi-bg)] text-[var(--biz-upi-text)]",
  cash: "bg-[var(--biz-cash-bg)] text-[var(--biz-cash-text)]",
  cheque: "bg-[var(--biz-cheque-bg)] text-[var(--biz-cheque-text)]",
  other: "bg-[var(--biz-other-bg)] text-[var(--biz-other-text)]",
};

interface PaymentWithRunning extends Payment {
  runningTotal: number;
}

interface PaymentListProps {
  payments: Payment[];
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
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
  const { confirm } = useConfirm();
  const colorClass = payment.method ? methodColors[payment.method] : methodColors.other;
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete payment?",
      message: `This will permanently remove this ${formatCurrency(payment.amount)} payment.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    onDelete(payment.id);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Sheet — slides up from bottom on mobile, centered on desktop */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Payment details"
        className="fixed bottom-0 left-0 right-0 z-[201] rounded-t-2xl shadow-2xl
                    sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        style={{ background: 'var(--surface)', paddingBottom: 'env(safe-area-inset-bottom, 0px)', animation: 'et-screen-in 0.22s ease both' }}
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
        <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--biz-accent-soft)' }}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xl font-bold" style={{ color: 'var(--biz-accent-text)' }}>
              {formatCurrency(payment.amount)}
            </p>
            {payment.method && (
              <p className="text-xs" style={{ color: 'var(--biz-accent-text)', opacity: 0.7 }}>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition"
            style={{ borderColor: 'var(--danger-border)', color: 'var(--danger-text)' }}
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
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
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
      <div className="flex flex-col items-center gap-2 py-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
          <CreditCard size={20} style={{ color: 'var(--text-muted)' }} />
        </div>
        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>No payments logged yet</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Payments will appear here once recorded</p>
      </div>
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
                <p className="text-sm font-bold text-amount" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(p.amount)}
                </p>

                {/* Method badge */}
                {p.method && (
                  <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-caption font-medium ${iconColor}`}>
                    {methodLabels[p.method]}
                  </span>
                )}

                {/* Date */}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {formatDate(p.date)}
                </p>

                {/* Reference */}
                {p.reference && (
                  <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Ref:</span>{" "}
                    {p.reference}
                  </p>
                )}

                {/* Notes preview */}
                {p.notes && (
                  <p className="mt-0.5 truncate text-xs italic" style={{ color: 'var(--text-tertiary)' }}>
                    {p.notes}
                  </p>
                )}
              </div>

              {/* Running total */}
              <div className="shrink-0 text-right">
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Running</p>
                <p className="text-xs font-medium text-amount" style={{ color: 'var(--text-secondary)' }}>
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
