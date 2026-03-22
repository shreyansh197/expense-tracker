"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Settings, PlusCircle, Wallet, Briefcase } from "lucide-react";
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

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white lg:dark:border-gray-800 lg:dark:bg-gray-950">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-white",
          isBusinessRoute ? "bg-emerald-600" : "bg-blue-600"
        )}>
          <Wallet size={18} />
        </div>
        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          ExpenseTracker
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const isBiz = item.href === "/business";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? isBiz
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Add button */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <button
          onClick={() => {
            if (isBusinessRoute) {
              useUIStore.getState().openLedgerForm();
            } else {
              openAddForm();
            }
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors active:scale-[0.98]",
            isBusinessRoute
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-blue-600 hover:bg-blue-700"
          )}
        >
          <PlusCircle size={18} />
          {isBusinessRoute ? "Add Ledger" : "Add Expense"}
        </button>
      </div>
    </aside>
  );
}
