"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Plus,
  PlusCircle,
  Settings,
  Briefcase,
  Receipt,
  ArrowDownCircle,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";

/* ── NAV DATA ─────────────────────────────────────────────── */

const personalLinks = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const businessNav = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/business", icon: Briefcase, label: "Business" },
  { href: "#add", icon: PlusCircle, label: "Add", isAction: true },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

/* ── SPEED-DIAL ACTIONS ───────────────────────────────────── */

const speedDialActions = [
  { key: "expense", label: "Add Expense", icon: Receipt },
  { key: "income", label: "Add Income", icon: ArrowDownCircle },
  { key: "transfer", label: "Add Transfer", icon: ArrowUpDown },
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
  const [fabOpen, setFabOpen] = useState(false);

  // Close speed-dial on route change
  useEffect(() => { setFabOpen(false); }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!fabOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFabOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fabOpen]);

  const handleSpeedDialAction = useCallback(
    (_key: string) => {
      setFabOpen(false);
      openAddForm();
    },
    [openAddForm],
  );

  /* ── BUSINESS MODE — 5-item inline grid ────────────────── */
  if (isBusiness) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="mx-auto grid w-full max-w-lg py-1.5"
          style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
        >
          {businessNav.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            const isBiz = item.href === "/business";

            if (item.isAction) {
              return (
                <div key={item.label} className="flex justify-center">
                  <button
                    onClick={() => {
                      if (isBusinessRoute) {
                        window.location.href = "/business?add=1";
                      } else {
                        openAddForm();
                      }
                    }}
                    aria-label="Add"
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-white shadow-lg transition-transform active:scale-95",
                      isBusinessRoute ? "bg-emerald-600" : "bg-blue-600"
                    )}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                </div>
              );
            }

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
    );
  }

  /* ── PERSONAL MODE — Separate FAB (z-40) + Nav bar (z-30) ── */
  return (
    <>
      {/* ─── Speed-dial scrim ─── */}
      {fabOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden animate-[fadeIn_150ms_ease-out] motion-reduce:animate-none"
          onClick={() => setFabOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ─── Speed-dial menu ─── */}
      {fabOpen && (
        <div
          className="fixed left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-3 lg:hidden animate-[slideUp_200ms_ease-out] motion-reduce:animate-none"
          style={{
            bottom: `calc(${NAV_HEIGHT}px + 40px + env(safe-area-inset-bottom, 0px))`,
          }}
        >
          {speedDialActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                onClick={() => handleSpeedDialAction(action.key)}
                className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5 transition-transform active:scale-95 dark:bg-gray-800 dark:ring-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Icon size={20} />
                </div>
                <span className="pr-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── FAB (own fixed layer, ABOVE nav) ─── */}
      <button
        onClick={() => setFabOpen((prev) => !prev)}
        aria-label={fabOpen ? "Close menu" : "Add"}
        aria-expanded={fabOpen}
        className={cn(
          "fixed left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full shadow-lg shadow-blue-600/25 transition-all duration-200 active:scale-90 lg:hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950",
          fabOpen
            ? "bg-gray-700 text-white dark:bg-gray-600"
            : "bg-blue-600 text-white"
        )}
        style={{
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) - 8px)`,
        }}
      >
        <Plus
          size={26}
          strokeWidth={2.5}
          className={cn(
            "transition-transform duration-200 motion-reduce:transition-none",
            fabOpen && "rotate-45"
          )}
        />
      </button>

      {/* ─── Nav bar (z-30, below FAB) ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid w-full max-w-lg grid-cols-3 py-2">
          {personalLinks.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-1 transition-colors",
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
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
