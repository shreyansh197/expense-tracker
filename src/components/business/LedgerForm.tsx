"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DatePicker } from "@/components/ui/DatePicker";
import type { LedgerInput, LedgerStatus } from "@/types";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";

interface LedgerFormProps {
  initial?: Partial<LedgerInput>;
  onSubmit: (data: LedgerInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function LedgerForm({ initial, onSubmit, onCancel, submitLabel = "Create Ledger" }: LedgerFormProps) {
  const { symbol } = useCurrency();
  const { settings } = useSettings();
  const [name, setName] = useState(initial?.name ?? "");
  const [expectedAmount, setExpectedAmount] = useState(initial?.expectedAmount?.toString() ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.split("T")[0] : "");
  const [status, setStatus] = useState<LedgerStatus>(initial?.status ?? "active");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expectedAmount);
    if (!name.trim() || isNaN(amt) || amt <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        expectedAmount: amt,
        currency: settings.currency,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        tags,
        notes: notes.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Name / Client</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Client: Acme Corp"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          required
          autoFocus
        />
      </div>

      {/* Expected Amount */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Expected Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{symbol}</span>
          <input
            type="number"
            min="1"
            step="any"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-7 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            required
          />
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Due Date (optional)</label>
        {dueDate ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DatePicker
                value={parseInt(dueDate.split("-")[2], 10)}
                month={parseInt(dueDate.split("-")[1], 10)}
                year={parseInt(dueDate.split("-")[0], 10)}
                onChange={(day, month, year) => {
                  const d = String(day).padStart(2, "0");
                  const m = String(month ?? parseInt(dueDate.split("-")[1], 10)).padStart(2, "0");
                  const y = String(year ?? parseInt(dueDate.split("-")[0], 10));
                  setDueDate(`${y}-${m}-${d}`);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setDueDate("")}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Clear date"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDueDate(new Date().toISOString().split("T")[0])}
            className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-400 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
          >
            + Set due date
          </button>
        )}
      </div>

      {/* Status (only for edit) */}
      {initial && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LedgerStatus)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
            placeholder="Add tag..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any details about this ledger..."
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting || !name.trim() || !expectedAmount}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
