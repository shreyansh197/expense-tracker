export interface Expense {
  id: string;
  category: CategoryId;
  amount: number;
  day: number;
  month: number;
  year: number;
  remark?: string;
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
  createdAt: number;
  updatedAt: number;
}

export type CategoryId =
  | "subscriptions"
  | "transport"
  | "groceries"
  | "eat-out"
  | "shopping"
  | "miscellaneous"
  | "credit-card"
  | "internet"
  | "sip-nps";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface MonthYear {
  month: number;
  year: number;
}

export interface DailyTotal {
  day: number;
  total: number;
}

export interface CategoryTotal {
  category: CategoryId;
  total: number;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";
