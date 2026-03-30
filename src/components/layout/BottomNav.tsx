"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
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
      <m.button
        data-tour="fab"
        onClick={handleFabClick}
        aria-label={isBusiness && isBusinessRoute ? "Add ledger" : "Add expense"}
        className={cn(
          "fixed left-1/2 z-40 flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg shadow-black/15 ring-[3px] ring-white/70 transition-colors lg:hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          accentColor === "emerald"
            ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500"
            : "bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500"
        )}
        style={{
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
        whileTap={{ scale: 0.88 }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </m.button>
      )}

      {/* ─── Nav bar (z-30, below FAB) ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-2xl lg:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          background: 'color-mix(in srgb, var(--surface) 85%, transparent)',
          borderColor: 'var(--border)',
        }}
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
                {...(item.label === "Settings" ? { "data-tour": "nav-settings" } : {})}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
                  isActive
                    ? cn(
                        isBiz
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-indigo-600 dark:text-indigo-400"
                      )
                    : ""
                )}
                style={!isActive ? { color: 'var(--text-muted)' } : undefined}
              >
                {isActive && (
                  <m.span
                    layoutId="nav-active-indicator"
                    className={cn(
                      "absolute -top-2 h-[3px] w-6 rounded-full",
                      isBiz ? "bg-emerald-600 dark:bg-emerald-400" : "bg-indigo-600 dark:bg-indigo-400"
                    )}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon size={22} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
