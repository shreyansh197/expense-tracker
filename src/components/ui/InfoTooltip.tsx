"use client";

import { useState, useRef, useEffect } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoTooltip({ title, children, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div className={cn("relative inline-flex", className)} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        aria-label={`Info: ${title}`}
        type="button"
      >
        <Info size={13} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:w-72">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h4>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={12} />
            </button>
          </div>
          <div className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
