"use client";

import { useState, useRef } from "react";
import { Upload, AlertTriangle, Check, X } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { buildCategoryMap, getAllCategories } from "@/lib/categories";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import type { ExpenseInput } from "@/types";

interface ParsedRow {
  day: number;
  category: string;
  amount: number;
  remark: string;
  error?: string;
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

export function CSVImport() {
  const { formatCurrency } = useCurrency();
  const { currentMonth, currentYear } = useUIStore();
  const { addExpense } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  // Reverse lookup: label → id
  const labelToId = Object.fromEntries(
    allCategories.map((c) => [c.label.toLowerCase(), c.id])
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);

      // Detect header row
      let startIdx = 0;
      if (rows.length > 0) {
        const first = rows[0].map((f) => f.toLowerCase());
        if (first.includes("day") || first.includes("category") || first.includes("amount")) {
          startIdx = 1;
        }
      }

      const parsed: ParsedRow[] = [];
      for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3 || row.every((f) => !f)) continue;

        const dayStr = row[0];
        const catStr = row[1];
        const amtStr = row[2];
        const remark = row[3] || "";

        const day = parseInt(dayStr, 10);
        const amount = parseFloat(amtStr);
        const catLower = catStr.toLowerCase();
        const categoryId = catMap[catLower]?.id || labelToId[catLower] || catLower.replace(/[^a-z0-9]+/g, "-");

        const errors: string[] = [];
        if (isNaN(day) || day < 1 || day > 31) errors.push("invalid day");
        if (isNaN(amount) || amount <= 0) errors.push("invalid amount");
        if (!catStr) errors.push("missing category");

        parsed.push({
          day,
          category: categoryId,
          amount,
          remark,
          error: errors.length > 0 ? errors.join(", ") : undefined,
        });
      }

      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    const valid = preview.filter((r) => !r.error);
    if (valid.length === 0) {
      toast("No valid rows to import", "error");
      return;
    }

    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of valid) {
      try {
        const input: ExpenseInput = {
          category: row.category,
          amount: row.amount,
          day: row.day,
          month: currentMonth,
          year: currentYear,
          remark: row.remark || undefined,
        };
        await addExpense(input);
        success++;
      } catch {
        failed++;
      }
    }

    setImporting(false);
    setResult({ success, failed });
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    toast(`Imported ${success} expense${success !== 1 ? "s" : ""}${failed > 0 ? `, ${failed} failed` : ""}`);
  };

  const handleCancel = () => {
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validCount = preview?.filter((r) => !r.error).length ?? 0;
  const errorCount = preview?.filter((r) => r.error).length ?? 0;

  return (
    <div className="space-y-3">
      {/* File input */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="hidden"
          id="csv-import"
        />
        <label
          htmlFor="csv-import"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
        >
          <Upload size={16} />
          Choose CSV File
        </label>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          Expected format: Day, Category, Amount, Remark (header row optional)
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {preview.length} rows
              </span>
              {validCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check size={12} />
                  {validCount} valid
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle size={12} />
                  {errorCount} errors
                </span>
              )}
            </div>
            <button onClick={handleCancel} style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[240px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: 'var(--surface-secondary)' }}>
                <tr>
                  <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Day</th>
                  <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Category</th>
                  <th className="px-3 py-1.5 text-right font-medium" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                  <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Remark</th>
                  <th className="px-3 py-1.5 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((row, i) => (
                  <tr
                    key={i}
                    className={row.error ? "bg-red-50/50 dark:bg-red-900/10" : ""}
                  >
                    <td className="px-3 py-1.5" style={{ color: 'var(--text-primary)' }}>{row.day}</td>
                    <td className="px-3 py-1.5" style={{ color: 'var(--text-primary)' }}>{row.category}</td>
                    <td className="px-3 py-1.5 text-right" style={{ color: 'var(--text-primary)' }}>
                      {isNaN(row.amount) ? "—" : formatCurrency(row.amount)}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-1.5" style={{ color: 'var(--text-muted)' }}>{row.remark}</td>
                    <td className="px-3 py-1.5">
                      {row.error ? (
                        <span className="text-red-500">{row.error}</span>
                      ) : (
                        <Check size={12} className="text-emerald-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(preview.length > 50) && (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Showing first 50 of {preview.length} rows
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={handleCancel}
              className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {importing ? "Importing..." : `Import ${validCount} Expense${validCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          <Check size={14} />
          Imported {result.success} expense{result.success !== 1 ? "s" : ""}.
          {result.failed > 0 && ` ${result.failed} failed.`}
        </div>
      )}
    </div>
  );
}
