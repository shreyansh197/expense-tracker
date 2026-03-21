"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  defaultOpen?: string[];
}

export function SettingsAccordion({ children, defaultOpen = [] }: SettingsAccordionProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        "rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow dark:border-gray-800 dark:bg-gray-900",
        isOpen && "shadow-md dark:shadow-gray-950/30",
        className
      )}
    >
      <button
        type="button"
        onClick={() => !alwaysOpen && toggle(id)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left",
          !alwaysOpen && "cursor-pointer",
          alwaysOpen && "cursor-default"
        )}
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
                  badgeColor || "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
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
        className={cn(
          "grid transition-[grid-template-rows] duration-200",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-800">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
