"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { m, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { buildCategoryMap } from "@/lib/categories";
import { db } from "@/lib/db";
import { getActiveWorkspaceId } from "@/lib/authClient";

interface QuickAddSheetProps {
  open: boolean;
  onClose: () => void;
}

interface RecentCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export function QuickAddSheet({ open, onClose }: QuickAddSheetProps) {
  const [amount, setAmount] = useState("");
  const [recent, setRecent] = useState<RecentCategory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettings();
  const { symbol } = useCurrency();

  const catMap = buildCategoryMap(settings.customCategories, settings.hiddenDefaults);

  // Load 4 most recently used categories from Dexie
  useEffect(() => {
    if (!open) return;
    async function load() {
      const wid = getActiveWorkspaceId();
      if (!wid) return;
      const rows = await db.expenses
        .where("workspaceId")
        .equals(wid)
        .filter((e) => !e.deletedAt)
        .sortBy("createdAt");

      // dedupe by category, most recent first
      const seen = new Set<string>();
      const cats: RecentCategory[] = [];
      for (let i = rows.length - 1; i >= 0 && cats.length < 4; i--) {
        const cat = rows[i].category;
        if (seen.has(cat)) continue;
        seen.add(cat);
        const meta = catMap[cat];
        if (!meta) continue;
        // Derive emoji from icon name heuristically, fall back to first letter
        const emoji = ICON_TO_EMOJI[meta.icon ?? ""] ?? meta.label[0];
        cats.push({ id: cat, label: meta.label, emoji, color: meta.color, bgColor: meta.bgColor });
      }
      setRecent(cats);
    }
    load();
    // reset amount when opening
    setAmount("");
    setTimeout(() => inputRef.current?.focus(), 120);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleCategoryTap(catId: string) {
    const n = parseFloat(amount.replace(/,/g, ""));
    onClose();
    useUIStore.getState().openAddForm({
      ...(n > 0 ? { amount: n } : {}),
      category: catId,
    });
  }

  function handleOpenFull() {
    const n = parseFloat(amount.replace(/,/g, ""));
    onClose();
    useUIStore.getState().openAddForm(n > 0 ? { amount: n } : undefined);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            key="qa-backdrop"
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.45)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onPointerDown={onClose}
          />

          {/* Sheet */}
          <m.div
            key="qa-sheet"
            className="fixed left-0 right-0 z-[201] mx-auto max-w-lg rounded-t-2xl px-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] pt-5"
            style={{
              bottom: 0,
              background: "var(--surface-elevated, var(--surface))",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Handle + close */}
            <div className="mb-4 flex items-center justify-between">
              <div
                className="h-1 w-8 rounded-full"
                style={{ background: "var(--border)" }}
              />
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Quick add
            </p>

            {/* Amount input */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold" style={{ color: "var(--text-muted)" }}>{symbol}</span>
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleOpenFull()}
                className="flex-1 bg-transparent text-3xl font-bold focus:outline-none font-numeric"
                style={{ color: "var(--text-primary)" }}
              />
            </div>

            {/* Recent category chips */}
            {recent.length > 0 && (
              <>
                <p className="mb-2.5 text-xs" style={{ color: "var(--text-muted)" }}>Recent categories — tap to add</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {recent.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryTap(cat.id)}
                      className="flex flex-col items-center gap-1.5 rounded-xl py-3 transition-transform active:scale-95"
                      style={{ background: cat.bgColor }}
                    >
                      <span className="text-xl leading-none">{cat.emoji}</span>
                      <span className="text-[10px] font-medium leading-tight text-center px-1" style={{ color: cat.color }}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Full form button */}
            <button
              onClick={handleOpenFull}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--accent)" }}
            >
              <span>Open full form</span>
              <ArrowRight size={16} />
            </button>
          </m.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// Map Lucide icon names used in categories → display emoji
const ICON_TO_EMOJI: Record<string, string> = {
  Tv: "📺",
  Car: "🚗",
  ShoppingCart: "🛒",
  UtensilsCrossed: "🍽️",
  ShoppingBag: "🛍️",
  MoreHorizontal: "⋯",
  CreditCard: "💳",
  Wifi: "🌐",
  Pill: "💊",
  Heart: "❤️",
  Plane: "✈️",
  Home: "🏠",
  Zap: "⚡",
  Coffee: "☕",
  Music: "🎵",
  BookOpen: "📚",
  Dumbbell: "🏋️",
  Wallet: "👛",
  Gift: "🎁",
  Gamepad2: "🎮",
  Baby: "👶",
  PawPrint: "🐾",
  Briefcase: "💼",
  GraduationCap: "🎓",
  Wrench: "🔧",
};
