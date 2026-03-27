"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

export function LedgerForm({ initial, onSubmit, onCancel, submitLabel = "Create a Ledger" }: LedgerFormProps) {
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
  const [amountTouched, setAmountTouched] = useState(false);
  const amountInvalid = amountTouched && (expectedAmount === "" || isNaN(parseFloat(expectedAmount)) || parseFloat(expectedAmount) <= 0);

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
        <label className="form-label">Name / Client</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Client: Acme Corp"
          className="form-input w-full"
          required
          autoFocus
        />
      </div>

      {/* Expected Amount */}
      <div>
        <label className="form-label">Expected Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
          <input
            type="number"
            min="1"
            step="any"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            onBlur={() => setAmountTouched(true)}
            placeholder="0"
            className={cn("form-input w-full pl-7", amountInvalid && "!border-red-400 !ring-red-400/20")}
            required
            aria-invalid={amountInvalid || undefined}
          />
        </div>
        {amountInvalid && (
          <p className="mt-1 text-xs font-medium text-red-500">Enter a valid positive amount</p>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label className="form-label">Due Date (optional)</label>
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
              className="rounded-lg p-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Clear date"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDueDate(new Date().toISOString().split("T")[0])}
            className="w-full rounded-lg border border-dashed px-3 py-2.5 text-sm hover:border-emerald-400 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text-muted)' }}
          >
            + Set due date
          </button>
        )}
      </div>

      {/* Status (only for edit) */}
      {initial && (
        <div>
          <label className="form-label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LedgerStatus)}
            className="form-select w-full"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="form-label">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
            placeholder="Add tag..."
            className="form-input flex-1"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
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
        <label className="form-label">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any details about this ledger..."
          className="form-input w-full"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={submitting || !name.trim() || !expectedAmount}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
