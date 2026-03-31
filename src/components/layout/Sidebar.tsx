"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import { LayoutDashboard, List, Settings, PlusCircle, Briefcase, User } from "lucide-react";
import { QuickHelpButton } from "@/components/ui/QuickHelpButton";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { useExpenses } from "@/hooks/useExpenses";
import { useCalculations } from "@/hooks/useCalculations";

const personalNav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const businessNav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/business", icon: Briefcase, label: "Business" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const openAddForm = useUIStore((s) => s.openAddForm);
  const { currentMonth, currentYear } = useUIStore();
  const { settings } = useSettings();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { expenses } = useExpenses(currentMonth, currentYear);
  const { monthlyTotal, remaining, budgetUsedPercent } = useCalculations(
    expenses,
    settings.categories,
    settings.salary,
    currentMonth,
    currentYear,
    settings.rolloverEnabled,
    settings.rolloverHistory,
  );

  const navItems = settings.businessMode ? businessNav : personalNav;
  const isBusinessRoute = pathname.startsWith("/business");
  const isLedgerDetail = /^\/business\/[^/]+/.test(pathname);
  const shouldHideFAB = isLedgerDetail || pathname.startsWith("/settings");
  const hasBudget = settings.salary > 0;
  const pct = Math.min(budgetUsedPercent, 100);
  const overBudget = budgetUsedPercent > 100;

  return (
    <aside className="hidden lg:flex lg:w-[3.5rem] xl:w-[15rem] lg:flex-col transition-[width] duration-200" style={{ background: 'linear-gradient(to bottom, color-mix(in srgb, var(--surface) 94%, var(--primary)), var(--surface), color-mix(in srgb, var(--surface-secondary) 40%, var(--surface)))', borderRight: '1px solid var(--border)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 xl:px-5 py-5 justify-center xl:justify-start" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <Image
          src="/icons/icon-192.png"
          alt="ExpenStream"
          width={32}
          height={32}
          className="rounded-lg flex-shrink-0"
        />
        <span className="hidden xl:inline text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          ExpenStream
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-1.5 xl:px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isBiz = item.href === "/business";
          return (
            <Link
              key={item.href}
              href={item.href}
              {...(item.label === "Settings" ? { "data-tour": "nav-settings-desktop" } : {})}
              aria-current={isActive ? "page" : undefined}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 justify-center xl:justify-start",
                isActive
                  ? isBiz
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 xl:border-l-[3px] border-emerald-600 dark:border-emerald-400"
                    : "bg-[#eef0ff] text-[#4C5CFF] dark:bg-[rgba(123,135,255,0.12)] dark:text-[#7B87FF] xl:border-l-[3px] border-[#4C5CFF] dark:border-[#7B87FF]"
                  : "xl:border-l-[3px] border-transparent hover:bg-[var(--surface-secondary)]"
              )}
              style={!isActive ? { color: 'var(--text-secondary)' } : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Budget Widget — hidden in rail mode */}
      {hasBudget && (
        <div
          className="hidden xl:block mx-3 mb-3 rounded-xl p-3"
          style={{ background: 'var(--surface-secondary)' }}
          title={`${formatCurrency(monthlyTotal)} of ${formatCurrency(settings.salary)} used`}
        >          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Budget
            </span>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              {Math.round(budgetUsedPercent)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <m.div
              className={cn(
                "h-full rounded-full",
                overBudget ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-[#2EC4B6] dark:bg-[#60A5FA]"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px]">
            <span style={{ color: 'var(--text-secondary)' }}>
              {formatCurrency(monthlyTotal)} spent
            </span>
            <span className={cn("font-medium", overBudget ? "text-red-500" : "text-emerald-600 dark:text-emerald-400")}>
              {formatCurrency(Math.abs(remaining))} {overBudget ? "over" : "left"}
            </span>
          </div>
        </div>
      )}

      {/* Add button */}
      {!shouldHideFAB && (
      <div className="p-1.5 xl:p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <m.button
          data-tour="fab-desktop"
          onClick={() => {
            if (isBusinessRoute) {
              useUIStore.getState().openLedgerForm();
            } else {
              openAddForm();
            }
          }}
          title={isBusinessRoute ? "Add Ledger" : "Add Expense"}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            isBusinessRoute
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm shadow-emerald-600/20"
              : "bg-gradient-to-r from-[#FF8A65] to-[#FF7043] text-white hover:from-[#FF7043] hover:to-[#E64A19] shadow-sm shadow-[#FF8A65]/20 dark:from-[#3B82F6] dark:to-[#2563EB] dark:hover:from-[#2563EB] dark:hover:to-[#1D4ED8] dark:shadow-blue-900/20"
          )}
          whileTap={{ scale: 0.96 }}
        >
          <PlusCircle size={18} className="flex-shrink-0" />
          <span className="hidden xl:inline">{isBusinessRoute ? "Add Ledger" : "Add Expense"}</span>
        </m.button>
      </div>
      )}

      {/* User Info + Help */}
      <div className="px-1.5 xl:px-3 pb-4 pt-2 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="hidden xl:block">
          <QuickHelpButton variant="sidebar" />
        </div>
        {user && (
          <Link
            href="/settings#account"
            title={user.name}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--surface-secondary)] justify-center xl:justify-start"
            style={{ color: 'var(--text-secondary)' }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-blue-900/30">
                <User size={12} className="text-amber-600 dark:text-blue-400" />
              </div>
            )}
            <span className="hidden xl:inline truncate text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {user.name}
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
