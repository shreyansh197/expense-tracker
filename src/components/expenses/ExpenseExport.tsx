"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, FileDown, Image } from "lucide-react";
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  useEffect(() => {
    if (showMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
  }, [showMenu]);

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

  const download = (content: string | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportImage = async () => {
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
    const total = activeExpenses.reduce((s, e) => s + e.amount, 0);
    const currency = settings.currency || "INR";
    const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency;

    // Category breakdown
    const catTotals: Record<string, number> = {};
    for (const e of activeExpenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    }
    const topCats = Object.entries(catTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, amt]) => ({ label: getCategoryLabel(id), amount: amt, pct: Math.round((amt / total) * 100) }));

    const W = 600, H = 400;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#FAF7F2";
    const textPrimary = getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim() || "#1A1B2E";
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#888";
    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2D6B5A";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Header
    ctx.fillStyle = textMuted;
    ctx.font = "600 12px sans-serif";
    ctx.fillText(`EXPENSTREAM • ${monthName.toUpperCase()} ${year}`, 32, 40);

    // Total
    ctx.fillStyle = textPrimary;
    ctx.font = "700 36px sans-serif";
    ctx.fillText(`${symbol}${total.toLocaleString()}`, 32, 88);

    ctx.fillStyle = textMuted;
    ctx.font = "400 13px sans-serif";
    ctx.fillText(`${activeExpenses.length} transactions`, 32, 112);

    // Divider
    ctx.strokeStyle = accent + "33";
    ctx.beginPath();
    ctx.moveTo(32, 130);
    ctx.lineTo(W - 32, 130);
    ctx.stroke();

    // Category breakdown
    ctx.fillStyle = textMuted;
    ctx.font = "600 11px sans-serif";
    ctx.fillText("TOP CATEGORIES", 32, 156);

    topCats.forEach((cat, i) => {
      const y = 180 + i * 38;
      // Bar
      const barWidth = Math.max((cat.pct / 100) * (W - 180), 4);
      ctx.fillStyle = accent + "22";
      ctx.fillRect(32, y, W - 180, 22);
      ctx.fillStyle = accent;
      ctx.fillRect(32, y, barWidth, 22);

      // Label
      ctx.fillStyle = textPrimary;
      ctx.font = "500 12px sans-serif";
      ctx.fillText(cat.label, 36, y + 15);

      // Amount
      ctx.fillStyle = textMuted;
      ctx.font = "400 12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${symbol}${cat.amount.toLocaleString()} (${cat.pct}%)`, W - 32, y + 15);
      ctx.textAlign = "left";
    });

    // Footer
    ctx.fillStyle = textMuted;
    ctx.font = "400 10px sans-serif";
    ctx.fillText(`Generated ${new Date().toLocaleDateString()}`, 32, H - 20);

    canvas.toBlob((blob) => {
      if (blob) download(blob, `expenses-${monthName}-${year}.png`, "image/png");
    }, "image/png");
    setShowMenu(false);
  };

  if (activeExpenses.length === 0) return null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors hover:bg-[var(--surface-secondary)] min-h-[44px]"
        style={{ color: "var(--text-secondary)" }}
        title="Export expenses"
        aria-label="Export expenses"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Export</span>
      </button>

      {showMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[50]" onClick={() => setShowMenu(false)} />
          <div
            className="fixed z-[50] min-w-[160px] rounded-xl border p-2 shadow-lg"
            style={{ background: "var(--surface)", borderColor: "var(--border)", top: menuPos.top, right: menuPos.right }}
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
            <button
              onClick={exportImage}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-secondary)] min-h-[44px]"
              style={{ color: "var(--text-primary)" }}
              aria-label="Export as Image"
            >
              <Image size={14} />
              Export as Image
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
