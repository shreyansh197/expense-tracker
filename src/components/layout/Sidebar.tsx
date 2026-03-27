"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Settings, PlusCircle, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";

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
  const { settings } = useSettings();
  const navItems = settings.businessMode ? businessNav : personalNav;
  const isBusinessRoute = pathname.startsWith("/business");
  const isLedgerDetail = /^\/business\/[^/]+/.test(pathname);
  const shouldHideFAB = isLedgerDetail || pathname.startsWith("/settings");

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-slate-200/80 lg:bg-white lg:dark:border-slate-800/60 lg:dark:bg-slate-900">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-5 dark:border-slate-800/60">
        <div className="h-8 w-8 overflow-hidden rounded-lg shadow-sm">
          <Image src="/icons/icon-192.png" alt="Spendly" width={32} height={32} className="h-full w-full" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Spendly
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isBiz = item.href === "/business";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.8125rem] font-medium transition-colors",
                isActive
                  ? isBiz
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Add button */}
      {!shouldHideFAB && (
      <div className="border-t border-slate-100 p-3 dark:border-slate-800/60">
        <button
          onClick={() => {
            if (isBusinessRoute) {
              useUIStore.getState().openLedgerForm();
            } else {
              openAddForm();
            }
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]",
            isBusinessRoute
              ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              : "bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          )}
        >
          <PlusCircle size={18} />
          {isBusinessRoute ? "Add Ledger" : "Add Expense"}
        </button>
      </div>
      )}
    </aside>
  );
}
