"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  List,
  Plus,
} from "lucide-react";
import { IconDashboard, IconAnalytics, IconSettings, IconBusiness } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { spring } from "@/lib/motion/tokens";
import { QuickAddSheet } from "@/components/layout/QuickAddSheet";
import { useCalculationsContext } from "@/contexts/CalculationsContext";

const springStiff = spring.stiff;

/* ── NAV LINKS (no Add — FAB handles that) ────────────────── */

const personalLinks = [
  { href: "/", icon: IconDashboard, label: "Home" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/analytics", icon: IconAnalytics, label: "Analytics" },
  { href: "/settings", icon: IconSettings, label: "Settings" },
];

const businessLinks = [
  { href: "/", icon: IconDashboard, label: "Home" },
  { href: "/business", icon: IconBusiness, label: "Business" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/analytics", icon: IconAnalytics, label: "Analytics" },
  { href: "/settings", icon: IconSettings, label: "Settings" },
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

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const navLinks = isBusiness ? businessLinks : personalLinks;
  const gridCols = navLinks.length;
  const accentColor = isBusiness && isBusinessRoute ? "emerald" : "blue";
  const { monthlyTotal } = useCalculationsContext();
  const analyticsNeedsData = monthlyTotal === 0;

  const handleFabPointerDown = () => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([10, 30, 10]);
      setQuickAddOpen(true);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleFabClick = () => {
    if (didLongPress.current) return; // sheet already opened
    cancelLongPress();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(30);
    if (isBusiness && isBusinessRoute) {
      openLedgerForm();
    } else {
      openAddForm();
    }
  };

  const fabConfig = { icon: Plus, key: "plus" };
  const FabIcon = Plus;

  return (
    <>
      {/* ─── FAB (own fixed layer, ABOVE nav) ─── */}
      {!shouldHideFAB && (
      <m.button
        data-tour="fab"
        onClick={handleFabClick}
        onPointerDown={handleFabPointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        aria-label={isBusiness && isBusinessRoute ? "Add ledger" : "Add expense"}
        title={isBusiness && isBusinessRoute ? "Add ledger (Ctrl+N)" : "Add expense (Ctrl+N) · Hold for quick add"}
        className={cn(
          "fixed left-1/2 z-[150] flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-ui-full text-white transition-colors lg:hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          accentColor === "emerald"
            ? "text-white shadow-lg"
            : "bg-accent hover:bg-cta-hover focus-visible:ring-accent shadow-lg shadow-[var(--accent)]/20"
        )}
        style={{
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 12px)`,
          ...(accentColor === "emerald"
            ? { background: 'var(--biz-accent)', boxShadow: '0 10px 15px -3px var(--focus-ring-biz), inset 0 0 12px rgba(52,211,153,0.25)' }
            : { background: 'var(--accent)', boxShadow: '0 8px 20px -4px var(--focus-ring), inset 0 0 12px var(--focus-ring)' }),
        }}
        initial={false}
        whileHover={{ scale: 1.06, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.88 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.span
            key={fabConfig.key}
            initial={{ scale: 0.6, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <FabIcon size={24} strokeWidth={2.5} />
          </m.span>
        </AnimatePresence>
      </m.button>
      )}

      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />

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
                title={item.label}
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
                    className="absolute inset-1 -z-[1] rounded-ui-lg"
                    style={{
                      background: isBiz
                        ? 'var(--biz-accent-soft)'
                        : 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    }}
                    transition={springStiff}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.5}
                  className="transition-all"
                />
                {isActive && (
                  <span className="text-[10px] font-medium leading-tight">
                    {item.label}
                  </span>
                )}
                {isBiz && !isActive && isBusiness && (
                  <span className="absolute top-1 right-1/4 h-1.5 w-1.5 rounded-full bg-biz" />
                )}
                {item.href === "/analytics" && !isActive && analyticsNeedsData && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-[8px] font-bold rounded-full px-1 py-px leading-none"
                    style={{ background: "var(--surface-secondary)", color: "var(--text-muted)" }}
                    aria-label="Needs expense data"
                  >
                    ?
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
