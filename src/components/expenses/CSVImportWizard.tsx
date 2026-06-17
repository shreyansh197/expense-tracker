"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Upload, X, Check, AlertTriangle, ChevronDown } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { getAllCategories } from "@/lib/categories";
import type { ExpenseInput } from "@/types";

// ── CSV parsing ────────────────────────────────────────────────────────────────

/** @internal exported for testing only */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.match(/(?:"[^"]*"|[^,])+/g) ?? line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (vals[i] ?? "").replace(/^"|"$/g, "").trim();
    });
    return row;
  });
}

// ── Column mapping ─────────────────────────────────────────────────────────────

export type MappedField = "date" | "amount" | "category" | "remark" | "currency" | "__ignore__";

const FIELD_OPTIONS: { value: MappedField; label: string }[] = [
  { value: "__ignore__", label: "— ignore —" },
  { value: "date", label: "Date (YYYY-MM-DD)" },
  { value: "amount", label: "Amount" },
  { value: "category", label: "Category" },
  { value: "remark", label: "Remark / Note" },
  { value: "currency", label: "Currency" },
];

/** @internal exported for testing only */
export function autoMapHeaders(headers: string[]): Record<string, MappedField> {
  const map: Record<string, MappedField> = {};
  for (const h of headers) {
    const lower = h.toLowerCase();
    if (lower.includes("date") || lower === "day") map[h] = "date";
    else if (lower.includes("amount") || lower.includes("price") || lower.includes("cost")) map[h] = "amount";
    else if (lower.includes("category") || lower.includes("type")) map[h] = "category";
    else if (lower.includes("remark") || lower.includes("note") || lower.includes("desc")) map[h] = "remark";
    else if (lower.includes("currency") || lower.includes("cur")) map[h] = "currency";
    else map[h] = "__ignore__";
  }
  return map;
}

// ── Row preview & conversion ───────────────────────────────────────────────────

interface ParsedRow {
  raw: Record<string, string>;
  date?: { day: number; month: number; year: number };
  amount?: number;
  category?: string;
  remark?: string;
  currency?: string;
  error?: string;
}

/** @internal exported for testing only */
export function convertRow(raw: Record<string, string>, mapping: Record<string, MappedField>, categoryMap: Record<string, string>): ParsedRow {
  const result: ParsedRow = { raw };

  // Date
  const dateVal = Object.entries(mapping).find(([, v]) => v === "date")?.[0];
  if (dateVal && raw[dateVal]) {
    const str = raw[dateVal];
    const parts = str.split(/[-/]/).map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [y, m, d] = parts[0] > 999 ? parts : [parts[2], parts[1], parts[0]];
      if (y && m && d) result.date = { day: d, month: m, year: y };
    }
    if (!result.date) {
      const dt = new Date(str);
      if (!isNaN(dt.getTime())) result.date = { day: dt.getDate(), month: dt.getMonth() + 1, year: dt.getFullYear() };
    }
    if (!result.date) result.error = `Invalid date: "${str}"`;
  }

  // Amount
  const amtKey = Object.entries(mapping).find(([, v]) => v === "amount")?.[0];
  if (amtKey && raw[amtKey]) {
    const n = parseFloat(raw[amtKey].replace(/[^0-9.]/g, ""));
    if (!isNaN(n) && n > 0) result.amount = n;
    else result.error = (result.error ?? "") + ` Invalid amount: "${raw[amtKey]}"`;
  }

  // Category — try to match by label (case-insensitive)
  const catKey = Object.entries(mapping).find(([, v]) => v === "category")?.[0];
  if (catKey && raw[catKey]) {
    const catLabel = raw[catKey].toLowerCase().trim();
    const matched = Object.entries(categoryMap).find(([, label]) => label.toLowerCase() === catLabel)?.[0]
      ?? Object.entries(categoryMap).find(([id]) => id.toLowerCase() === catLabel)?.[0];
    result.category = matched ?? "miscellaneous";
  } else {
    result.category = "miscellaneous";
  }

  // Remark
  const remKey = Object.entries(mapping).find(([, v]) => v === "remark")?.[0];
  if (remKey && raw[remKey]) result.remark = raw[remKey];

  // Currency
  const curKey = Object.entries(mapping).find(([, v]) => v === "currency")?.[0];
  if (curKey && raw[curKey]) result.currency = raw[curKey].toUpperCase();

  return result;
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CSVImportWizardProps {
  month: number;
  year: number;
  onClose: () => void;
}

type Step = "upload" | "map" | "preview" | "done";

export function CSVImportWizard({ month, year, onClose }: CSVImportWizardProps) {
  const { addExpense } = useExpenses(month, year);
  const { settings } = useSettings();
  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const categoryMap = Object.fromEntries(allCategories.map((c) => [c.id, c.label]));

  const [step, setStep] = useState<Step>("upload");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, MappedField>>({});
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (!rows.length) return;
      const hdrs = Object.keys(rows[0]);
      setRawRows(rows);
      setHeaders(hdrs);
      setMapping(autoMapHeaders(hdrs));
      setStep("map");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  }, [handleFile]);

  const handlePreview = () => {
    const rows = rawRows.map((r) => convertRow(r, mapping, categoryMap));
    setParsedRows(rows);
    setStep("preview");
  };

  const handleImport = async () => {
    setImporting(true);
    let count = 0;
    const defaultDate = { day: 1, month, year };
    for (const row of parsedRows) {
      if (!row.amount) continue;
      const d = row.date ?? defaultDate;
      const input: ExpenseInput = {
        category: (row.category as string) ?? "miscellaneous",
        amount: row.amount,
        currency: row.currency ?? settings.currency,
        day: d.day,
        month: d.month,
        year: d.year,
        remark: row.remark,
        isRecurring: false,
      };
      await addExpense(input);
      count++;
    }
    setImportedCount(count);
    setImporting(false);
    setStep("done");
  };

  const validRows = parsedRows.filter((r) => r.amount && !r.error);
  const errorRows = parsedRows.filter((r) => r.error);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface-primary)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Import from CSV</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[var(--surface-secondary)]" aria-label="Close">
            <X size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {(["upload", "map", "preview", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{
                    background: ["upload", "map", "preview", "done"].indexOf(step) >= i
                      ? "var(--accent)"
                      : "var(--surface-secondary)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div
              className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border-color)" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                Drop your CSV file here
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                or click to browse · Any column order, auto-detected
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* ── Step 2: Map columns ── */}
          {step === "map" && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Map your CSV columns to expense fields. Auto-detected below — adjust if needed.
              </p>
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
                    {h}
                    <span className="ml-2 opacity-50 text-[0.6rem]">
                      e.g. &quot;{rawRows[0]?.[h]}&quot;
                    </span>
                  </span>
                  <div className="relative">
                    <select
                      value={mapping[h] ?? "__ignore__"}
                      onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value as MappedField }))}
                      className="text-xs rounded-lg pl-2 pr-6 py-1.5 border appearance-none"
                      style={{ background: "var(--surface-secondary)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                    >
                      {FIELD_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              ))}
              <button
                onClick={handlePreview}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                Preview {rawRows.length} rows →
              </button>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === "preview" && (
            <div className="space-y-3">
              <div className="flex gap-3 text-xs">
                <span className="font-semibold" style={{ color: "var(--accent)" }}>✓ {validRows.length} valid</span>
                {errorRows.length > 0 && (
                  <span className="font-semibold" style={{ color: "var(--danger)" }}>✗ {errorRows.length} errors (will skip)</span>
                )}
              </div>
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border-color)" }}>
                <div className="overflow-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead style={{ background: "var(--surface-secondary)" }}>
                      <tr>
                        <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Date</th>
                        <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Amount</th>
                        <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Category</th>
                        <th className="text-left px-3 py-2" style={{ color: "var(--text-muted)" }}>Remark</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "var(--border-color)", opacity: row.error ? 0.5 : 1 }}>
                          <td className="px-3 py-1.5" style={{ color: "var(--text-secondary)" }}>
                            {row.date ? `${row.date.year}-${String(row.date.month).padStart(2,"0")}-${String(row.date.day).padStart(2,"0")}` : "—"}
                          </td>
                          <td className="px-3 py-1.5 tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
                            {row.amount?.toLocaleString() ?? "—"}
                          </td>
                          <td className="px-3 py-1.5" style={{ color: "var(--text-secondary)" }}>
                            {categoryMap[row.category ?? ""] ?? row.category ?? "—"}
                          </td>
                          <td className="px-3 py-1.5 truncate max-w-[100px]" style={{ color: "var(--text-muted)" }}>
                            {row.remark ?? ""}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {row.error
                              ? <AlertTriangle size={12} style={{ color: "var(--danger)" }} />
                              : <Check size={12} style={{ color: "var(--accent)" }} />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 20 && (
                    <p className="text-center text-xs py-2" style={{ color: "var(--text-muted)" }}>
                      … and {parsedRows.length - 20} more rows
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("map")}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium border"
                  style={{ borderColor: "var(--border-color)", color: "var(--text-secondary)" }}
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  {importing ? "Importing…" : `Import ${validRows.length} expenses`}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <div className="text-center py-6 space-y-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "var(--accent-soft, #D4EDDF)" }}
              >
                <Check size={28} style={{ color: "var(--accent)" }} />
              </div>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                {importedCount} expenses imported
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                They&apos;re now in your expense list and will sync across devices.
              </p>
              <button
                onClick={onClose}
                className="rounded-xl px-8 py-2.5 text-sm font-semibold text-white"
                style={{ background: "var(--accent)" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
