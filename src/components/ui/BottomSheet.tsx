"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { spring, duration } from "@/lib/motion/tokens";

const DISMISS_THRESHOLD = 100;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** aria-label for the dialog */
  label?: string;
  /** Extra className for the sheet panel */
  className?: string;
  /** Spring preset for entrance animation (default: spring.default) */
  springPreset?: { type: "spring"; stiffness: number; damping: number };
}

export function BottomSheet({ open, onClose, children, label, className, springPreset }: BottomSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const triggerRef = useRef<Element | null>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      dragStartRef.current = null;
      triggerRef.current = document.activeElement;
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const modal = trapRef.current;
    if (modal) {
      modal.querySelectorAll<HTMLElement>("input, textarea, select").forEach((el) => {
        el.setAttribute("tabindex", "-1");
        el.setAttribute("readonly", "");
        (el as HTMLInputElement).disabled = true;
      });
    }
    onClose();
    // Restore focus to the element that triggered the modal
    requestAnimationFrame(() => {
      if (triggerRef.current instanceof HTMLElement) {
        triggerRef.current.focus();
      }
    });
  }, [onClose, trapRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartRef.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartRef.current === null) return;
    const delta = e.touches[0].clientY - dragStartRef.current;
    if (delta > 0) setDragY(delta);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY > DISMISS_THRESHOLD) {
      handleClose();
    }
    setDragY(0);
    dragStartRef.current = null;
  }, [dragY, handleClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) handleClose();
    },
    [handleClose]
  );

  // Scroll focused inputs into view when the keyboard opens
  useEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const rawDiff = window.innerHeight - vv.height;
      // Only react when viewport shrank by > 150px (real keyboard, not address-bar)
      if (rawDiff <= 150) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
        });
      }
    };
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-[200] flex items-end justify-center backdrop-blur-sm md:items-center"
          onClick={handleBackdropClick}
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          exit={{ backgroundColor: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.15 }}
        >
          <m.div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl shadow-lg md:max-h-none md:overflow-visible md:rounded-2xl ${className ?? ""}`}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              // Only apply drag transform. Keyboard lifting is handled by
              // scrollIntoView above — translateY during scroll causes jank
              // because visualViewport.resize fires on every address-bar animation.
              transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
              opacity: dragY > 0 ? Math.max(1 - dragY / 300, 0.5) : 1,
            }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            animate={shouldReduceMotion
              ? { opacity: 1, transition: { duration: 0.15 } }
              : { opacity: 1, y: 0, scale: 1, transition: springPreset ?? spring.default }}
            exit={shouldReduceMotion
              ? { opacity: 0, transition: { duration: 0.1 } }
              : { opacity: 0, y: 20, scale: 0.97, transition: { duration: duration.exit, ease: "easeIn" } }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 lg:hidden">
              <div className="h-1 w-10 rounded-full" style={{ background: "var(--border)" }} />
            </div>
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
