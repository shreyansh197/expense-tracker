"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";
import { useTheme } from "@/components/providers/ThemeProvider";
import { getMonthName } from "@/lib/utils";
import { Download, Upload, Moon, Sun, Monitor, Plus, Trash2, Copy, Check, UserPlus, AlertTriangle } from "lucide-react";
import type { Expense } from "@/types";
import { CATEGORY_MAP, buildCategoryMap, getAllCategories, PRESET_COLORS, DEFAULT_CATEGORIES_META } from "@/lib/categories";
import { InstallButton } from "@/components/pwa/InstallButton";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { getSyncCode, clearSyncCode } from "@/lib/deviceId";
import { supabase } from "@/lib/supabase";
import { CategoryBudgetManager } from "@/components/settings/CategoryBudgetManager";
import { RecurringManager } from "@/components/settings/RecurringManager";
import { CSVImport } from "@/components/settings/CSVImport";

export default function SettingsPage() {
  const { settings, updateSettings, addCategory, deleteCategory, resetSettings } = useSettings();
  const { currentMonth, currentYear } = useUIStore();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [salary, setSalary] = useState(settings.salary.toString());
  const [saving, setSaving] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [showAddCat, setShowAddCat] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const syncCode = getSyncCode();

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
    const catMap = buildCategoryMap(settings.customCategories);
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
    const catMap = buildCategoryMap(settings.customCategories);
    const data = expenses.map((e: Expense) => ({
      day: e.day,
      category: catMap[e.category]?.label || e.category,
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

        {/* Sync Code */}
        {syncCode && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Sync Code
            </h2>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              Use this code on your other devices to sync your expenses.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
              <span className="flex-1 font-mono text-lg font-bold tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {syncCode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(syncCode);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                  toast("Sync code copied");
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {codeCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Categories
            </h2>
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Add category form */}
          {showAddCat && (
            <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  maxLength={30}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
                <button
                  onClick={() => {
                    const name = newCatName.trim();
                    if (!name) return;
                    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                    const allCats = getAllCategories(settings.customCategories, settings.hiddenDefaults);
                    if (allCats.some((c) => c.id === id)) {
                      toast("Category already exists", "error");
                      return;
                    }
                    addCategory({
                      id,
                      label: name,
                      color: newCatColor,
                      bgColor: newCatColor + "20",
                      icon: "Tag",
                    });
                    setNewCatName("");
                    setShowAddCat(false);
                    toast("Category added");
                  }}
                  disabled={!newCatName.trim()}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    className="h-6 w-6 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: newCatColor === c ? "#1d4ed8" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Default categories */}
          <div className="space-y-1.5">
            {DEFAULT_CATEGORIES_META
              .filter((cat) => !(settings.hiddenDefaults || []).includes(cat.id))
              .map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {cat.label}
                </span>
                <button
                  onClick={() => {
                    deleteCategory(cat.id);
                    toast("Category removed", "error");
                  }}
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {/* Custom categories */}
            {settings.customCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5"
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {cat.label}
                </span>
                <button
                  onClick={() => {
                    deleteCategory(cat.id);
                    toast("Category deleted", "error");
                  }}
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Restore hidden defaults */}
          {(settings.hiddenDefaults?.length ?? 0) > 0 && (
            <button
              onClick={() => {
                updateSettings({ hiddenDefaults: [], categories: [...DEFAULT_CATEGORIES_META.map(c => c.id), ...settings.customCategories.map(c => c.id)] });
                toast("Default categories restored");
              }}
              className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Restore {settings.hiddenDefaults.length} hidden default{settings.hiddenDefaults.length > 1 ? "s" : ""}
            </button>
          )}
        </section>

        {/* Category Budgets */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Category Budgets
          </h2>
          <CategoryBudgetManager />
        </section>

        {/* Recurring Expenses */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Recurring Expenses
          </h2>
          <RecurringManager />
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

        {/* Import */}
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Import CSV ({getMonthName(currentMonth)} {currentYear})
          </h2>
          <CSVImport />
        </section>

        {/* Start Fresh */}
        <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-900/50 dark:bg-gray-900">
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Start Fresh
          </h2>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            Create a new account or join a different sync code. Your existing data stays safe in the cloud under the old sync code.
          </p>
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Start fresh?",
                message: "Create a new account or join a different sync code. Your existing data stays safe in the cloud under the old sync code.",
                confirmLabel: "Start Fresh",
                variant: "warning",
              });
              if (!ok) return;
              clearSyncCode();
              resetSettings();
              window.location.href = "/";
            }}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <UserPlus size={16} />
            New User / Switch Account
          </button>
        </section>

        {/* Delete All Data */}
        <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-900/50 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">
                Delete All Data
              </h2>
              <p className="mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                Permanently delete all expenses linked to your sync code. This cannot be undone.
              </p>
              <button
                disabled={deleting}
                onClick={async () => {
                  if (!syncCode) return;
                  const ok = await confirm({
                    title: "Delete all data",
                    message: "This will permanently delete ALL your expenses. This cannot be undone.",
                    confirmLabel: "Delete Everything",
                    variant: "danger",
                    requireInput: syncCode,
                    requireInputLabel: `Type your sync code (${syncCode}) to confirm:`,
                  });
                  if (!ok) {
                    return;
                  }
                  setDeleting(true);
                  const { error } = await supabase
                    .from("expenses")
                    .delete()
                    .eq("device_id", syncCode);
                  setDeleting(false);
                  if (error) {
                    toast("Failed to delete data. Try again.", "error");
                    console.error("Delete error:", error);
                  } else {
                    clearSyncCode();
                    resetSettings();
                    toast("All data deleted.");
                    window.location.href = "/";
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {deleting ? "Deleting..." : "Delete All Expenses"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
