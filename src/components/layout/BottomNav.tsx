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
  const { settings } = useSettings();
  const isBusiness = settings.businessMode;
  const isBusinessRoute = pathname.startsWith("/business");

  const navLinks = isBusiness ? businessLinks : personalLinks;
  const gridCols = navLinks.length;
  const accentColor = isBusiness && isBusinessRoute ? "emerald" : "blue";

  const handleFabClick = () => {
    if (isBusiness && isBusinessRoute) {
      window.location.href = "/business?add=1";
    } else {
      openAddForm();
    }
  };

  return (
    <>
      {/* ─── FAB (own fixed layer, ABOVE nav) ─── */}
      <button
        onClick={handleFabClick}
        aria-label={isBusiness && isBusinessRoute ? "Add ledger" : "Add expense"}
        className={cn(
          "fixed left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 active:scale-90 lg:hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950",
          accentColor === "emerald"
            ? "bg-emerald-600 shadow-emerald-600/25 focus-visible:ring-emerald-500"
            : "bg-blue-600 shadow-blue-600/25 focus-visible:ring-blue-500"
        )}
        style={{
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ─── Nav bar (z-30, below FAB) ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80 lg:hidden"
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
                  "flex flex-col items-center justify-center gap-0.5 py-1 transition-colors",
                  isActive
                    ? isBiz
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
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
