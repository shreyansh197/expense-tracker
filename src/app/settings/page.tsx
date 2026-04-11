"use client";

import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SUPPORTED_CURRENCIES, getMonthName } from "@/lib/utils";
import {
  Wallet, LinkIcon, Tag, Repeat, TrendingUp, Target, Palette,
  Download, Zap, Sun, Moon, Monitor, Smartphone, Briefcase,
  Shield, Users, Database, Globe, RefreshCw, ChevronLeft, ChevronRight,
  Search,
} from "lucide-react";
import { InstallButton } from "@/components/pwa/InstallButton";
import { AccentColorPicker, applyAccentColor } from "@/components/settings/AccentColorPicker";
import { useToast } from "@/components/ui/Toast";

import { usePageTitle } from "@/hooks/usePageTitle";
import { SettingsAccordion, AccordionSection } from "@/components/settings/SettingsAccordion";
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
import { usePinLock } from "@/hooks/usePinLock";
import { PageTransition } from "@/components/ui/PageTransition";
import { SettingsGraphic } from "@/components/ui/illustrations";
import { ReflectiveCharacter } from "@/components/ui/illustrations/characters";
import { fetchRates, getRateInfo, clearRateCache } from "@/lib/exchangeRates";

function LazyFallback() {
  return <div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: 'var(--text-muted)' }} /></div>;
}

/** Shows live rate source, sample conversions, and a refresh button */
function RateSourceInfo({ baseCurrency }: { baseCurrency: string }) {
  const [info, setInfo] = useState<{ source: string; fetchedAt: Date; base: string } | null>(() => getRateInfo());
  const [sampleRates, setSampleRates] = useState<Record<string, number> | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadInfo = () => {
    const cached = getRateInfo();
    setInfo(cached);
  };

  useEffect(() => {
    let cancelled = false;
    fetchRates(baseCurrency).then((rates) => {
      if (cancelled) return;
      setSampleRates(rates);
      setInfo(getRateInfo());
    });
    return () => { cancelled = true; };
  }, [baseCurrency]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await clearRateCache();
    const rates = await fetchRates(baseCurrency);
    setSampleRates(rates);
    loadInfo();
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
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
          Exchange Rates
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
          style={{ color: "var(--brand)", background: "var(--accent-soft)" }}
        >
          <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Fetching..." : "Refresh"}
        </button>
      </div>
      {info && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Source: {sourceLabel[info.source] ?? info.source} · Updated {info.fetchedAt.toLocaleTimeString()}
        </p>
      )}
      {sampleRates && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {otherCurrencies.map(c => {
            const rate = sampleRates[c];
            if (!rate) return null;
            return (
              <span key={c} className="text-xs text-amount font-medium" style={{ color: "var(--text-secondary)" }}>
                1 {baseCurrency} = {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)} {c}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** PIN Lock settings UI — embedded in Security section */
function PinLockSettings() {
  const { isEnabled, timeout, setupPin, disablePin, updateTimeout } = usePinLock();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"idle" | "setup" | "confirm">("idle");
  const { toast } = useToast();

  const handleSetup = () => {
    if (step === "idle") {
      setStep("setup");
      return;
    }
    if (step === "setup") {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        toast("PIN must be exactly 4 digits");
        return;
      }
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (confirmPin !== newPin) {
        toast("PINs don't match. Try again.");
        setConfirmPin("");
        setStep("setup");
        return;
      }
      setupPin(newPin, timeout);
      setNewPin("");
      setConfirmPin("");
      setStep("idle");
      toast("PIN lock enabled");
    }
  };

  const handleDisable = () => {
    disablePin();
    toast("PIN lock disabled");
  };

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            App PIN Lock
          </h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Require a PIN to access the app after inactivity
          </p>
        </div>
        {isEnabled && (
          <button
            onClick={handleDisable}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-err hover:bg-err-soft"
          >
            Disable
          </button>
        )}
      </div>

      {isEnabled ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Lock after
            </label>
            <select
              value={timeout}
              onChange={(e) => updateTimeout(Number(e.target.value) as 5 | 15 | 30)}
              className="rounded-lg border px-2 py-1 text-xs font-medium"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>of inactivity</span>
          </div>
          <p className="text-xs rounded-lg p-2" style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}>
            PIN lock is active. The app will ask for your PIN after {timeout} minutes of inactivity.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {step !== "idle" && (
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={step === "setup" ? "Enter 4-digit PIN" : "Confirm PIN"}
                value={step === "setup" ? newPin : confirmPin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (step === "setup") setNewPin(v);
                  else setConfirmPin(v);
                }}
                autoFocus
                className="w-full rounded-xl border py-2.5 px-3 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                {step === "setup" ? "Choose a 4-digit PIN" : "Re-enter your PIN to confirm"}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSetup}
              className="btn-primary btn-md"
            >
              {step === "idle" ? "Set Up PIN" : step === "setup" ? "Next" : "Confirm"}
            </button>
            {step !== "idle" && (
              <button
                onClick={() => { setStep("idle"); setNewPin(""); setConfirmPin(""); }}
                className="rounded-xl px-4 py-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  usePageTitle("Settings");
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
    { id: "zone-finances", label: "Finances", description: "Budget, categories & goals" },
    { id: "zone-automation", label: "Automation", description: "Rules, export & data" },
    { id: "zone-preferences", label: "Preferences", description: "Theme, currency & mode" },
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
        <PageTransition className="relative mx-auto max-w-4xl xl:max-w-6xl space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="relative flex items-center justify-between mb-4">
          <h1 className="text-page-title">Settings</h1>
          <div className="flex items-center gap-2">
            {/* ReflectiveCharacter — calm awareness (density: max 1 character + 1 art per section) */}
            <div className="pointer-events-none opacity-30 sm:opacity-50 scale-75 sm:scale-100 origin-center">
              <ReflectiveCharacter size={56} />
            </div>
            <SettingsGraphic />
          </div>
        </div>

        {/* Search bar for quick settings lookup */}
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search settings…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
            style={{ background: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            aria-label="Search settings"
          />
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

          {/* ━━━ YOUR ACCOUNT — indigo zone ━━━ */}
          <div id="zone-account" role="tabpanel" aria-labelledby="tab-zone-account" className={`section-zone section-indigo space-y-3 scroll-mt-16 ${activeZone !== 'zone-account' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-account') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Your Account
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
          <div id="zone-finances" role="tabpanel" aria-labelledby="tab-zone-finances" className={`section-zone section-teal space-y-3 scroll-mt-16 ${activeZone !== 'zone-finances' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-finances') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pt-2 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Finances
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
                <p className="mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Preview: <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(123456.78)}</span>
                </p>
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
                    className="w-full rounded-xl py-2.5 pl-7 pr-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Used for any month without a specific override below
                </p>
              </div>

              {/* Per-month budget override */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Month-Specific Budget</label>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={prevBudgetMonth} className="rounded-lg p-1.5 transition-colors hover:opacity-80" style={{ background: 'var(--surface-secondary)' }} aria-label="Previous month">
                    <ChevronLeft size={16} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <span className="min-w-[120px] text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getMonthName(budgetMonth)} {budgetYear}
                  </span>
                  <button onClick={nextBudgetMonth} className="rounded-lg p-1.5 transition-colors hover:opacity-80" style={{ background: 'var(--surface-secondary)' }} aria-label="Next month">
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
                      className="w-full rounded-xl py-2.5 pl-7 pr-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
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
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
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
            iconColor="bg-[var(--warning-soft)] text-[var(--warning-text)]"
            className={!isSectionVisible('categories') ? 'hidden' : ''}
          >
            <Suspense fallback={<LazyFallback />}><CategoryManager /></Suspense>
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
            <Suspense fallback={<LazyFallback />}><RecurringManager /></Suspense>
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
            <Suspense fallback={<LazyFallback />}><GoalsManager /></Suspense>
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
          <div id="zone-automation" role="tabpanel" aria-labelledby="tab-zone-automation" className={`section-zone section-violet space-y-3 scroll-mt-16 ${activeZone !== 'zone-automation' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-automation') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pt-2 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Automation & Data
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
            <Suspense fallback={<LazyFallback />}><AutoRulesManager /></Suspense>
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
            <Suspense fallback={<LazyFallback />}><ExportImportWizard /></Suspense>
          </AccordionSection>

          {/* ─── Workspace Removal ─── */}
          <div className="rounded-2xl p-[2px]" style={{ background: 'var(--danger-border)' }}>
          <AccordionSection
            id="data-management"
            icon={<Database size={18} />}
            title="Workspace Removal"
            description="Remove or reset workspace data"
            iconColor="bg-[var(--danger-soft)] text-[var(--danger-text)]"
            className={!isSectionVisible('data-management') ? 'hidden' : ''}
          >
            <Suspense fallback={<LazyFallback />}><DataAccountManagement /></Suspense>
          </AccordionSection>
          </div>
          </div>

          {/* ━━━ PREFERENCES — indigo zone ━━━ */}
          <div id="zone-preferences" role="tabpanel" aria-labelledby="tab-zone-preferences" className={`section-zone section-indigo space-y-3 scroll-mt-16 ${activeZone !== 'zone-preferences' ? 'lg:hidden' : ''} ${!isZoneVisible('zone-preferences') ? 'hidden' : ''}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider pt-2 pb-1 px-1" style={{ color: 'var(--text-tertiary)' }}>
            Preferences
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
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {settings.businessMode
                  ? "Business Owner Mode adds a ledger system to track expected income, log payments received, and view collection analytics."
                  : "Enable Business Owner Mode to track client payments, revenue expectations, and receivables alongside your expenses."}
              </p>
              {settings.businessMode && (
                <div className="rounded-lg p-3" style={{ background: 'var(--biz-accent-soft)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--biz-accent-text)' }}>
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
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {settings.multiCurrencyEnabled
                  ? "You can now set a currency per expense. Foreign amounts are auto-converted to your base currency for totals."
                  : "Enable to track expenses in multiple currencies. Rates are fetched automatically and cached for offline use."}
              </p>
              {settings.multiCurrencyEnabled && (
                <div className="rounded-lg p-3" style={{ background: 'var(--info-soft)' }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--info-text)' }}>
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
            iconColor="bg-[var(--accent-soft)] text-[var(--accent)]"
            className={!isSectionVisible('theme') ? 'hidden' : ''}
          >
            <div className="space-y-4">
              {/* Live theme preview mini-card */}
              <div className="rounded-xl border p-3 overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border-card)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
                    <Palette size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="h-2.5 w-20 rounded-full" style={{ background: 'var(--text-primary)', opacity: 0.8 }} />
                    <div className="h-2 w-14 rounded-full mt-1" style={{ background: 'var(--text-muted)', opacity: 0.5 }} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 flex-1 rounded-lg" style={{ background: 'var(--surface-secondary)' }} />
                  <div className="h-6 w-16 rounded-lg" style={{ background: 'var(--primary)', opacity: 0.7 }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "light" as const, icon: Sun, label: "Light", swatches: ["#FFFFFF", "#F3F4F6", "#7C3AED", "#111827"] },
                  { value: "dark" as const, icon: Moon, label: "Dark", swatches: ["#1F2937", "#111827", "#A78BFA", "#F9FAFB"] },
                  { value: "system" as const, icon: Monitor, label: "System", swatches: ["#FFFFFF", "#1F2937", "#7C3AED", "#A78BFA"] },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = theme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                        active
                          ? "bg-brand-soft text-brand ring-2"
                          : ""
                      }`}
                      style={{
                        ...(!active ? { color: 'var(--text-secondary)' } : {}),
                        ...(active ? { ringColor: undefined, boxShadow: 'inset 0 0 0 2px var(--accent)' } : {}),
                      }}
                    >
                      <Icon size={16} />
                      {opt.label}
                      <div className="flex gap-1">
                        {opt.swatches.map((c, i) => (
                          <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Install PWA */}
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <Palette size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Accent Color</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Customize your theme color</p>
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
