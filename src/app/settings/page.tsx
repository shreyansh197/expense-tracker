"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SUPPORTED_CURRENCIES, getMonthName } from "@/lib/utils";
import {
  Wallet, LinkIcon, Tag, Repeat, TrendingUp, Target, Palette,
  Download, Zap, Sun, Moon, Monitor, Smartphone, Briefcase,
  Shield, Users, Database, Globe, RefreshCw, ChevronLeft, ChevronRight,
} from "lucide-react";
import { InstallButton } from "@/components/pwa/InstallButton";
import { useToast } from "@/components/ui/Toast";
import { SettingsAccordion, AccordionSection } from "@/components/settings/SettingsAccordion";
import { AccountCard } from "@/components/settings/AccountCard";
import { SecurityCard } from "@/components/settings/SecurityCard";
import { WorkspaceMembersCard } from "@/components/settings/WorkspaceMembersCard";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { RecurringManager } from "@/components/settings/RecurringManager";
import { GoalsManager } from "@/components/settings/GoalsManager";
import { ExportImportWizard } from "@/components/settings/ExportImportWizard";
import { AutoRulesManager } from "@/components/settings/AutoRulesManager";
import { DataAccountManagement } from "@/components/settings/DataAccountManagement";
import { SettingsFooterLogout } from "@/components/settings/SettingsFooterLogout";
import { PageTransition } from "@/components/ui/PageTransition";
import { fetchRates, getRateInfo, clearRateCache, convert } from "@/lib/exchangeRates";

/** Shows live rate source, sample conversions, and a refresh button */
function RateSourceInfo({ baseCurrency }: { baseCurrency: string }) {
  const [info, setInfo] = useState<{ source: string; fetchedAt: Date; base: string } | null>(null);
  const [sampleRates, setSampleRates] = useState<Record<string, number> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadInfo = () => {
    const cached = getRateInfo();
    setInfo(cached);
  };

  const doFetch = async () => {
    const rates = await fetchRates(baseCurrency);
    setSampleRates(rates);
    loadInfo();
  };

  useEffect(() => {
    loadInfo();
    doFetch();
  }, [baseCurrency]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = async () => {
    setRefreshing(true);
    clearRateCache();
    await doFetch();
    setRefreshing(false);
  };

  const sourceLabel: Record<string, string> = {
    frankfurter: "European Central Bank (frankfurter.dev)",
    fawazahmed: "Open Source Rates (fawazahmed0)",
    fallback: "Offline fallback rates",
  };

  const otherCurrencies = ["INR", "USD", "EUR", "GBP"].filter(c => c !== baseCurrency);

  return (
    <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--surface-secondary)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
          Exchange Rates
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors"
          style={{ color: "var(--brand)", background: "var(--accent-soft)" }}
        >
          <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Fetching..." : "Refresh"}
        </button>
      </div>
      {info && (
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          Source: {sourceLabel[info.source] ?? info.source} · Updated {info.fetchedAt.toLocaleTimeString()}
        </p>
      )}
      {sampleRates && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {otherCurrencies.map(c => {
            const rate = sampleRates[c];
            if (!rate) return null;
            return (
              <span key={c} className="text-xs tabular-nums font-medium" style={{ color: "var(--text-secondary)" }}>
                1 {baseCurrency} = {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)} {c}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { symbol, formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [salary, setSalary] = useState(settings.salary.toString());
  const [saving, setSaving] = useState(false);

  // Per-month budget state
  const now = new Date();
  const [budgetMonth, setBudgetMonth] = useState(now.getMonth() + 1);
  const [budgetYear, setBudgetYear] = useState(now.getFullYear());
  const budgetKey = `${budgetYear}-${String(budgetMonth).padStart(2, "0")}`;
  const monthlyBudgets = settings.monthlyBudgets ?? {};
  const [monthBudget, setMonthBudget] = useState(
    monthlyBudgets[budgetKey]?.toString() ?? ""
  );

  // Sync month budget input when month/year changes
  useEffect(() => {
    const key = `${budgetYear}-${String(budgetMonth).padStart(2, "0")}`;
    const val = (settings.monthlyBudgets ?? {})[key];
    setMonthBudget(val !== undefined ? val.toString() : "");
  }, [budgetMonth, budgetYear, settings.monthlyBudgets]);

  useEffect(() => {
    setSalary(settings.salary.toString());
  }, [settings.salary]);

  const handleSalaryUpdate = async () => {
    const val = parseFloat(salary);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    try {
      await updateSettings({ salary: val });
      toast("Default budget updated");
    } finally {
      setSaving(false);
    }
  };

  const handleMonthBudgetUpdate = async () => {
    const val = parseFloat(monthBudget);
    const key = `${budgetYear}-${String(budgetMonth).padStart(2, "0")}`;
    const updated = { ...(settings.monthlyBudgets ?? {}) };
    if (!monthBudget || isNaN(val)) {
      // Clear the override — use default salary
      delete updated[key];
    } else {
      updated[key] = val;
    }
    setSaving(true);
    try {
      await updateSettings({ monthlyBudgets: updated });
      toast(!monthBudget || isNaN(val) ? "Month budget cleared (using default)" : `Budget set for ${getMonthName(budgetMonth)} ${budgetYear}`);
    } finally {
      setSaving(false);
    }
  };

  const prevBudgetMonth = () => {
    if (budgetMonth === 1) { setBudgetMonth(12); setBudgetYear(budgetYear - 1); }
    else setBudgetMonth(budgetMonth - 1);
  };
  const nextBudgetMonth = () => {
    if (budgetMonth === 12) { setBudgetMonth(1); setBudgetYear(budgetYear + 1); }
    else setBudgetMonth(budgetMonth + 1);
  };

  const recurringCount = settings.recurringExpenses?.length || 0;
  const recurringTotal = (settings.recurringExpenses || [])
    .filter((r) => r.active)
    .reduce((sum, r) => sum + r.amount, 0);
  const goalsCount = settings.goals?.length || 0;

  const zones = [
    { id: "zone-account", label: "Account" },
    { id: "zone-finances", label: "Finances" },
    { id: "zone-automation", label: "Automation" },
    { id: "zone-preferences", label: "Preferences" },
  ];
  const [activeZone, setActiveZone] = useState(zones[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveZone(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    for (const z of zones) {
      const el = document.getElementById(z.id);
      if (el) observerRef.current.observe(el);
    }
    return () => observerRef.current?.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppShell>
        <PageTransition className="relative mx-auto max-w-3xl space-y-2 p-4 lg:p-6">
        <h1 className="text-page-title mb-4">Settings</h1>

        {/* Quick-nav pills — desktop only */}
        <div className="hidden lg:flex sticky top-0 z-10 gap-1.5 rounded-xl p-1.5 mb-4 backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)', border: '1px solid var(--border-subtle)' }}>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                setActiveZone(z.id);
                document.getElementById(z.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={
                activeZone === z.id
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                  : { color: 'var(--text-secondary)' }
              }
              onMouseEnter={activeZone !== z.id ? (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = 'var(--surface-secondary)'; } : undefined}
              onMouseLeave={activeZone !== z.id ? (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = ''; } : undefined}
            >
              {z.label}
            </button>
          ))}
        </div>

        <SettingsAccordion>

          {/* ━━━ YOUR ACCOUNT — indigo zone ━━━ */}
          <div id="zone-account" className="section-zone section-indigo space-y-2 scroll-mt-16">
          <h3 className="text-[11px] font-bold uppercase tracking-wider pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Your Account
          </h3>

          {/* ─── Account & Workspace ─── */}
          <AccordionSection
            id="account"
            icon={<LinkIcon size={18} />}
            title="Account"
            description="Manage your account and workspaces"
            iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <AccountCard />
          </AccordionSection>

          {/* ─── Security ─── */}
          <AccordionSection
            id="security"
            icon={<Shield size={18} />}
            title="Security"
            description="Two-factor auth, sessions, and devices"
            iconColor="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
          >
            <SecurityCard />
          </AccordionSection>

          {/* ─── Workspace Members ─── */}
          <AccordionSection
            id="members"
            icon={<Users size={18} />}
            title="Workspace Members"
            description="Invite people and manage access"
            iconColor="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
          >
            <WorkspaceMembersCard />
          </AccordionSection>
          </div>

          {/* ━━━ FINANCES — teal zone ━━━ */}
          <div id="zone-finances" className="section-zone section-teal space-y-2 scroll-mt-16">
          <h3 className="text-[11px] font-bold uppercase tracking-wider pt-2 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Finances
          </h3>

          {/* ─── Monthly Budget ─── */}
          <AccordionSection
            id="budget"
            icon={<Wallet size={18} />}
            title="Monthly Budget"
            description={`Currently ${formatCurrency(settings.salary)}`}
            alwaysOpen
            iconColor="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
          >
            <div className="space-y-3">
              {/* Currency selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Currency</label>
                <div className="flex gap-2">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => updateSettings({ currency: c.code })}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                        settings.currency === c.code
                          ? "border-data-text bg-data-soft text-data-text"
                          : "hover:opacity-80"
                      }`}
                      style={settings.currency !== c.code ? { border: '1px solid var(--border)', color: 'var(--text-secondary)' } : undefined}
                    >
                      <span className="text-base">{c.symbol}</span>
                      <span className="hidden sm:inline">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Salary input — default budget */}
              <div>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Default Monthly Budget</label>
                <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSalaryUpdate(); }}
                    className="w-full rounded-xl py-2.5 pl-7 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  onClick={handleSalaryUpdate}
                  disabled={saving}
                  className="btn-primary rounded-xl px-4 py-2.5"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Used for any month without a specific override below
                </p>
              </div>

              {/* Per-month budget override */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Month-Specific Budget</label>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={prevBudgetMonth} className="rounded-lg p-1.5 transition-colors hover:opacity-80" style={{ background: 'var(--surface-secondary)' }}>
                    <ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <span className="min-w-[120px] text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getMonthName(budgetMonth)} {budgetYear}
                  </span>
                  <button onClick={nextBudgetMonth} className="rounded-lg p-1.5 transition-colors hover:opacity-80" style={{ background: 'var(--surface-secondary)' }}>
                    <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Default: ${settings.salary}`}
                      value={monthBudget}
                      onChange={(e) => setMonthBudget(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleMonthBudgetUpdate(); }}
                      className="w-full rounded-xl py-2.5 pl-7 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <button
                    onClick={handleMonthBudgetUpdate}
                    disabled={saving}
                    className="btn-primary rounded-xl px-4 py-2.5"
                  >
                    {saving ? "..." : "Set"}
                  </button>
                </div>
                <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {monthlyBudgets[budgetKey] !== undefined
                    ? `Override: ${formatCurrency(monthlyBudgets[budgetKey])} — clear input and click Set to remove`
                    : "No override — using default budget"}
                </p>
              </div>
            </div>
          </AccordionSection>

          {/* ─── Categories & Budgets ─── */}
          <AccordionSection
            id="categories"
            icon={<Tag size={18} />}
            title="Categories & Budgets"
            description="Manage expense categories and per-category limits"
            iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          >
            <CategoryManager />
          </AccordionSection>

          {/* ─── Recurring Expenses ─── */}
          <AccordionSection
            id="recurring"
            icon={<Repeat size={18} />}
            title="Recurring Expenses"
            description={
              recurringCount > 0
                ? `${recurringCount} items · ${formatCurrency(recurringTotal)}/mo`
                : "Set up automatic monthly expenses"
            }
            badge={recurringCount > 0 ? recurringCount : undefined}
            iconColor="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400"
          >
            <RecurringManager />
          </AccordionSection>

          {/* ─── Savings Goals ─── */}
          <AccordionSection
            id="goals"
            icon={<Target size={18} />}
            title="Savings Goals"
            description={goalsCount > 0 ? `${goalsCount} active goal${goalsCount > 1 ? "s" : ""}` : "Track your savings targets"}
            badge={goalsCount > 0 ? goalsCount : undefined}
            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          >
            <GoalsManager />
          </AccordionSection>

          {/* ─── Budget Rollover ─── */}
          <AccordionSection
            id="rollover"
            icon={<TrendingUp size={18} />}
            title="Budget Rollover"
            description="Carry unspent budget to next month"
            iconColor="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
            headerRight={
              <button
                role="switch"
                aria-checked={settings.rolloverEnabled ?? false}
                onClick={() => updateSettings({ rolloverEnabled: !settings.rolloverEnabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.rolloverEnabled ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.rolloverEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            }
          >
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {settings.rolloverEnabled
                  ? "Unspent budget from previous months will be added to your current month's budget."
                  : "Enable rollover to carry forward unspent budget automatically."}
              </p>
              {settings.rolloverEnabled && settings.rolloverHistory && Object.keys(settings.rolloverHistory).length > 0 && (
                <div className="rounded-xl p-3" style={{ background: 'var(--surface-secondary)' }}>
                  <h4 className="text-meta font-medium mb-2">Rollover History</h4>
                  <div className="space-y-1">
                    {Object.entries(settings.rolloverHistory)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 6)
                      .map(([key, amount]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span style={{ color: 'var(--text-tertiary)' }}>{key}</span>
                          <span className={`font-medium ${amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {amount >= 0 ? "+" : ""}{formatCurrency(amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionSection>
          </div>

          {/* ━━━ AUTOMATION & DATA — coral zone ━━━ */}
          <div id="zone-automation" className="section-zone section-coral space-y-2 scroll-mt-16">
          <h3 className="text-[11px] font-bold uppercase tracking-wider pt-2 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Automation & Data
          </h3>

          {/* ─── Smart Rules ─── */}
          <AccordionSection
            id="rules"
            icon={<Zap size={18} />}
            title="Smart Rules"
            description="Auto-assign categories based on patterns"
            iconColor="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
          >
            <AutoRulesManager />
          </AccordionSection>

          {/* ─── Export & Import ─── */}
          <AccordionSection
            id="export-import"
            icon={<Download size={18} />}
            title="Export & Import"
            description="Backup, export, or import data"
            iconColor="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
          >
            <ExportImportWizard />
          </AccordionSection>

          {/* ─── Workspace Removal ─── */}
          <AccordionSection
            id="data-management"
            icon={<Database size={18} />}
            title="Workspace Removal"
            description="Remove or reset workspace data"
            iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          >
            <DataAccountManagement />
          </AccordionSection>
          </div>

          {/* ━━━ PREFERENCES — indigo zone ━━━ */}
          <div id="zone-preferences" className="section-zone section-indigo space-y-2 scroll-mt-16">
          <h3 className="text-[11px] font-bold uppercase tracking-wider pt-2 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Preferences
          </h3>

          {/* ─── App Mode ─── */}
          <AccordionSection
            id="app-mode"
            icon={<Briefcase size={18} />}
            title="App Mode"
            description={settings.businessMode ? "Business Owner Mode active" : "Personal expense tracking"}
            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            headerRight={
              <button
                role="switch"
                aria-checked={settings.businessMode ?? false}
                onClick={() => updateSettings({ businessMode: !settings.businessMode })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.businessMode ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.businessMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            }
          >
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {settings.businessMode
                  ? "Business Owner Mode adds a ledger system to track expected income, log payments received, and view collection analytics."
                  : "Enable Business Owner Mode to track client payments, revenue expectations, and receivables alongside your expenses."}
              </p>
              {settings.businessMode && (
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    A &quot;Business&quot; tab is now visible in your navigation. Manage ledgers and payments there.
                  </p>
                </div>
              )}
            </div>
          </AccordionSection>

          {/* ─── Multi-Currency ─── */}
          <AccordionSection
            id="multi-currency"
            icon={<Globe size={18} />}
            title="Multi-Currency"
            description={settings.multiCurrencyEnabled ? "Per-expense currency active" : "All expenses in base currency"}
            iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            headerRight={
              <button
                role="switch"
                aria-checked={settings.multiCurrencyEnabled ?? false}
                onClick={() => updateSettings({ multiCurrencyEnabled: !settings.multiCurrencyEnabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.multiCurrencyEnabled ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.multiCurrencyEnabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            }
          >
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {settings.multiCurrencyEnabled
                  ? "You can now set a currency per expense. Foreign amounts are auto-converted to your base currency for totals."
                  : "Enable to track expenses in multiple currencies. Rates are fetched automatically and cached for offline use."}
              </p>
              {settings.multiCurrencyEnabled && (
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    A currency picker now appears in the expense form. Conversions use your base currency ({settings.currency}) for all totals.
                  </p>
                </div>
              )}
              {settings.multiCurrencyEnabled && <RateSourceInfo baseCurrency={settings.currency} />}
            </div>
          </AccordionSection>

          {/* ─── Appearance ─── */}
          <AccordionSection
            id="theme"
            icon={<Palette size={18} />}
            title="Appearance"
            description={`${theme.charAt(0).toUpperCase() + theme.slice(1)} mode`}
            iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          >
            <div className="space-y-4">
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
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-soft text-brand"
                          : ""
                      }`}
                      style={!active ? { color: 'var(--text-secondary)' } : undefined}
                    >
                      <Icon size={16} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Install PWA */}
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Smartphone size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Install App</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Install as app for quick access</p>
                  </div>
                </div>
                <InstallButton />
              </div>
            </div>
          </AccordionSection>
          </div>

        </SettingsAccordion>

        {/* ─── 12. Log Out Footer ─── */}
        <SettingsFooterLogout />
      </PageTransition>
    </AppShell>
  );
}
