"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileJson, FileSpreadsheet, Check, AlertTriangle } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { buildCategoryMap, getAllCategories } from "@/lib/categories";
import { useToast } from "@/components/ui/Toast";
import { getMonthName } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import type { Expense, ExpenseInput } from "@/types";

export function ExportImportWizard() {
  const { formatCurrency } = useCurrency();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses, addExpense } = useExpenses(currentMonth, currentYear);
  const { settings } = useSettings();
  const { toast } = useToast();

  const allCategories = getAllCategories(settings.customCategories, settings.hiddenDefaults);
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const labelToId = Object.fromEntries(
    allCategories.map((c) => [c.label.toLowerCase(), c.id])
  );

  // Export
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ["Day", "Month", "Year", "Category", "Amount", "Remark"];
    const rows = expenses.map((e: Expense) => [
      e.day,
      currentMonth,
      currentYear,
      `"${(catMap[e.category]?.label || e.category).replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.remark || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csv, `expenses-${getMonthName(currentMonth)}-${currentYear}.csv`, "text/csv");
    toast("CSV exported");
  };

  const handleExportJSON = () => {
    if (expenses.length === 0) return;
    const data = expenses.map((e: Expense) => ({
      day: e.day,
      category: catMap[e.category]?.label || e.category,
      amount: e.amount,
      remark: e.remark || "",
    }));
    downloadFile(JSON.stringify(data, null, 2), `expenses-${getMonthName(currentMonth)}-${currentYear}.json`, "application/json");
    toast("JSON exported");
  };

  const handleExportAll = () => {
    // Export settings + current month expenses
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      month: currentMonth,
      year: currentYear,
      settings: {
        salary: settings.salary,
        currency: settings.currency,
        customCategories: settings.customCategories,
        categoryBudgets: settings.categoryBudgets,
        recurringExpenses: settings.recurringExpenses,
        goals: settings.goals,
        rolloverEnabled: settings.rolloverEnabled,
      },
      expenses: expenses.map((e) => ({
        day: e.day,
        category: e.category,
        amount: e.amount,
        remark: e.remark,
      })),
    };
    downloadFile(JSON.stringify(payload, null, 2), `expense-tracker-backup-${currentYear}-${currentMonth}.json`, "application/json");
    toast("Full backup exported");
  };

  // Import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  interface ParsedRow {
    day: number;
    category: string;
    amount: number;
    remark: string;
    error?: string;
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      // Try JSON first
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          // Simple JSON array
          const rows: ParsedRow[] = parsed.map((item: Record<string, unknown>) => ({
            day: Number(item.day) || 1,
            category: resolveCategory(String(item.category || "")),
            amount: Number(item.amount) || 0,
            remark: String(item.remark || ""),
            error: !Number(item.amount) ? "Invalid amount" : undefined,
          }));
          setPreview(rows);
          return;
        }
      } catch {
        // Not JSON, try CSV
      }

      // Parse CSV
      const lines = text.trim().split(/\r?\n/);
      let startIdx = 0;
      if (lines.length > 0) {
        const first = lines[0].toLowerCase();
        if (first.includes("day") || first.includes("category") || first.includes("amount")) {
          startIdx = 1;
        }
      }

      const rows: ParsedRow[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length < 3 || fields.every((f) => !f)) continue;
        const day = parseInt(fields[0], 10);
        const catStr = fields.length >= 4 ? fields[1] : fields[1]; // Handle both 3 and 4+ col formats
        const amtStr = fields.length >= 4 ? fields[2] : fields[2];
        const remark = fields.length >= 4 ? fields[3] || "" : fields[2] || "";
        const amount = parseFloat(amtStr);

        rows.push({
          day: isNaN(day) ? 1 : day,
          category: resolveCategory(catStr),
          amount: isNaN(amount) ? 0 : amount,
          remark,
          error: isNaN(amount) || amount <= 0 ? "Invalid amount" : isNaN(day) || day < 1 || day > 31 ? "Invalid day" : undefined,
        });
      }
      setPreview(rows);
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const resolveCategory = (input: string): string => {
    const lower = input.toLowerCase().trim();
    if (labelToId[lower]) return labelToId[lower];
    if (allCategories.some((c) => c.id === lower)) return lower;
    return "miscellaneous";
  };

  const handleImportConfirm = async () => {
    if (!preview) return;
    const valid = preview.filter((r) => !r.error && r.amount > 0);
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
          remark: row.remark,
        };
        await addExpense(input);
        success++;
      } catch {
        failed++;
      }
    }
    setImporting(false);
    setImportResult({ success, failed });
    setPreview(null);
    toast(`Imported ${success} expenses${failed > 0 ? `, ${failed} failed` : ""}`);
  };

  return (
    <div className="space-y-4">
      {/* Export section */}
      <div>
        <h3 className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Export ({getMonthName(currentMonth)} {currentYear})
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet size={14} />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <FileJson size={14} />
            JSON
          </button>
          <button
            onClick={handleExportAll}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-40 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Download size={14} />
            Full Backup
          </button>
        </div>
      </div>

      {/* Import section */}
      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <h3 className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Import
        </h3>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview && !importResult && (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-500 hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400 w-full justify-center"
          >
            <Upload size={16} />
            Choose CSV or JSON file
          </button>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-3">
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-2 py-1.5 text-left text-slate-500">Day</th>
                    <th className="px-2 py-1.5 text-left text-slate-500">Category</th>
                    <th className="px-2 py-1.5 text-right text-slate-500">Amount</th>
                    <th className="px-2 py-1.5 text-left text-slate-500">Remark</th>
                    <th className="px-2 py-1.5 text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preview.slice(0, 20).map((row, i) => (
                    <tr key={i} className={row.error ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                      <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">{row.day}</td>
                      <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">
                        {catMap[row.category]?.label || row.category}
                      </td>
                      <td className="px-2 py-1.5 text-right text-slate-900 dark:text-white font-medium">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-2 py-1.5 text-slate-500 max-w-[120px] truncate">{row.remark}</td>
                      <td className="px-2 py-1.5 text-center">
                        {row.error ? (
                          <AlertTriangle size={12} className="inline text-red-500" />
                        ) : (
                          <Check size={12} className="inline text-emerald-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 20 && (
              <p className="text-xs text-slate-400 text-center">
                Showing 20 of {preview.length} rows
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {preview.filter((r) => !r.error).length} valid, {preview.filter((r) => r.error).length} errors
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={importing || preview.filter((r) => !r.error).length === 0}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                >
                  {importing ? "Importing..." : `Import ${preview.filter((r) => !r.error).length} rows`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {importResult && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            <Check size={16} />
            Imported {importResult.success} expenses
            {importResult.failed > 0 && `, ${importResult.failed} failed`}
            <button
              onClick={() => setImportResult(null)}
              className="ml-auto text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSVLine(line: string): string[] {
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
}
