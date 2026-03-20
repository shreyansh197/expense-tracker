"use client";

export const dynamic = "force-dynamic";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useUIStore } from "@/stores/uiStore";
import { supabase } from "@/lib/supabase";
import { getSyncCode } from "@/lib/deviceId";
import { buildCategoryMap } from "@/lib/categories";
import { Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";

export default function InsightsPage() {
  const { settings } = useSettings();
  const { currentMonth, currentYear } = useUIStore();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const syncCode = getSyncCode();
      if (!syncCode) {
        setError("No sync code found. Please set up your account first.");
        setLoading(false);
        return;
      }

      // Fetch last 3 months of expenses for deeper analysis
      const months: { month: number; year: number }[] = [];
      for (let i = 0; i < 3; i++) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        months.push({ month: m, year: y });
      }

      const allExpenses: { category: string; amount: number; day: number; month: number; year: number; remark: string }[] = [];

      for (const { month, year } of months) {
        const { data } = await supabase
          .from("expenses")
          .select("category, amount, day, month, year, remark")
          .eq("device_id", syncCode)
          .eq("month", month)
          .eq("year", year)
          .is("deleted_at", null)
          .order("day", { ascending: true });

        if (data) {
          allExpenses.push(...data.map((r) => ({
            category: r.category,
            amount: r.amount,
            day: r.day,
            month: r.month,
            year: r.year,
            remark: r.remark || "",
          })));
        }
      }

      if (allExpenses.length === 0) {
        setError("No expenses found in the last 3 months. Add some expenses first!");
        setLoading(false);
        return;
      }

      const catMap = buildCategoryMap(settings.customCategories);
      const categoryLabels: Record<string, string> = {};
      for (const e of allExpenses) {
        if (!categoryLabels[e.category]) {
          categoryLabels[e.category] = catMap[e.category]?.label || e.category;
        }
      }

      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenses: allExpenses,
          salary: settings.salary,
          categories: categoryLabels,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to get insights.");
      } else {
        setInsights(result.insights);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, settings.salary, settings.customCategories]);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            AI Insights
          </h1>
          {insights && (
            <button
              onClick={fetchInsights}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </div>

        {!insights && !loading && !error && (
          <section className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <Sparkles className="text-blue-600 dark:text-blue-400" size={28} />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Get Smart Insights
            </h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
              AI analyzes your last 3 months of expenses to find savings opportunities and spending patterns.
            </p>
            <button
              onClick={fetchInsights}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98]"
            >
              <Sparkles size={16} />
              Analyze My Spending
            </button>
          </section>
        )}

        {loading && (
          <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <Loader2 className="mx-auto mb-3 animate-spin text-blue-600 dark:text-blue-400" size={32} />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Analyzing your expenses...
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              This may take a few seconds
            </p>
          </section>
        )}

        {error && (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={18} />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">
                  {error}
                </p>
                <button
                  onClick={fetchInsights}
                  className="mt-2 text-xs font-medium text-red-600 underline hover:text-red-700 dark:text-red-400"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        )}

        {insights && !loading && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-base prose-headings:font-semibold prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-li:text-gray-600 dark:prose-li:text-gray-400 prose-strong:text-gray-900 dark:prose-strong:text-white">
              <MarkdownRenderer content={insights} />
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1 pl-4">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      parts.push(<strong key={key++}>{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={i} className="mt-5 mb-2 text-base font-semibold text-gray-900 dark:text-white">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={i} className="mt-4 mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
          {line.slice(4)}
        </h3>
      );
    } else if (/^[-*]\s/.test(line)) {
      inList = true;
      listItems.push(
        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 list-disc">
          {formatInline(line.replace(/^[-*]\s/, ""))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      inList = true;
      listItems.push(
        <li key={i} className="text-sm text-gray-600 dark:text-gray-400 list-decimal">
          {formatInline(line.replace(/^\d+\.\s/, ""))}
        </li>
      );
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={i} className="my-1.5 text-sm text-gray-600 dark:text-gray-400">
          {formatInline(line)}
        </p>
      );
    }
  }
  flushList();

  return <>{elements}</>;
}
