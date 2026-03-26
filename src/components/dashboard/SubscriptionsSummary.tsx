"use client";

import { useMemo } from "react";
import { Repeat, Calendar, Pause, Play } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { buildCategoryMap } from "@/lib/categories";
import { useSettings } from "@/hooks/useSettings";

export function SubscriptionsSummary() {
  const { settings } = useSettings();
  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);
  const recurring = useMemo(() => settings.recurringExpenses || [], [settings.recurringExpenses]);

  const stats = useMemo(() => {
    const active = recurring.filter((r) => r.active);
    const paused = recurring.filter((r) => !r.active);
    const totalMonthly = active.reduce((s, r) => s + r.amount, 0);
    const pctOfBudget = settings.salary > 0 ? Math.round((totalMonthly / settings.salary) * 100) : 0;

    const today = new Date().getDate();
    const upcoming = active
      .filter((r) => r.day > today)
      .sort((a, b) => a.day - b.day);

    return { active, paused, totalMonthly, pctOfBudget, upcoming };
  }, [recurring, settings.salary]);

  if (recurring.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <Repeat size={14} className="text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Recurring Summary
        </h3>
      </div>

      {/* Stats row */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <p className="text-[10px] text-gray-400">Monthly</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatCurrency(stats.totalMonthly)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <p className="text-[10px] text-gray-400">% of Budget</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {stats.pctOfBudget}%
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
          <p className="text-[10px] text-gray-400">Active / Paused</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {stats.active.length} / {stats.paused.length}
          </p>
        </div>
      </div>

      {/* Upcoming */}
      {stats.upcoming.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase text-gray-400">
            Upcoming This Month
          </p>
          <div className="space-y-1">
            {stats.upcoming.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-2">
                  <Calendar size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Day {r.day}
                  </span>
                  <span className="text-xs text-gray-400">
                    {catMap[r.category]?.label || r.category}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {formatCurrency(r.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All recurring items */}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          View all ({recurring.length})
        </summary>
        <div className="mt-2 space-y-1">
          {recurring.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2">
                {r.active ? (
                  <Play size={10} className="text-emerald-500" />
                ) : (
                  <Pause size={10} className="text-gray-400" />
                )}
                <span
                  className={
                    r.active
                      ? "text-gray-600 dark:text-gray-300"
                      : "text-gray-400 line-through"
                  }
                >
                  {r.remark || catMap[r.category]?.label || r.category}
                </span>
                <span className="text-gray-400">Day {r.day}</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(r.amount)}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
