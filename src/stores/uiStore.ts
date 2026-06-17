import { create } from "zustand";
import type { CategoryId } from "@/types";

type AppMode = "personal" | "business";

interface UIState {
  currentMonth: number;
  currentYear: number;
  activeCategories: CategoryId[];
  searchQuery: string;
  theme: "light" | "dark" | "system";
  showExpenseForm: boolean;
  editingExpenseId: string | null;
  formPrefill: { amount?: number; category?: string; remark?: string } | null;
  showLedgerForm: boolean;
  appMode: AppMode;
  activeLedgerId: string | null;
  showPostcard: boolean;

  setMonth: (month: number, year: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  setActiveCategories: (cats: CategoryId[]) => void;
  toggleCategory: (cat: CategoryId) => void;
  setSearchQuery: (q: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  openAddForm: (prefill?: { amount?: number; category?: string; remark?: string }) => void;
  openEditForm: (id: string) => void;
  closeForm: () => void;
  openLedgerForm: () => void;
  closeLedgerForm: () => void;
  setAppMode: (mode: AppMode) => void;
  setActiveLedger: (id: string | null) => void;
  openPostcard: () => void;
  closePostcard: () => void;
}

const now = new Date();

/** Read appMode from localStorage on the client; safe to call server-side (returns "personal"). */
function loadAppMode(): AppMode {
  if (typeof window === "undefined") return "personal";
  const stored = localStorage.getItem("expenstream-app-mode");
  return stored === "business" ? "business" : "personal";
}

export const useUIStore = create<UIState>((set) => ({
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  activeCategories: [],
  searchQuery: "",
  theme: "system",
  showExpenseForm: false,
  editingExpenseId: null,
  formPrefill: null,
  showLedgerForm: false,
  // Always start with the SSR-safe default; rehydrated on the client in providers.tsx
  appMode: "personal",
  activeLedgerId: null,
  showPostcard: false,

  setMonth: (month, year) => set({ currentMonth: month, currentYear: year }),

  nextMonth: () =>
    set((state) => {
      if (state.currentMonth === 12) {
        return { currentMonth: 1, currentYear: state.currentYear + 1 };
      }
      return { currentMonth: state.currentMonth + 1 };
    }),

  prevMonth: () =>
    set((state) => {
      if (state.currentMonth === 1) {
        return { currentMonth: 12, currentYear: state.currentYear - 1 };
      }
      return { currentMonth: state.currentMonth - 1 };
    }),

  setActiveCategories: (cats) => set({ activeCategories: cats }),

  toggleCategory: (cat) =>
    set((state) => {
      const idx = state.activeCategories.indexOf(cat);
      if (idx >= 0) {
        return {
          activeCategories: state.activeCategories.filter((c) => c !== cat),
        };
      }
      return { activeCategories: [...state.activeCategories, cat] };
    }),

  setSearchQuery: (q) => set({ searchQuery: q }),
  setTheme: (theme) => set({ theme }),

  openAddForm: (prefill) => set({ showExpenseForm: true, editingExpenseId: null, formPrefill: prefill ?? null }),
  openEditForm: (id) => set({ showExpenseForm: true, editingExpenseId: id, formPrefill: null }),
  closeForm: () => set({ showExpenseForm: false, editingExpenseId: null, formPrefill: null }),
  openLedgerForm: () => set({ showLedgerForm: true }),
  closeLedgerForm: () => set({ showLedgerForm: false }),
  setAppMode: (mode) => {
    localStorage.setItem("expenstream-app-mode", mode);
    set({ appMode: mode });
  },
  setActiveLedger: (id) => set({ activeLedgerId: id }),
  openPostcard: () => set({ showPostcard: true }),
  closePostcard: () => set({ showPostcard: false }),
}));

/**
 * Client-side rehydration: reads appMode from localStorage and applies it to the
 * store. Call once in a top-level useEffect to avoid SSR/client hydration mismatch.
 */
export function rehydrateAppMode() {
  useUIStore.setState({ appMode: loadAppMode() });
}
