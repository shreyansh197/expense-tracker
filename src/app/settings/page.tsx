"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";
import {
  Wallet, LinkIcon, Tag, Repeat, TrendingUp, Target, Palette,
  Download, Zap, Sun, Moon, Monitor, Smartphone, Briefcase,
  Shield, Users, Database,
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

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { symbol, formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

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

  const recurringCount = settings.recurringExpenses?.length || 0;
  const recurringTotal = (settings.recurringExpenses || [])
    .filter((r) => r.active)
    .reduce((sum, r) => sum + r.amount, 0);
  const goalsCount = settings.goals?.length || 0;

  return (
    <AppShell>
        <div className="mx-auto max-w-3xl space-y-2 p-4 lg:p-6">
        <h1 className="text-page-title mb-4">Settings</h1>

        <SettingsAccordion>

          {/* ━━━ YOUR ACCOUNT ━━━ */}
          <h3 className="text-[11px] font-bold uppercase tracking-wider pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Your Account
          </h3>

          {/* ─── Account & Workspace ─── */}
          <AccordionSection
            id="account"
            icon={<LinkIcon size={18} />}
            title="Account & Workspace"
            description="Manage your account and workspaces"
          >
            <AccountCard />
          </AccordionSection>

          {/* ─── Security ─── */}
          <AccordionSection
            id="security"
            icon={<Shield size={18} />}
            title="Security"
            description="Two-factor auth, sessions, and devices"
          >
            <SecurityCard />
          </AccordionSection>

          {/* ─── Workspace Members ─── */}
          <AccordionSection
            id="members"
            icon={<Users size={18} />}
            title="Workspace Members"
            description="Invite people and manage access"
          >
            <WorkspaceMembersCard />
          </AccordionSection>

          {/* ━━━ FINANCES ━━━ */}
          <h3 className="text-[11px] font-bold uppercase tracking-wider pt-6 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Finances
          </h3>

          {/* ─── Monthly Budget ─── */}
          <AccordionSection
            id="budget"
            icon={<Wallet size={18} />}
            title="Monthly Budget"
            description={`Currently ${formatCurrency(settings.salary)}`}
            alwaysOpen
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
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300"
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
              {/* Salary input */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-tertiary)' }}>{symbol}</span>
                  <input
                    type="number"
                    min="1"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSalaryUpdate(); }}
                    className="w-full rounded-xl py-2.5 pl-7 pr-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  onClick={handleSalaryUpdate}
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.97] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          </AccordionSection>

          {/* ─── Categories & Budgets ─── */}
          <AccordionSection
            id="categories"
            icon={<Tag size={18} />}
            title="Categories & Budgets"
            description="Manage expense categories and per-category limits"
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
          >
            <GoalsManager />
          </AccordionSection>

          {/* ─── Budget Rollover ─── */}
          <AccordionSection
            id="rollover"
            icon={<TrendingUp size={18} />}
            title="Budget Rollover"
            description="Carry unspent budget to next month"
            headerRight={
              <button
                role="switch"
                aria-checked={settings.rolloverEnabled ?? false}
                onClick={() => updateSettings({ rolloverEnabled: !settings.rolloverEnabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.rolloverEnabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
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

          {/* ━━━ AUTOMATION & DATA ━━━ */}
          <h3 className="text-[11px] font-bold uppercase tracking-wider pt-6 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Automation & Data
          </h3>

          {/* ─── Smart Rules ─── */}
          <AccordionSection
            id="rules"
            icon={<Zap size={18} />}
            title="Smart Rules"
            description="Auto-assign categories based on patterns"
          >
            <AutoRulesManager />
          </AccordionSection>

          {/* ─── Export & Import ─── */}
          <AccordionSection
            id="export-import"
            icon={<Download size={18} />}
            title="Export & Import"
            description="Backup, export, or import data"
          >
            <ExportImportWizard />
          </AccordionSection>

          {/* ─── Workspace Removal ─── */}
          <AccordionSection
            id="data-management"
            icon={<Database size={18} />}
            title="Workspace Removal"
            description="Remove or reset workspace data"
          >
            <DataAccountManagement />
          </AccordionSection>

          {/* ━━━ PREFERENCES ━━━ */}
          <h3 className="text-[11px] font-bold uppercase tracking-wider pt-6 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Preferences
          </h3>

          {/* ─── App Mode ─── */}
          <AccordionSection
            id="app-mode"
            icon={<Briefcase size={18} />}
            title="App Mode"
            description={settings.businessMode ? "Business Owner Mode active" : "Personal expense tracking"}
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

          {/* ─── Appearance ─── */}
          <AccordionSection
            id="theme"
            icon={<Palette size={18} />}
            title="Appearance"
            description={`${theme.charAt(0).toUpperCase() + theme.slice(1)} mode`}
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
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
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

        </SettingsAccordion>

        {/* ─── 12. Log Out Footer ─── */}
        <SettingsFooterLogout />
      </div>
    </AppShell>
  );
}
