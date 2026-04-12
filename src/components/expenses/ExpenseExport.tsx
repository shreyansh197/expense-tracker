"use client";

import { useState } from "react";
import { Download, FileDown } from "lucide-react";
import type { Expense } from "@/types";
import { CATEGORIES } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";

interface ExpenseExportProps {
  expenses: Expense[];
  month: number;
  year: number;
}

export function ExpenseExport({ expenses, month, year }: ExpenseExportProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { settings } = useSettings();

  const getCategoryLabel = (id: string): string => {
    const builtIn = CATEGORIES.find((c) => c.id === id);
    if (builtIn) return builtIn.label;
    const custom = settings.customCategories?.find((c) => c.id === id);
    return custom?.label ?? id;
  };

  const activeExpenses = expenses.filter((e) => !e.deletedAt);

  const exportCSV = () => {
    const header = ["Date", "Category", "Amount", "Currency", "Remark", "Recurring"].join(",");
    const rows = activeExpenses.map((e) => {
      const date = `${e.year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;
      return [
        date,
        `"${getCategoryLabel(e.category).replace(/"/g, '""')}"`,
        e.amount,
        e.currency || settings.currency || "INR",
        `"${(e.remark || "").replace(/"/g, '""')}"`,
        e.isRecurring ? "Yes" : "No",
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
    download(csv, `expenses-${monthName}-${year}.csv`, "text/csv");
    setShowMenu(false);
  };

  const exportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      month,
      year,
      currency: settings.currency || "INR",
      expenses: activeExpenses.map((e) => ({
        date: `${e.year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`,
        category: getCategoryLabel(e.category),
        categoryId: e.category,
        amount: e.amount,
        currency: e.currency || settings.currency || "INR",
        remark: e.remark || null,
        isRecurring: e.isRecurring ?? false,
      })),
    };
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
    download(JSON.stringify(data, null, 2), `expenses-${monthName}-${year}.json`, "application/json");
    setShowMenu(false);
  };

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (activeExpenses.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors hover:bg-[var(--surface-secondary)] min-h-[44px]"
        style={{ color: "var(--text-secondary)" }}
        title="Export expenses"
        aria-label="Export expenses"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Export</span>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-[50]" onClick={() => setShowMenu(false)} />
          <div
            className="absolute right-0 top-full z-[50] mt-1 min-w-[160px] rounded-xl border p-2 shadow-lg"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <button
              onClick={exportCSV}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)] min-h-[44px]"
              style={{ color: "var(--text-primary)" }}
              aria-label="Export as CSV"
            >
              <FileDown size={14} />
              Export as CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)] min-h-[44px]"
              style={{ color: "var(--text-primary)" }}
              aria-label="Export as JSON"
            >
              <FileDown size={14} />
              Export as JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
