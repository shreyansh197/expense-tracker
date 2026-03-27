"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoTooltip({ title, children, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number; width: number; flipUp: boolean }>({
    left: 0,
    width: 288,
    flipUp: false,
  });

  const reposition = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const panelW = Math.min(288, window.innerWidth - 16);
    const spaceBelow = window.innerHeight - r.bottom;
    const flip = spaceBelow < 220;
    // Align right edge of panel with right edge of button, clamped to screen
    let left = r.right - panelW;
    left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8));
    setPos(
      flip
        ? { bottom: window.innerHeight - r.top + 4, left, width: panelW, flipUp: true }
        : { top: r.bottom + 4, left, width: panelW, flipUp: false },
    );
  }, []);

  // Measure on step change + scroll/resize
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => reposition());
    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    const handler = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open, reposition]);

  return (
    <span className={cn("relative inline-flex", className)} ref={btnRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        aria-label={`Info: ${title}`}
        type="button"
      >
        <Info size={13} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            style={{
              width: pos.width,
              left: pos.left,
              ...(pos.flipUp ? { bottom: pos.bottom } : { top: pos.top }),
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h4>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label="Close tooltip"
              >
                <X size={12} />
              </button>
            </div>
            <div className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {children}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
