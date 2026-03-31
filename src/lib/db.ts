import Dexie, { type Table } from "dexie";
import type {
  CategoryId,
  CategoryMeta,
  RecurringExpense,
  SavedFilter,
  Goal,
  RevenueExpectation,
  LedgerStatus,
  PaymentMethod,
  DashboardLayout,
} from "@/types";

// ── IDB record types ──

export interface IDBExpense {
  id: string;
  workspaceId: string;
  category: CategoryId;
  amount: number;
  currency?: string;
  day: number;
  month: number;
  year: number;
  remark?: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface IDBSettings {
  workspaceId: string;
  salary: number;
  currency: string;
  categories: CategoryId[];
  customCategories: CategoryMeta[];
  hiddenDefaults: CategoryId[];
  categoryBudgets: Record<CategoryId, number>;
  recurringExpenses: RecurringExpense[];
  savedFilters: SavedFilter[];
  goals: Goal[];
  rolloverEnabled: boolean;
  rolloverHistory: Record<string, number>;
  monthlyBudgets?: Record<string, number>;
  businessMode: boolean;
  revenueExpectations: RevenueExpectation[];
  businessTags: string[];
  dashboardLayout?: DashboardLayout;
  multiCurrencyEnabled?: boolean;
  dismissedRecurringSuggestions?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  autoRules?: any[];
  updatedAt: number;
}

export interface IDBLedger {
  id: string;
  workspaceId: string;
  name: string;
  expectedAmount: number;
  currency: string;
  status: LedgerStatus;
  dueDate?: string;
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface IDBPayment {
  id: string;
  workspaceId: string;
  ledgerId: string;
  amount: number;
  date: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface IDBMutation {
  localId?: number;
  table: "expenses" | "workspace_settings" | "business_ledgers" | "business_payments";
  operation: "upsert" | "delete";
  id?: string;
  data: Record<string, unknown>;
  idempotencyKey: string;
  workspaceId: string;
  createdAt: number;
}

export interface IDBSyncMeta {
  workspaceId: string;
  cursor: string;
  lastSyncAt: number;
}

// ── Database ──

class ExpenseDB extends Dexie {
  expenses!: Table<IDBExpense, string>;
  settings!: Table<IDBSettings, string>;
  ledgers!: Table<IDBLedger, string>;
  payments!: Table<IDBPayment, string>;
  mutations!: Table<IDBMutation, number>;
  syncMeta!: Table<IDBSyncMeta, string>;

  constructor() {
    super("expenstream");
    this.version(1).stores({
      expenses: "id, workspaceId, [workspaceId+month+year], category",
      settings: "workspaceId",
      ledgers: "id, workspaceId",
      payments: "id, workspaceId, ledgerId",
      mutations: "++localId, workspaceId, idempotencyKey",
      syncMeta: "workspaceId",
    });
  }
}

export const db = new ExpenseDB();

// ── Migration from localStorage → IDB ──

const MIGRATION_KEY = "expenstream-idb-migrated";

export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_KEY)) return;

  try {
    // Migrate offline mutations
    const rawMutations = localStorage.getItem("expenstream-offline-mutations");
    if (rawMutations) {
      const mutations: IDBMutation[] = JSON.parse(rawMutations).map(
        (m: Record<string, unknown>) => ({
          ...m,
          workspaceId: m.workspaceId || "",
          createdAt: Date.now(),
        })
      );
      if (mutations.length > 0) {
        await db.mutations.bulkAdd(mutations);
      }
    }

    // Migrate sync cursor
    const rawCursors = localStorage.getItem("expenstream-sync-cursor");
    if (rawCursors) {
      const cursors: Record<string, string> = JSON.parse(rawCursors);
      for (const [wid, cursor] of Object.entries(cursors)) {
        await db.syncMeta.put({ workspaceId: wid, cursor, lastSyncAt: 0 });
      }
    }

    localStorage.setItem(MIGRATION_KEY, "1");
  } catch {
    // Non-fatal — fresh IDB is fine
  }
}
