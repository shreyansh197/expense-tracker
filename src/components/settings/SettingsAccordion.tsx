"use client";

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "settings:v2:lastOpen";

interface AccordionContextType {
  openSections: Set<string>;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType>({
  openSections: new Set(),
  toggle: () => {},
});

interface SettingsAccordionProps {
  children: ReactNode;
}

function getInitialOpen(): Set<string> {
  if (typeof window === "undefined") return new Set();

  // 1. Deep-link via hash: /settings#security
  const hash = window.location.hash.replace("#", "");
  if (hash) return new Set([hash]);

  // 2. Deep-link via query param: /settings?open=security
  const params = new URLSearchParams(window.location.search);
  const openParam = params.get("open");
  if (openParam) return new Set([openParam]);

  // 3. Default: all collapsed
  return new Set();
}

export function SettingsAccordion({ children }: SettingsAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(getInitialOpen);

  // Clean up any stale localStorage from previous versions
  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  // Scroll deep-linked section into view
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      requestAnimationFrame(() => {
        document.getElementById(`section-${hash}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Listen for external requests to open a section (e.g. from footer "Log out of all devices")
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (id) {
        setOpenSections((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      }
    };
    window.addEventListener("settings:open-section", handler);
    return () => window.removeEventListener("settings:open-section", handler);
  }, []);

  return (
    <AccordionContext.Provider value={{ openSections, toggle }}>
      <div className="space-y-3">{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionSectionProps {
  id: string;
  icon: ReactNode;
  title: string;
  description?: string;
  badge?: string | number;
  badgeColor?: string;
  children: ReactNode;
  /** Render as always-open (no collapse) */
  alwaysOpen?: boolean;
  /** Right-side header content (e.g. toggle switch) */
  headerRight?: ReactNode;
  className?: string;
}

export function AccordionSection({
  id,
  icon,
  title,
  description,
  badge,
  badgeColor,
  children,
  alwaysOpen,
  headerRight,
  className,
}: AccordionSectionProps) {
  const { openSections, toggle } = useContext(AccordionContext);
  const isOpen = alwaysOpen || openSections.has(id);

  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white transition-shadow dark:border-gray-800 dark:bg-gray-900",
        isOpen && "shadow-sm dark:shadow-gray-950/20",
        className
      )}
    >
      <button
        type="button"
        id={`header-${id}`}
        onClick={() => !alwaysOpen && toggle(id)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left",
          !alwaysOpen && "cursor-pointer",
          alwaysOpen && "cursor-default"
        )}
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-colors dark:bg-gray-800 dark:text-gray-400">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {badge !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  badgeColor || "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                )}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              {description}
            </p>
          )}
        </div>
        {headerRight && (
          <div onClick={(e) => e.stopPropagation()}>{headerRight}</div>
        )}
        {!alwaysOpen && (
          <ChevronDown
            size={16}
            className={cn(
              "shrink-0 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>
      <div
        id={`section-${id}`}
        role="region"
        aria-labelledby={`header-${id}`}
        className={cn(
          "grid transition-[grid-template-rows] duration-[250ms]",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
        style={{ willChange: "grid-template-rows" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-50 px-4 py-4 dark:border-gray-800/60">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
