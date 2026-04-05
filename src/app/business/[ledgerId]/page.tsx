"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowLeft,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useLedgers } from "@/hooks/useLedgers";
import { usePayments } from "@/hooks/usePayments";
import { LedgerProgressRing } from "@/components/business/LedgerProgressRing";
import { PaymentForm } from "@/components/business/PaymentForm";
import { PaymentList } from "@/components/business/PaymentList";
import { LedgerForm } from "@/components/business/LedgerForm";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PaymentInput, LedgerInput } from "@/types";

export default function LedgerDetailPage() {
  const { formatCurrency } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const ledgerId = params.ledgerId as string;

  const { ledgers, updateLedger, deleteLedger, completeLedger } = useLedgers();
  const { payments, totalReceived, loading, addPayment, deletePayment } = usePayments(ledgerId);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const ledger = ledgers.find((l) => l.id === ledgerId);

  if (!ledger) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-sm text-slate-500">Ledger not found</p>
          <button
            onClick={() => router.push("/business")}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            Back to Business
          </button>
        </div>
      </AppShell>
    );
  }

  const remaining = ledger.expectedAmount - totalReceived;
  const isOverdue =
    ledger.status === "active" &&
    ledger.dueDate &&
    new Date(ledger.dueDate) < new Date() &&
    totalReceived < ledger.expectedAmount;
  const isFullyPaid = totalReceived >= ledger.expectedAmount && ledger.status === "active";

  const handleAddPayment = async (data: PaymentInput) => {
    await addPayment(data);
    setShowPaymentForm(false);
  };

  const handleEdit = async (data: LedgerInput) => {
    await updateLedger(ledger.id, data);
    setShowEditForm(false);
  };

  const handleDelete = async () => {
    await deleteLedger(ledger.id);
    router.push("/business");
  };

  const statusConfig = {
    active: { icon: Clock, label: "Active", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
    completed: { icon: CheckCircle2, label: "Completed", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400" },
    cancelled: { icon: XCircle, label: "Cancelled", color: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400" },
  };
  const status = statusConfig[ledger.status];
  const StatusIcon = status.icon;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl xl:max-w-5xl space-y-6 p-4 lg:p-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/business")}
            className="flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditForm(!showEditForm)}
              className="rounded-lg p-2 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              title="Edit ledger"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title="Delete ledger"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="card p-5">
          <div className="flex items-start gap-4">
            <LedgerProgressRing received={totalReceived} expected={ledger.expectedAmount} size={64} strokeWidth={5} />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{ledger.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", status.color)}>
                  <StatusIcon size={12} />
                  {status.label}
                </span>
                {isOverdue && (
                  <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle size={12} />
                    Overdue
                  </span>
                )}
                {ledger.dueDate && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Due {new Date(ledger.dueDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <p className="text-meta font-medium">Expected</p>
              <p className="text-sm font-bold text-amount" style={{ color: 'var(--text-primary)' }}>{formatCurrency(ledger.expectedAmount)}</p>
            </div>
            <div>
              <p className="text-meta font-medium">Received</p>
              <p className="text-sm font-bold text-amount text-emerald-600 dark:text-emerald-400">{formatCurrency(totalReceived)}</p>
            </div>
            <div>
              <p className="text-meta font-medium">Remaining</p>
              <p className={cn("text-sm font-bold text-amount", remaining <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                {formatCurrency(Math.max(0, remaining))}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-2 w-full rounded-full" style={{ background: 'var(--surface-secondary)' }}>
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  totalReceived >= ledger.expectedAmount
                    ? "bg-emerald-500"
                    : isOverdue
                    ? "bg-red-500"
                    : "bg-blue-500"
                )}
                style={{ width: `${Math.min((totalReceived / ledger.expectedAmount) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Tags */}
          {ledger.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {ledger.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 text-[11px]"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Fully paid prompt */}
          {isFullyPaid && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Payment complete! Mark this ledger as completed?
                </p>
              </div>
              <button
                onClick={() => completeLedger(ledger.id)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Complete
              </button>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {showEditForm && (
          <div className="card p-5">
            <LedgerForm
              initial={{
                name: ledger.name,
                expectedAmount: ledger.expectedAmount,
                currency: ledger.currency,
                status: ledger.status,
                dueDate: ledger.dueDate,
                tags: ledger.tags,
                notes: ledger.notes,
              }}
              onSubmit={handleEdit}
              onCancel={() => setShowEditForm(false)}
              submitLabel="Save Changes"
            />
          </div>
        )}

        {/* Notes */}
        {ledger.notes && !showEditForm && (
          <div className="card p-5">
            <h3 className="text-meta font-semibold mb-2">Notes</h3>
            <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--text-secondary)' }}>{ledger.notes}</p>
          </div>
        )}

        {/* Payments Section */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-card-title">
              Payments ({payments.length})
            </h3>
            {ledger.status === "active" && (
              <button
                onClick={() => setShowPaymentForm(!showPaymentForm)}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                <PlusCircle size={14} />
                Log Payment
              </button>
            )}
          </div>

          {showPaymentForm && (
            <div className="mb-4">
              <PaymentForm
                ledgerId={ledger.id}
                onSubmit={handleAddPayment}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <PaymentList payments={payments} onDelete={deletePayment} />
          )}
        </div>

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl p-6 shadow-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Delete Ledger?</h3>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                This will remove &quot;{ledger.name}&quot; and all its payments. This action cannot be undone.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
