export interface Expense {
  id: string;
  category: CategoryId;
  amount: number;
  day: number;
  month: number;
  year: number;
  remark?: string;
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deviceId: string;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deviceId">;

export interface UserSettings {
  salary: number;
  currency: string;
  categories: CategoryId[];
  customCategories: CategoryMeta[];
  hiddenDefaults: CategoryId[];
  categoryBudgets: Record<CategoryId, number>;
  recurringExpenses: RecurringExpense[];
  savedFilters: SavedFilter[];
  createdAt: number;
  updatedAt: number;
}

export type CategoryId = string;

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export type RecurringFrequency = "monthly";

export interface RecurringExpense {
  id: string;
  category: CategoryId;
  amount: number;
  day: number;
  remark: string;
  frequency: RecurringFrequency;
  active: boolean;
  createdAt: number;
}

export interface SavedFilter {
  id: string;
  name: string;
  categories: CategoryId[];
  searchQuery: string;
  amountMin?: number;
  amountMax?: number;
}

export interface MonthYear {
  month: number;
  year: number;
}

export interface DailyTotal {
  day: number;
  total: number;
}

export interface StackedDailyTotal {
  day: number;
  total: number;
  [category: string]: number;
}

export interface CategoryTotal {
  category: CategoryId;
  total: number;
}

export interface Forecast {
  projectedTotal: number;    // EOM projected spend
  projectedRemaining: number; // salary - projectedTotal
  confidence: "low" | "medium" | "high"; // based on elapsed days
}

export interface AnomalyResult {
  expense: Expense;
  zScore: number;            // how many MADs from median
  categoryMedian: number;
  categoryMad: number;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";
