"use client";

import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SUPPORTED_CURRENCIES, getMonthName } from "@/lib/utils";
import {
  Wallet, LinkIcon, Tag, Repeat, TrendingUp, Target, Palette,
  Download, Zap, Smartphone, Briefcase,
  Shield, Users, Database, Globe, ChevronLeft, ChevronRight,
  Search, Bell, Sunrise,
} from "lucide-react";
import { InstallButton } from "@/components/pwa/InstallButton";
import { AccentColorPicker, applyAccentColor } from "@/components/settings/AccentColorPicker";
import { useToast } from "@/components/ui/Toast";

import { usePageTitle } from "@/hooks/usePageTitle";
import { SettingsAccordion, AccordionSection } from "@/components/settings/SettingsAccordion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AccountCard } from "@/components/settings/AccountCard";
import { SecurityCard } from "@/components/settings/SecurityCard";
import { WorkspaceMembersCard } from "@/components/settings/WorkspaceMembersCard";
const CategoryManager = lazy(() => import("@/components/settings/CategoryManager").then(m => ({ default: m.CategoryManager })));
const RecurringManager = lazy(() => import("@/components/settings/RecurringManager").then(m => ({ default: m.RecurringManager })));
const GoalsManager = lazy(() => import("@/components/settings/GoalsManager").then(m => ({ default: m.GoalsManager })));
const ExportImportWizard = lazy(() => import("@/components/settings/ExportImportWizard").then(m => ({ default: m.ExportImportWizard })));
const AutoRulesManager = lazy(() => import("@/components/settings/AutoRulesManager").then(m => ({ default: m.AutoRulesManager })));
const DataAccountManagement = lazy(() => import("@/components/settings/DataAccountManagement").then(m => ({ default: m.DataAccountManagement })));
import { SettingsFooterLogout } from "@/components/settings/SettingsFooterLogout";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/pushSubscription";
import { RateSourceInfo } from "@/components/settings/RateSourceInfo";
import { PinLockSettings } from "@/components/settings/PinLockSettings";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

function LazyFallback() {
  return <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent text-[var(--text-muted)]" /></div>;
}

export default function SettingsPage() {
  usePageTitle("Settings");
  const { settings, updateSettings } = useSettings();
  const { symbol, formatCurrency } = useCurrency();
  const { toast } = useToast();
  const { theme } = useTheme();

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
    if (isNaN(val) || val <= 0) {
      toast("Please enter a valid amount greater than 0");
      return;
    }
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
    if (!monthBudget || isNaN(val) || val <= 0) {
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
    { id: "zone-account", label: "Account", description: "Profile, security & workspace" },
    { id: "zone-finances", label: "Budget & Categories", description: "Budget, categories & goals" },
    { id: "zone-automation", label: "Data & Automation", description: "Rules, export & data" },
    { id: "zone-preferences", label: "Appearance", description: "Theme, currency & mode" },
  ];
  const [activeZone, setActiveZoneRaw] = useState(() => {
    // Check URL hash to pre-select the right zone
    if (typeof window === "undefined") return zones[0].id;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      // Map section ids (like "budget", "account") to their parent zone
      const sectionToZone: Record<string, string> = {
        account: "zone-account", security: "zone-account", members: "zone-account",
        budget: "zone-finances", categories: "zone-finances", recurring: "zone-finances", goals: "zone-finances", rollover: "zone-finances",
        rules: "zone-automation", "export-import": "zone-automation", "data-management": "zone-automation",
        "app-mode": "zone-preferences", "multi-currency": "zone-preferences", theme: "zone-preferences",
      };
      const mapped = sectionToZone[hash];
      if (mapped) return mapped;
    }
    // Fall back to persisted tab
    const stored = localStorage.getItem("expenstream-settings-zone");
    if (stored && zones.some((z) => z.id === stored)) return stored;
    return zones[0].id;
  });
  const setActiveZone = useCallback((id: string) => {
    setActiveZoneRaw(id);
    localStorage.setItem("expenstream-settings-zone", id);
  }, []);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Searchable section index for quick-find
  const sectionIndex = useMemo(() => [
    { id: "account", zone: "zone-account", keywords: "account profile email name avatar workspace" },
    { id: "security", zone: "zone-account", keywords: "security password 2fa two-factor totp recovery sessions devices passkey pin lock" },
    { id: "members", zone: "zone-account", keywords: "members invite team workspace share access" },
    { id: "budget", zone: "zone-finances", keywords: "budget salary income monthly amount money" },
    { id: "categories", zone: "zone-finances", keywords: "categories custom hide show groceries transport" },
    { id: "recurring", zone: "zone-finances", keywords: "recurring expenses subscription repeat monthly auto" },
    { id: "goals", zone: "zone-finances", keywords: "goals savings target fund" },
    { id: "rollover", zone: "zone-finances", keywords: "rollover carry forward surplus deficit budget" },
    { id: "rules", zone: "zone-automation", keywords: "rules smart auto categorize automation" },
    { id: "export-import", zone: "zone-automation", keywords: "export import csv json backup restore download" },
    { id: "data-management", zone: "zone-automation", keywords: "data delete remove workspace reset clear" },
    { id: "app-mode", zone: "zone-preferences", keywords: "mode personal business switch" },
    { id: "multi-currency", zone: "zone-preferences", keywords: "currency multi exchange rate convert" },
    { id: "notifications", zone: "zone-preferences", keywords: "notifications reminder push alert budget evening weekly digest" },
    { id: "theme", zone: "zone-preferences", keywords: "theme appearance dark light system color" },
  ], []);

  // Filter visible sections based on search
  const visibleSections = useMemo(() => {
    if (!searchQuery.trim()) return null; // null = show all
    const q = searchQuery.toLowerCase();
    return new Set(
      sectionIndex.filter(s => s.keywords.includes(q) || s.id.includes(q)).map(s => s.id)
    );
  }, [searchQuery, sectionIndex]);

  // When searching, auto-switch to the zone containing the first match
  useEffect(() => {
    if (!visibleSections || visibleSections.size === 0) return;
    const firstMatch = sectionIndex.find(s => visibleSections.has(s.id));
    if (firstMatch) setActiveZone(firstMatch.zone);
  }, [visibleSections, sectionIndex, setActiveZone]);

  // IntersectionObserver for mobile scroll tracking (desktop uses tab switching)
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) return;
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

  /** Check if a section should be visible based on search (null = show all) */
  const isSectionVisible = (id: string) => !visibleSections || visibleSections.has(id);
  /** Check if a zone has any visible sections */
  const isZoneVisible = (zoneId: string) =>
    !visibleSections || sectionIndex.some(s => s.zone === zoneId && visibleSections.has(s.id));

  return (
    <AppShell>
        <div className="relative mx-auto max-w-4xl xl:max-w-6xl space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="relative mb-4 card-terrain p-6 rounded-2xl">
          {/* Lora italic watermark behind header */}
          <p
            className="pointer-events-none absolute inset-0 select-none font-display italic text-6xl font-bold leading-none text-[var(--text-primary)] opacity-[0.04] overflow-hidden"
            aria-hidden="true"
          >
            Settings
          </p>
          <h1 className="font-display italic text-2xl sm:text-3xl relative z-10 text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm mt-1 relative z-10 font-body-terrain text-[var(--text-secondary)]">Customize your experience.</p>
        </div>

        {/* Search bar */}
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search settings…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border py-2.5 pl-9 pr-3 text-sm transition-colors focus:outline-none focus:ring-2 bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)]"
            aria-label="Search settings"
          />
          {searchQuery.trim() && (
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {visibleSections ? `${visibleSections.size} results found` : ""}
            </span>
          )}
        </div>

        {/* Mobile TOC — jump to section */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                setActiveZone(z.id);
                document.getElementById(z.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap"
              style={
                activeZone === z.id
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                  : { background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }
              }
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Tab navigation — desktop: shows only active zone; mobile: all zones visible */}
        <div role="tablist" aria-label="Settings sections" className="hidden lg:flex sticky top-0 z-10 gap-1.5 rounded-xl p-1.5 mb-4 backdrop-blur-md" style={{ background: 'color-mix(in srgb, var(--surface) 85%, transparent)', border: '1px solid var(--border-subtle)' }}>
          {zones.map((z) => (
            <button
              key={z.id}
              role="tab"
              aria-selected={activeZone === z.id}
              aria-controls={`${z.id}`}
              id={`tab-${z.id}`}
              onClick={() => {
                setActiveZone(z.id);
              }}
              className="rounded-lg px-3 py-2 text-left transition-all hover:bg-[var(--surface-secondary)]"
              style={
                activeZone === z.id
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <span className="block text-xs font-semibold">{z.label}</span>
              <span className="block text-overline font-normal opacity-70">{z.description}</span>
            </button>
          ))}
        </div>

        <SettingsAccordion>

          {visibleSections && visibleSections.size === 0 && (
            <p className="text-center py-12 text-sm text-[var(--text-muted)]">
              No settings match &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          {/* ━━━ YOUR ACCOUNT — indigo zone ━━━ */}
          <div id="zone-account" role="tabpanel" aria-labelledby="tab-zone-account" className={`space-y-3 scroll-mt-16 ${activeZone !== 'zone-account' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-account') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pb-1 px-1 text-[var(--text-tertiary)]">
            Identity
          </h3>

          {/* ─── Account & Workspace ─── */}
          {isSectionVisible('account') && <AccordionSection
            id="account"
            icon={<LinkIcon size={18} />}
            title="Account"
            description="Manage your account and workspaces"
            iconColor="bg-[var(--info-soft)] text-[var(--info-text)]"
          >
            <AccountCard />
          </AccordionSection>}

          {/* ─── Security ─── */}
          {isSectionVisible('security') && <AccordionSection
            id="security"
            icon={<Shield size={18} />}
            title="Security"
            description="Two-factor auth, sessions, and devices"
            iconColor="bg-[var(--danger-soft)] text-[var(--danger-text)]"
          >
            <SecurityCard />
            {/* ─── PIN Lock ─── */}
            <PinLockSettings />
          </AccordionSection>}

          {/* ─── Workspace Members ─── */}
          {isSectionVisible('members') && <AccordionSection
            id="members"
            icon={<Users size={18} />}
            title="Workspace Members"
            description="Invite people and manage access"
            iconColor="bg-[var(--accent-soft)] text-[var(--accent)]"
          >
            <WorkspaceMembersCard />
          </AccordionSection>}
          </div>

          {/* ━━━ FINANCES — teal zone ━━━ */}
          <div id="zone-finances" role="tabpanel" aria-labelledby="tab-zone-finances" className={`space-y-3 scroll-mt-16 ${activeZone !== 'zone-finances' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-finances') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pt-2 pb-1 px-1 text-[var(--text-tertiary)]">
            Ledger
          </h3>

          {/* ─── Monthly Budget ─── */}
          <AccordionSection
            id="budget"
            icon={<Wallet size={18} />}
            title="Monthly Budget"
            description={`Currently ${formatCurrency(settings.salary)}`}
            alwaysOpen
            iconColor="bg-[var(--secondary-soft)] text-[var(--secondary-text)]"
            className={!isSectionVisible('budget') ? 'hidden' : ''}
          >
            <div className="space-y-3">
              {/* Currency selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Currency</label>
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
                <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                  Preview: <span className="font-medium text-[var(--text-secondary)]">{formatCurrency(123456.78)}</span>
                </p>
              </div>
              {/* Salary input — default budget */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Default Monthly Budget</label>
                <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">{symbol}</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSalaryUpdate(); }}
                    className="w-full rounded-xl py-2.5 pl-7 pr-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
                <button
                  onClick={handleSalaryUpdate}
                  disabled={saving}
                  className="btn-primary btn-md"
                >
                  {saving ? "Saving..." : "Update"}
                </button>

                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Used for any month without a specific override below
                </p>
              </div>

              {/* Per-month budget override */}
              <div className="border-t border-[var(--border-subtle)] pt-3">
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Month-Specific Budget</label>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={prevBudgetMonth} className="rounded-lg p-1.5 transition-colors hover:opacity-80 bg-[var(--surface-secondary)]" aria-label="Previous month">
                    <ChevronLeft size={16} className="text-[var(--text-secondary)]" />
                  </button>
                  <span className="min-w-[120px] text-center text-sm font-semibold text-[var(--text-primary)]">
                    {getMonthName(budgetMonth)} {budgetYear}
                  </span>
                  <button onClick={nextBudgetMonth} className="rounded-lg p-1.5 transition-colors hover:opacity-80 bg-[var(--surface-secondary)]" aria-label="Next month">
                    <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-tertiary)]">{symbol}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`Default: ${settings.salary}`}
                      value={monthBudget}
                      onChange={(e) => setMonthBudget(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleMonthBudgetUpdate(); }}
                      className="w-full rounded-xl py-2.5 pl-7 pr-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)]"
                    />
                  </div>
                  <button
                    onClick={handleMonthBudgetUpdate}
                    disabled={saving}
                    className="btn-primary btn-md"
                  >
                    {saving ? "..." : "Set"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {monthlyBudgets[budgetKey] !== undefined
                    ? <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />{`Override active: ${formatCurrency(monthlyBudgets[budgetKey])} — clear input and click Set to remove`}</span>
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
            iconColor="bg-[var(--warning-soft)] text-[var(--warning-text)]"
            className={!isSectionVisible('categories') ? 'hidden' : ''}
          >
            <ErrorBoundary><Suspense fallback={<LazyFallback />}><CategoryManager /></Suspense></ErrorBoundary>
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
            iconColor="bg-[var(--info-soft)] text-[var(--info-text)]"
            className={!isSectionVisible('recurring') ? 'hidden' : ''}
          >
            <ErrorBoundary><Suspense fallback={<LazyFallback />}><RecurringManager /></Suspense></ErrorBoundary>
          </AccordionSection>

          {/* ─── Savings Goals ─── */}
          <AccordionSection
            id="goals"
            icon={<Target size={18} />}
            title="Savings Goals"
            description={goalsCount > 0 ? `${goalsCount} active goal${goalsCount > 1 ? "s" : ""}` : "Track your savings targets"}
            badge={goalsCount > 0 ? goalsCount : undefined}
            iconColor="bg-[var(--goal-achieved-bg)] text-[var(--goal-achieved-text)]"
          >
            <ErrorBoundary><Suspense fallback={<LazyFallback />}><GoalsManager /></Suspense></ErrorBoundary>
          </AccordionSection>

          {/* ─── Budget Rollover ─── */}
          <AccordionSection
            id="rollover"
            icon={<TrendingUp size={18} />}
            title="Budget Rollover"
            description="Carry unspent budget to next month"
            iconColor="bg-[var(--primary-soft)] text-[var(--primary-text)]"
            className={!isSectionVisible('rollover') ? 'hidden' : ''}
            headerRight={
              <button
                role="switch"
                aria-checked={settings.rolloverEnabled ?? false}
                aria-label="Budget rollover"
                onClick={() => updateSettings({ rolloverEnabled: !settings.rolloverEnabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.rolloverEnabled ? "bg-brand" : "bg-[var(--border-strong)]"
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
              <p className="text-xs text-[var(--text-secondary)]">
                {settings.rolloverEnabled
                  ? "Unspent budget from previous months will be added to your current month's budget."
                  : "Enable rollover to carry forward unspent budget automatically."}
              </p>
              {settings.rolloverEnabled && settings.rolloverHistory && Object.keys(settings.rolloverHistory).length > 0 && (
                <div className="rounded-xl p-3 bg-[var(--surface-secondary)]">
                  <h4 className="text-meta font-medium mb-2">Rollover History</h4>
                  <div className="space-y-1">
                    {Object.entries(settings.rolloverHistory)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 6)
                      .map(([key, amount]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-tertiary)]">{key}</span>
                          <span className="font-medium" style={{ color: amount >= 0 ? 'var(--success-text)' : 'var(--danger-text)' }}>
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

          {/* ━━━ AUTOMATION & DATA — violet zone ━━━ */}
          <div id="zone-automation" role="tabpanel" aria-labelledby="tab-zone-automation" className={`space-y-3 scroll-mt-16 ${activeZone !== 'zone-automation' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-automation') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pt-2 pb-1 px-1 text-[var(--text-tertiary)]">
            Mechanisms
          </h3>

          {/* ─── Smart Rules ─── */}
          <AccordionSection
            id="rules"
            icon={<Zap size={18} />}
            title="Smart Rules"
            description="Auto-assign categories based on patterns"
            iconColor="bg-[var(--warning-soft)] text-[var(--warning-text)]"
            className={!isSectionVisible('rules') ? 'hidden' : ''}
          >
            <ErrorBoundary><Suspense fallback={<LazyFallback />}><AutoRulesManager /></Suspense></ErrorBoundary>
          </AccordionSection>

          {/* ─── Export & Import ─── */}
          <AccordionSection
            id="export-import"
            icon={<Download size={18} />}
            title="Export & Import"
            description="Backup, export, or import data"
            iconColor="bg-[var(--info-soft)] text-[var(--info-text)]"
            className={!isSectionVisible('export-import') ? 'hidden' : ''}
          >
            <ErrorBoundary><Suspense fallback={<LazyFallback />}><ExportImportWizard /></Suspense></ErrorBoundary>
          </AccordionSection>

          {/* ─── Workspace Removal ─── */}
          <div className="rounded-2xl p-[2px] bg-[var(--danger-border)]">
          <AccordionSection
            id="data-management"
            icon={<Database size={18} />}
            title="Workspace Removal"
            description="Remove or reset workspace data"
            iconColor="bg-[var(--danger-soft)] text-[var(--danger-text)]"
            className={!isSectionVisible('data-management') ? 'hidden' : ''}
          >
            <ErrorBoundary><Suspense fallback={<LazyFallback />}><DataAccountManagement /></Suspense></ErrorBoundary>
          </AccordionSection>
          </div>
          </div>

          {/* ━━━ PREFERENCES — indigo zone ━━━ */}
          <div id="zone-preferences" role="tabpanel" aria-labelledby="tab-zone-preferences" className={`space-y-3 scroll-mt-16 ${activeZone !== 'zone-preferences' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-preferences') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pt-2 pb-1 px-1 text-[var(--text-tertiary)]">
            Atmosphere
          </h3>

          {/* ─── App Mode ─── */}
          <AccordionSection
            id="app-mode"
            icon={<Briefcase size={18} />}
            title="App Mode"
            description={settings.businessMode ? "Business Owner Mode active" : "Personal expense tracking"}
            iconColor="bg-[var(--biz-accent-soft)] text-[var(--biz-accent-text)]"
            headerRight={
              <button
                role="switch"
                aria-checked={settings.businessMode ?? false}
                aria-label="Business mode"
                onClick={() => updateSettings({ businessMode: !settings.businessMode })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.businessMode ? "bg-biz" : "bg-[var(--border-strong)]"
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
              <p className="text-xs text-[var(--text-secondary)]">
                {settings.businessMode
                  ? "Business Owner Mode adds a ledger system to track expected income, log payments received, and view collection analytics."
                  : "Enable Business Owner Mode to track client payments, revenue expectations, and receivables alongside your expenses."}
              </p>
              {settings.businessMode && (
                <div className="rounded-lg p-3 bg-[var(--biz-accent-soft)]">
                  <p className="text-xs font-medium text-[var(--biz-accent-text)]">
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
            iconColor="bg-[var(--info-soft)] text-[var(--info-text)]"
            className={!isSectionVisible('multi-currency') ? 'hidden' : ''}
            headerRight={
              <button
                role="switch"
                aria-checked={settings.multiCurrencyEnabled ?? false}
                aria-label="Multi-currency mode"
                onClick={() => updateSettings({ multiCurrencyEnabled: !settings.multiCurrencyEnabled })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.multiCurrencyEnabled ? "bg-brand" : "bg-[var(--border-strong)]"
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
              <p className="text-xs text-[var(--text-secondary)]">
                {settings.multiCurrencyEnabled
                  ? "You can now set a currency per expense. Foreign amounts are auto-converted to your base currency for totals."
                  : "Enable to track expenses in multiple currencies. Rates are fetched automatically and cached for offline use."}
              </p>
              {settings.multiCurrencyEnabled && (
                <div className="rounded-lg p-3 bg-[var(--info-soft)]">
                  <p className="text-xs font-medium text-[var(--info-text)]">
                    A currency picker now appears in the expense form. Conversions use your base currency ({settings.currency}) for all totals.
                  </p>
                </div>
              )}
              {settings.multiCurrencyEnabled && <RateSourceInfo baseCurrency={settings.currency} />}
            </div>
          </AccordionSection>

          {/* ─── Notifications ─── */}
          <AccordionSection
            id="notifications"
            icon={<Bell size={18} />}
            title="Notifications"
            description={settings.notificationPrefs?.enabled ? "Reminders active" : "Off"}
            iconColor="bg-[var(--warning-soft)] text-[var(--warning-text)]"
            className={!isSectionVisible('notifications') ? 'hidden' : ''}
            headerRight={
              <button
                role="switch"
                aria-checked={settings.notificationPrefs?.enabled ?? false}
                aria-label="Enable notifications"
                onClick={async () => {
                  const enabled = !settings.notificationPrefs?.enabled;
                  if (enabled) {
                    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                      const result = await Notification.requestPermission();
                      if (result !== 'granted') return;
                    }
                    const ok = await subscribeToPush();
                    if (!ok) return;
                  } else {
                    await unsubscribeFromPush();
                  }
                  const base = { enabled: false, eveningReminder: true, eveningReminderTime: "21:00", weeklyDigest: false, budgetAlerts: true, ...settings.notificationPrefs };
                  updateSettings({ notificationPrefs: { ...base, enabled, ...(enabled ? { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}) } });
                }}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.notificationPrefs?.enabled ? "bg-brand" : "bg-[var(--border-strong)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    settings.notificationPrefs?.enabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            }
          >
            <NotificationSettings />
          </AccordionSection>

          {/* ─── Appearance ─── */}
          <AccordionSection
            id="theme"
            icon={<Palette size={18} />}
            title="Appearance"
            description={`${theme.charAt(0).toUpperCase() + theme.slice(1)} mode`}
            iconColor="bg-[var(--accent-soft)] text-[var(--accent)]"
            className={!isSectionVisible('theme') ? 'hidden' : ''}
          >
            <div className="space-y-4">
              {/* Live theme preview mini-card */}
              <div className="rounded-xl border p-3 overflow-hidden bg-[var(--surface)] border-[var(--border-card)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[var(--accent-soft)]">
                    <Palette size={14} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="h-2.5 w-20 rounded-full bg-[var(--text-primary)] opacity-80" />
                    <div className="h-2 w-14 rounded-full mt-1 bg-[var(--text-muted)] opacity-50" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 flex-1 rounded-lg bg-[var(--surface-secondary)]" />
                  <div className="h-6 w-16 rounded-lg bg-[var(--primary)] opacity-70" />
                </div>
              </div>

              <ThemeToggle />

              {/* Sunset Auto-Theme */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sunrise size={15} className="text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Sunset Auto-Switch</p>
                      <p className="text-xs text-[var(--text-muted)]">Dark mode at sunset, light at sunrise</p>
                    </div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={!!settings.sunsetTheme}
                    onClick={() => updateSettings({ sunsetTheme: !settings.sunsetTheme })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      settings.sunsetTheme ? "bg-brand" : "bg-[var(--border-strong)]"
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        settings.sunsetTheme ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Install PWA */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 mb-3">
                  <Palette size={16} className="text-[var(--text-tertiary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Accent Color</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Customize your theme color</p>
                  </div>
                </div>
                <AccentColorPicker
                  currentColor={settings.accentColor}
                  onSelect={(color) => {
                    updateSettings({ accentColor: color });
                    applyAccentColor(color);
                  }}
                />
              </div>

              {/* Install PWA */}
              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3 mb-3">
                  <Smartphone size={16} className="text-[var(--text-tertiary)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">Install App</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Install as app for quick access</p>
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
      </div>
    </AppShell>
  );
}
