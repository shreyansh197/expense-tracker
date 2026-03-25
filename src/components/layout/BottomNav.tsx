"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Plus,
  Settings,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";

/* ── NAV LINKS (no Add — FAB handles that) ────────────────── */

const personalLinks = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const businessLinks = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/business", icon: Briefcase, label: "Business" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

/* ── NAV BAR HEIGHT (px) ──────────────────────────────────── */
const NAV_HEIGHT = 56;

/* ── COMPONENT ────────────────────────────────────────────── */

export function BottomNav() {
  const pathname = usePathname();
  const openAddForm = useUIStore((s) => s.openAddForm);
  const openLedgerForm = useUIStore((s) => s.openLedgerForm);
  const { settings } = useSettings();
  const isBusiness = settings.businessMode;
  const isBusinessRoute = pathname.startsWith("/business");
  const isLedgerDetail = /^\/business\/[^/]+/.test(pathname);
  const shouldHideFAB = isLedgerDetail || pathname.startsWith("/settings");

  const navLinks = isBusiness ? businessLinks : personalLinks;
  const gridCols = navLinks.length;
  const accentColor = isBusiness && isBusinessRoute ? "emerald" : "blue";

  const handleFabClick = () => {
    if (isBusiness && isBusinessRoute) {
      openLedgerForm();
    } else {
      openAddForm();
    }
  };

  return (
    <>
      {/* ─── FAB (own fixed layer, ABOVE nav) ─── */}
      {!shouldHideFAB && (
      <button
        onClick={handleFabClick}
        aria-label={isBusiness && isBusinessRoute ? "Add ledger" : "Add expense"}
        className={cn(
          "fixed left-1/2 z-40 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg ring-4 ring-white/80 transition-transform duration-200 active:scale-95 lg:hidden dark:ring-gray-950/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950",
          accentColor === "emerald"
            ? "bg-emerald-600 shadow-emerald-600/25 focus-visible:ring-emerald-500"
            : "bg-blue-600 shadow-blue-600/25 focus-visible:ring-blue-500"
        )}
        style={{
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
        }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
      )}

      {/* ─── Nav bar (z-30, below FAB) ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 shadow-[0_-1px_3px_0_rgba(0,0,0,0.05)] backdrop-blur-lg backdrop-saturate-150 dark:bg-gray-950/80 dark:shadow-[0_-1px_3px_0_rgba(0,0,0,0.2)] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="mx-auto grid w-full max-w-lg py-2"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {navLinks.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            const isBiz = item.href === "/business";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1 transition-colors",
                  isActive
                    ? cn(
                        isBiz
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-600 dark:text-blue-400"
                      )
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                {isActive && (
                  <span className={cn(
                    "absolute -top-2 h-1 w-5 rounded-full",
                    isBiz ? "bg-emerald-600 dark:bg-emerald-400" : "bg-blue-600 dark:bg-blue-400"
                  )} />
                )}
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
