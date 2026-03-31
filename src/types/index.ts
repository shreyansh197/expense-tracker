export interface Expense {
  id: string;
  category: CategoryId;
  amount: number;
  currency?: string;
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
  goals?: Goal[];
  rolloverEnabled?: boolean;
  rolloverHistory?: Record<string, number>; // key: "YYYY-MM", value: unspent amount
  monthlyBudgets?: Record<string, number>; // key: "YYYY-MM", value: budget override for that month
  businessMode?: boolean;
  revenueExpectations?: RevenueExpectation[];
  businessTags?: string[];
  dashboardLayout?: DashboardLayout;
  multiCurrencyEnabled?: boolean;
  dismissedRecurringSuggestions?: string[];
  autoRules?: AutoRule[];
  createdAt: number;
  updatedAt: number;
}

export interface AutoRule {
  id: string;
  name: string;
  condition: {
    field: "remark" | "amount" | "category";
    operator: "contains" | "equals" | "greater_than" | "less_than";
    value: string;
  };
  action: {
    type: "set_category" | "add_tag" | "flag";
    value: string;
  };
  enabled: boolean;
  createdAt: number;
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

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string; // "YYYY-MM" format
  monthlyContribution?: number;
  color: string;
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
  method: "linear" | "weighted";
  historicalMonths: number;  // how many past months used (0 = linear only)
}

export interface AnomalyResult {
  expense: Expense;
  zScore: number;            // how many MADs from median
  categoryMedian: number;
  categoryMad: number;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

// ── Business Owner Mode ──

export type LedgerStatus = "active" | "completed" | "cancelled";
export type PaymentMethod = "bank_transfer" | "cash" | "upi" | "cheque" | "other";

export interface Ledger {
  id: string;
  name: string;
  expectedAmount: number;
  currency: string;
  status: LedgerStatus;
  dueDate?: string; // ISO date
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deviceId: string;
}

export type LedgerInput = Omit<Ledger, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deviceId">;

export interface Payment {
  id: string;
  ledgerId: string;
  amount: number;
  date: string; // ISO date
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  deviceId: string;
}

export type PaymentInput = Omit<Payment, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deviceId">;

export interface RevenueExpectation {
  month: string; // "YYYY-MM"
  expectedRevenue: number;
}

// ── Dashboard Customization ──

export type DashboardSectionId = "kpi" | "alerts" | "subscriptions" | "goals" | "charts" | "recent";

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  sections: DashboardSectionConfig[];
}
