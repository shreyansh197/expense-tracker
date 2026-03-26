"use client";

import { useState } from "react";
import { DatePicker } from "@/components/ui/DatePicker";
import { useCurrency } from "@/hooks/useCurrency";
import type { PaymentInput, PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

interface PaymentFormProps {
  ledgerId: string;
  onSubmit: (data: PaymentInput) => Promise<void>;
  onCancel: () => void;
}

export function PaymentForm({ ledgerId, onSubmit, onCancel }: PaymentFormProps) {
  const { symbol } = useCurrency();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ledgerId,
        amount: amt,
        date,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      // Reset form
      setAmount("");
      setReference("");
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-900/10">
      <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Log Payment</h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Amount */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Amount</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{symbol}</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-6 pr-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              required
              autoFocus
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Date</label>
          <DatePicker
            value={parseInt(date.split("-")[2], 10)}
            month={parseInt(date.split("-")[1], 10)}
            year={parseInt(date.split("-")[0], 10)}
            onChange={(day, month, year) => {
              const d = String(day).padStart(2, "0");
              const m = String(month ?? parseInt(date.split("-")[1], 10)).padStart(2, "0");
              const y = String(year ?? parseInt(date.split("-")[0], 10));
              setDate(`${y}-${m}-${d}`);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Method */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Reference */}
        <div>
          <label className="mb-1 block text-[10px] font-medium text-gray-500">Reference</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Txn ID..."
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-[10px] font-medium text-gray-500">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note..."
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !amount}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Log Payment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
