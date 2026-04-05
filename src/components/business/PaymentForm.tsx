"use client";

import { useState } from "react";
import { m } from "framer-motion";
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl p-5" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
      <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Log Payment</h4>

      <div className="grid grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <label className="mb-1 block form-label">Amount</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5,000"
              className="w-full rounded-xl py-2.5 pl-7 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block form-label">Date</label>
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

      <div className="grid grid-cols-2 gap-4">
        {/* Method */}
        <div>
          <label className="mb-1 block form-label">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className="w-full rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Reference */}
        <div>
          <label className="mb-1 block form-label">Reference</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Txn ID..."
            className="w-full rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block form-label">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional note..."
          className="w-full rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <m.button
          type="submit"
          disabled={submitting || !amount}
          className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50"
          whileTap={{ scale: 0.95 }}
        >
          {submitting ? "Saving..." : "Log Payment"}
        </m.button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-3 py-2.5 text-xs font-medium transition-colors"
          style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
