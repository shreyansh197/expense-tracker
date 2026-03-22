"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, Plus, PlusCircle, Settings, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";

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

export function BottomNav() {
  const pathname = usePathname();
  const openAddForm = useUIStore((s) => s.openAddForm);
  const { settings } = useSettings();
  const isBusiness = settings.businessMode;
  const isBusinessRoute = pathname.startsWith("/business");

  /* ── BUSINESS MODE — 5-item inline grid ────────────────── */
  if (isBusiness) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80 lg:hidden"
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
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-white shadow-lg active:scale-95",
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

  /* ── PERSONAL MODE — Floating centre FAB + 3-link bar ─── */
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Floating Add button */}
      <div className="flex justify-center -mb-4">
        <button
          onClick={openAddForm}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white dark:ring-gray-950 active:scale-95"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Nav bar */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto grid w-full max-w-lg grid-cols-3 pt-4 pb-1.5">
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
      </div>
    </nav>
  );
}
