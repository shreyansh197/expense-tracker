import type { CategoryId, CategoryMeta } from "@/types";

export const DEFAULT_CATEGORIES_META: CategoryMeta[] = [
  {
    id: "subscriptions",
    label: "Subscriptions",
    color: "#8B5CF6",
    bgColor: "#8B5CF620",
    icon: "Tv",
  },
  {
    id: "transport",
    label: "Transport",
    color: "#3B82F6",
    bgColor: "#3B82F620",
    icon: "Car",
  },
  {
    id: "groceries",
    label: "Groceries",
    color: "#10B981",
    bgColor: "#10B98120",
    icon: "ShoppingCart",
  },
  {
    id: "eat-out",
    label: "Eat Out / Order",
    color: "#F97316",
    bgColor: "#F9731620",
    icon: "UtensilsCrossed",
  },
  {
    id: "shopping",
    label: "Shopping",
    color: "#EC4899",
    bgColor: "#EC489920",
    icon: "ShoppingBag",
  },
  {
    id: "miscellaneous",
    label: "Miscellaneous",
    color: "#6B7280",
    bgColor: "#6B728020",
    icon: "MoreHorizontal",
  },
  {
    id: "credit-card",
    label: "Credit Card",
    color: "#EF4444",
    bgColor: "#EF444420",
    icon: "CreditCard",
  },
  {
    id: "internet",
    label: "Internet",
    color: "#06B6D4",
    bgColor: "#06B6D420",
    icon: "Wifi",
  },
  {
    id: "sip-nps",
    label: "SIP & NPS",
    color: "#14B8A6",
    bgColor: "#14B8A620",
    icon: "TrendingUp",
  },
];

export const CATEGORIES = DEFAULT_CATEGORIES_META;

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  DEFAULT_CATEGORIES_META.map((c) => [c.id, c])
);

export const DEFAULT_CATEGORIES: CategoryId[] = DEFAULT_CATEGORIES_META.map((c) => c.id);

export const PRESET_COLORS = [
  // Purples & Violets
  "#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD", "#6366F1", "#818CF8",
  // Blues
  "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD", "#0EA5E9", "#38BDF8",
  // Cyans & Teals
  "#0891B2", "#06B6D4", "#22D3EE", "#0D9488", "#14B8A6", "#2DD4BF",
  // Greens
  "#059669", "#10B981", "#34D399", "#4ADE80", "#84CC16", "#A3E635",
  // Yellows & Ambers
  "#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#CA8A04",
  // Oranges
  "#EA580C", "#F97316", "#FB923C",
  // Reds & Roses
  "#DC2626", "#EF4444", "#F87171", "#E11D48", "#FB7185",
  // Pinks & Fuchsias
  "#BE185D", "#EC4899", "#F472B6", "#A21CAF", "#D946EF", "#E879F9",
  // Neutrals
  "#374151", "#6B7280", "#9CA3AF",
];

export function getAllCategories(customCategories: CategoryMeta[] = [], hiddenDefaults: string[] = []): CategoryMeta[] {
  const defaults = hiddenDefaults.length > 0
    ? DEFAULT_CATEGORIES_META.filter((c) => !hiddenDefaults.includes(c.id))
    : DEFAULT_CATEGORIES_META;
  return [...defaults, ...customCategories];
}

export function buildCategoryMap(customCategories: CategoryMeta[] = [], hiddenDefaults: string[] = []): Record<string, CategoryMeta> {
  const all = getAllCategories(customCategories, hiddenDefaults);
  return Object.fromEntries(all.map((c) => [c.id, c]));
}
