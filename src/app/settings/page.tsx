"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getMonthName } from "@/lib/utils";
import { Download, Moon, Sun, Monitor } from "lucide-react";
import type { Expense } from "@/types";
import { CATEGORY_MAP } from "@/lib/categories";
import { InstallButton } from "@/components/pwa/InstallButton";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [salary, setSalary] = useState(settings.salary.toString());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSalary(settings.salary.toString());
  }, [settings.salary]);

  const handleSalaryUpdate = async () => {
    const val = parseFloat(salary);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      await updateSettings({ salary: val });
      toast("Salary updated");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ["Day", "Category", "Amount", "Remark"];
    const rows = expenses.map((e: Expense) => [
      e.day,
      CATEGORY_MAP[e.category]?.label || e.category,
      e.amount,
      e.remark || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${getMonthName(currentMonth)}-${currentYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  };

  const handleExportJSON = () => {
    if (expenses.length === 0) return;
    const data = expenses.map((e: Expense) => ({
      day: e.day,
      category: CATEGORY_MAP[e.category]?.label || e.category,
      amount: e.amount,
      remark: e.remark || "",
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${getMonthName(currentMonth)}-${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("JSON exported");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h1>

        {/* Budget */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Monthly Budget / Salary
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                ₹
              </span>
              <input
                type="number"
                min="1"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-7 pr-3 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              onClick={handleSalaryUpdate}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update"}
            </button>
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Theme
          </h2>
          <div className="flex gap-2">
            {[
              { value: "light" as const, icon: Sun, label: "Light" },
              { value: "dark" as const, icon: Moon, label: "Dark" },
              { value: "system" as const, icon: Monitor, label: "System" },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon size={16} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Install App */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Install
          </h2>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Install as an app on your device for quick access
          </p>
          <InstallButton />
        </section>

        {/* Export */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Export ({getMonthName(currentMonth)} {currentYear})
          </h2>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              disabled={expenses.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              disabled={expenses.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Download size={14} />
              JSON
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
