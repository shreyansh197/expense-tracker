import { create } from "zustand";
import type { CategoryId } from "@/types";

interface UIState {
  currentMonth: number;
  currentYear: number;
  activeCategories: CategoryId[];
  searchQuery: string;
  theme: "light" | "dark" | "system";
  showExpenseForm: boolean;
  editingExpenseId: string | null;

  setMonth: (month: number, year: number) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  setActiveCategories: (cats: CategoryId[]) => void;
  toggleCategory: (cat: CategoryId) => void;
  setSearchQuery: (q: string) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  openAddForm: () => void;
  openEditForm: (id: string) => void;
  closeForm: () => void;
}

const now = new Date();

export const useUIStore = create<UIState>((set) => ({
  currentMonth: now.getMonth() + 1,
  currentYear: now.getFullYear(),
  activeCategories: [],
  searchQuery: "",
  theme: "system",
  showExpenseForm: false,
  editingExpenseId: null,

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

  openAddForm: () => set({ showExpenseForm: true, editingExpenseId: null }),
  openEditForm: (id) => set({ showExpenseForm: true, editingExpenseId: id }),
  closeForm: () => set({ showExpenseForm: false, editingExpenseId: null }),
}));
