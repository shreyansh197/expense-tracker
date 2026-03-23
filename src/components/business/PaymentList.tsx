"use client";

import { useMemo } from "react";
import { Trash2, Banknote, CreditCard, Smartphone, FileText, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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

interface PaymentListProps {
  payments: Payment[];
  onDelete: (id: string) => void;
}

export function PaymentList({ payments, onDelete }: PaymentListProps) {
  // Payments come sorted desc by date. Show running total ascending.
  const withRunning = useMemo(() => {
    if (payments.length === 0) return [];
    let total = 0;
    return [...payments].reverse().map((p) => {
      total += p.amount;
      return { ...p, runningTotal: total };
    }).reverse();
  }, [payments]);

  if (payments.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-gray-400">
        No payments logged yet
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {withRunning.map((p) => {
        const Icon = p.method ? methodIcons[p.method] : HelpCircle;
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(p.amount)}
                </span>
                {p.method && (
                  <span className="text-[10px] text-gray-400">
                    {methodLabels[p.method]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400">
                  {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {p.reference && (
                  <span className="truncate text-[10px] text-gray-400">
                    Ref: {p.reference}
                  </span>
                )}
              </div>
              {p.notes && (
                <p className="mt-0.5 truncate text-[10px] text-gray-400">{p.notes}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400">Running: {formatCurrency(p.runningTotal)}</p>
            </div>
            <button
              onClick={() => onDelete(p.id)}
              className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
              title="Delete payment"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
