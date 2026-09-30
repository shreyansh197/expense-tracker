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
  ExpenseTemplate,
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
  rolloverCap: number; // 0 = unlimited
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  achievements?: any[];
  accentColor?: string;
  sunsetTheme?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  notificationPrefs?: any;
  quickTemplates?: ExpenseTemplate[];
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
  /** Number of push attempts made so far. 0 = never attempted. */
  attempts: number;
  /** Earliest epoch ms at which this mutation may be retried. 0 = eligible now. */
  nextRetryAt: number;
  /** Short, redacted description of the last failure (never contains request body / money). */
  lastError?: string | null;
  /**
   * Set only on the corrective upsert enqueued by `resolveMoneyConflict`. Signals
   * to the server that this write resolves a money-field conflict so it can emit a
   * `conflict.resolve.money` audit row. Carries no monetary values (R-8).
   */
  conflict?: { field: string; choice: "mine" | "theirs" };
}

export interface IDBSyncMeta {
  workspaceId: string;
  cursor: string;
  lastSyncAt: number;
}

export interface IDBExchangeRate {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
  source: "frankfurter" | "fawazahmed" | "fallback";
}

export interface IDBCalcCache {
  key: string; // workspaceId-month-year
  data: string; // JSON-serialized calc results
  computedAt: number;
}

export interface IDBWatcherInsight {
  id?: number; // auto-increment PK
  text: string;
  type: string;
  savedAt: number;
}

export interface IDBTimeMachineScenario {
  id: string;
  name: string;
  sourceCategory: string;
  targetCategory: string;
  replacementAmount: number;
  savedAt: number;
}

// ── Database ──

class ExpenseDB extends Dexie {
  expenses!: Table<IDBExpense, string>;
  settings!: Table<IDBSettings, string>;
  ledgers!: Table<IDBLedger, string>;
  payments!: Table<IDBPayment, string>;
  mutations!: Table<IDBMutation, number>;
  syncMeta!: Table<IDBSyncMeta, string>;
  exchangeRates!: Table<IDBExchangeRate, string>;
  calcCache!: Table<IDBCalcCache, string>;
  watcherHistory!: Table<IDBWatcherInsight, number>;
  timeMachineScenarios!: Table<IDBTimeMachineScenario, string>;

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
    this.version(2).stores({
      expenses: "id, workspaceId, [workspaceId+month+year], category",
      settings: "workspaceId",
      ledgers: "id, workspaceId",
      payments: "id, workspaceId, ledgerId",
      mutations: "++localId, workspaceId, idempotencyKey",
      syncMeta: "workspaceId",
      exchangeRates: "base",
      calcCache: "key",
    });
    this.version(3).stores({
      expenses: "id, workspaceId, [workspaceId+month+year], category",
      settings: "workspaceId",
      ledgers: "id, workspaceId",
      payments: "id, workspaceId, ledgerId",
      mutations: "++localId, workspaceId, idempotencyKey",
      syncMeta: "workspaceId",
      exchangeRates: "base",
      calcCache: "key",
      watcherHistory: "++id, savedAt",
      timeMachineScenarios: "id, savedAt",
    });
    // v4: persistent retry metadata on the mutation queue so it survives
    // tab close, network loss, and re-auth (Sprint 2.2 / T-2.2.1).
    // Adds nextRetryAt as an index so we can query the drain-eligible slice
    // in constant time; attempts + lastError are stored inline.
    this.version(4)
      .stores({
        expenses: "id, workspaceId, [workspaceId+month+year], category",
        settings: "workspaceId",
        ledgers: "id, workspaceId",
        payments: "id, workspaceId, ledgerId",
        mutations: "++localId, workspaceId, idempotencyKey, nextRetryAt, [workspaceId+nextRetryAt]",
        syncMeta: "workspaceId",
        exchangeRates: "base",
        calcCache: "key",
        watcherHistory: "++id, savedAt",
        timeMachineScenarios: "id, savedAt",
      })
      .upgrade(async (tx) => {
        // Populate defaults on pre-existing rows so the drain loop can rely
        // on the fields being present (Dexie leaves them undefined otherwise).
        await tx.table("mutations").toCollection().modify((m: Record<string, unknown>) => {
          if (typeof m.attempts !== "number") m.attempts = 0;
          if (typeof m.nextRetryAt !== "number") m.nextRetryAt = 0;
          if (typeof m.lastError === "undefined") m.lastError = null;
        });
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
          attempts: 0,
          nextRetryAt: 0,
          lastError: null,
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
