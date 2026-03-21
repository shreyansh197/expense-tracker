"use client";

export const dynamic = "force-dynamic";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useCalculations } from "@/hooks/useCalculations";
import { buildCategoryMap } from "@/lib/categories";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { getCategoryTotal } from "@/lib/calculations";
import { ArrowLeft } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
  const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10);

  const { expenses } = useExpenses(month, year);
  const { settings } = useSettings();
  const { monthlyTotal } = useCalculations(expenses, settings.categories, settings.salary, month, year);
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const meta = catMap[slug];
  const categoryLabel = meta?.label || slug;
  const categoryColor = meta?.color || "#6B7280";

  const categoryExpenses = expenses
    .filter((e) => e.category === slug)
    .sort((a, b) => b.day - a.day || b.createdAt - a.createdAt);

  const categoryTotal = getCategoryTotal(expenses, slug, month, year);
  const pctOfTotal = monthlyTotal > 0 ? Math.round((categoryTotal / monthlyTotal) * 100) : 0;
  const expenseCount = categoryExpenses.length;

  // Build last 6 months trend for this category
  const trendData: { label: string; total: number; month: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) { m += 12; y -= 1; }
    trendData.push({
      label: `${getMonthName(m).slice(0, 3)}`,
      total: 0,
      month: m,
      year: y,
    });
  }

  // We only have current month's expenses loaded, fill what we can
  const currentEntry = trendData.find((t) => t.month === month && t.year === year);
  if (currentEntry) currentEntry.total = categoryTotal;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white" style={{ color: categoryColor }}>
              {categoryLabel}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {getMonthName(month)} {year}
            </p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Spent</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(categoryTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">% of Total</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {pctOfTotal}%
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">Transactions</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {expenseCount}
            </p>
          </div>
        </div>

        {/* Monthly trend chart (current month highlighted) */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Monthly Trend
          </h3>
          {categoryTotal > 0 ? (
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb40" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}K` : `${v}`)}
                    width={35}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), categoryLabel]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                  />
                  <Bar dataKey="total" fill={categoryColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">No data for this month</p>
          )}
          <p className="mt-2 text-xs text-gray-400 text-center">
            Full trend data available after multi-month loading is implemented
          </p>
        </div>

        {/* Expenses list */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Expenses in {categoryLabel}
          </h3>
          {categoryExpenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No expenses in this category
            </p>
          ) : (
            <div className="space-y-1">
              {categoryExpenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="min-w-0">
                    {e.remark ? (
                      <p className="truncate text-sm text-gray-700 dark:text-gray-300">{e.remark}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">No remark</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {e.day} {getMonthName(month).slice(0, 3)} {year}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
