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
  "#8B5CF6", "#3B82F6", "#10B981", "#F97316", "#EC4899",
  "#6B7280", "#EF4444", "#06B6D4", "#14B8A6", "#F59E0B",
  "#84CC16", "#A855F7", "#E11D48", "#0891B2", "#D946EF",
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
