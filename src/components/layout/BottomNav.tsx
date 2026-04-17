"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import {
  List,
  Plus,
} from "lucide-react";
import { IconDashboard, IconAnalytics, IconSettings, IconBusiness } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { spring } from "@/lib/motion/tokens";

const springStiff = spring.stiff;

/* ── NAV LINKS (no Add — FAB handles that) ────────────────── */

const personalLinks = [
  { href: "/", icon: IconDashboard, label: "Home" },
  { href: "/expenses", icon: List, label: "Stream" },
  { href: "/analytics", icon: IconAnalytics, label: "Overlook" },
  { href: "/settings", icon: IconSettings, label: "Workshop" },
];

const businessLinks = [
  { href: "/", icon: IconDashboard, label: "Home" },
  { href: "/business", icon: IconBusiness, label: "Trading" },
  { href: "/expenses", icon: List, label: "Stream" },
  { href: "/analytics", icon: IconAnalytics, label: "Overlook" },
  { href: "/settings", icon: IconSettings, label: "Workshop" },
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
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
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
        title={isBusiness && isBusinessRoute ? "Add ledger (Ctrl+N)" : "Add expense (Ctrl+N)"}
        className={cn(
          "fixed left-1/2 z-[150] flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full text-white transition-colors lg:hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          accentColor === "emerald"
            ? "text-white shadow-lg"
            : "bg-accent hover:bg-cta-hover focus-visible:ring-accent shadow-lg shadow-[var(--accent)]/20"
        )}
        style={{
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
          ...(accentColor === "emerald"
            ? { background: 'var(--biz-accent)', boxShadow: '0 10px 15px -3px var(--focus-ring-biz), inset 0 0 12px rgba(52,211,153,0.25)' }
            : { background: 'var(--es-moss)', boxShadow: '0 8px 20px -4px rgba(61,90,62,0.35), inset 0 0 12px rgba(61,90,62,0.2)' }),
        }}
        initial={false}
        whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.88 }}
      >
        <Plus size={24} strokeWidth={2.5} />
      </m.button>
      )}

      {/* ─── Nav bar (z-30, below FAB) ─── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-[100] border-t lg:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          background: 'color-mix(in srgb, var(--surface) 97%, transparent)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-1.5 transition-colors",
                  isActive
                    ? cn(
                        isBiz
                          ? "text-[var(--biz-accent-text)]"
                          : "text-accent"
                      )
                    : ""
                )}
                style={!isActive ? { color: 'var(--text-muted)' } : undefined}
              >
                {isActive && (
                  <m.span
                    layoutId="nav-pill"
                    className="absolute inset-1 -z-[1] rounded-2xl"
                    style={{
                      background: isBiz
                        ? 'var(--biz-accent-soft)'
                        : 'color-mix(in srgb, var(--es-moss, #3D5A3E) 12%, transparent)',
                    }}
                    transition={springStiff}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className="transition-all"
                />
                <span
                  className="text-[10px] font-medium leading-tight"
                >
                  {item.label}
                </span>
                {isBiz && !isActive && isBusiness && (
                  <span className="absolute top-1 right-1/4 h-1.5 w-1.5 rounded-full bg-biz" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
