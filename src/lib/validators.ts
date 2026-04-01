import { z } from "zod";

// ── Auth ─────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  name: z.string().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

export const totpVerifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

export const verify2FASchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().min(6).max(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export const profileUpdateSchema = z.object({
  name: z.string().max(120).optional(),
  avatarUrl: z.string().max(500_000).nullable().optional(),
});

export const passkeyLoginOptionsSchema = z.object({
  email: z.string().email().max(255).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Magic Link ───────────────────────────────────────────────

export const magicLinkRequestSchema = z.object({
  email: z.string().email().max(255),
});

// ── Workspace ────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
});

// ── Invite ───────────────────────────────────────────────────

export const createInviteSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
  expiresInMinutes: z.number().int().min(15).max(10080).default(1440), // 15min to 7 days
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

// ── Device Link ──────────────────────────────────────────────

export const acceptDeviceLinkSchema = z.object({
  token: z.string().min(1),
});

// ── Sync ─────────────────────────────────────────────────────

export const syncChangesSchema = z.object({
  workspaceId: z.string().uuid(),
  since: z.string().datetime().optional(),
  tables: z
    .array(z.enum(["expenses", "workspace_settings", "business_ledgers", "business_payments"]))
    .optional(),
});

// Per-table data schemas for sync mutations
const expenseMutationData = z.object({
  id: z.string().uuid().optional(),
  category: z.string().max(60).optional(),
  amount: z.number().optional(),
  currency: z.string().max(3).nullable().optional(),
  day: z.number().int().min(1).max(31).optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  remark: z.string().max(255).nullable().optional(),
  isRecurring: z.boolean().optional(),
  recurringId: z.string().max(64).nullable().optional(),
  deletedAt: z.string().nullable().optional(),
}).passthrough();

const settingsMutationData = z.object({
  salary: z.number().min(0).optional(),
  currency: z.string().max(3).optional(),
  categories: z.array(z.unknown()).optional(),
  customCategories: z.array(z.unknown()).optional(),
  hiddenDefaults: z.array(z.unknown()).optional(),
  categoryBudgets: z.record(z.string(), z.unknown()).optional(),
  recurringExpenses: z.array(z.unknown()).optional(),
  savedFilters: z.array(z.unknown()).optional(),
  goals: z.array(z.unknown()).optional(),
  rolloverEnabled: z.boolean().optional(),
  rolloverHistory: z.record(z.string(), z.unknown()).optional(),
  monthlyBudgets: z.record(z.string(), z.unknown()).optional(),
  businessMode: z.boolean().optional(),
  revenueExpectations: z.array(z.unknown()).optional(),
  businessTags: z.array(z.unknown()).optional(),
  multiCurrencyEnabled: z.boolean().optional(),
  dashboardLayout: z.unknown().optional(),
  dismissedRecurringSuggestions: z.array(z.unknown()).optional(),
  autoRules: z.array(z.unknown()).optional(),
}).passthrough();

const ledgerMutationData = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(255).optional(),
  expectedAmount: z.number().optional(),
  currency: z.string().max(3).optional(),
  status: z.string().max(20).optional(),
  dueDate: z.string().nullable().optional(),
  tags: z.array(z.unknown()).optional(),
  notes: z.string().max(2000).optional(),
  deletedAt: z.string().nullable().optional(),
}).passthrough();

const paymentMutationData = z.object({
  id: z.string().uuid().optional(),
  ledgerId: z.string().uuid().optional(),
  amount: z.number().optional(),
  date: z.string().optional(),
  method: z.string().max(60).nullable().optional(),
  reference: z.string().max(255).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  deletedAt: z.string().nullable().optional(),
}).passthrough();

const expenseMutation = z.object({
  table: z.literal("expenses"),
  operation: z.enum(["upsert", "delete"]),
  id: z.string().uuid().optional(),
  data: expenseMutationData,
  clientVersion: z.number().int().min(1).optional(),
  idempotencyKey: z.string().max(64),
});

const settingsMutation = z.object({
  table: z.literal("workspace_settings"),
  operation: z.enum(["upsert", "delete"]),
  id: z.string().uuid().optional(),
  data: settingsMutationData,
  clientVersion: z.number().int().min(1).optional(),
  idempotencyKey: z.string().max(64),
});

const ledgerMutation = z.object({
  table: z.literal("business_ledgers"),
  operation: z.enum(["upsert", "delete"]),
  id: z.string().uuid().optional(),
  data: ledgerMutationData,
  clientVersion: z.number().int().min(1).optional(),
  idempotencyKey: z.string().max(64),
});

const paymentMutation = z.object({
  table: z.literal("business_payments"),
  operation: z.enum(["upsert", "delete"]),
  id: z.string().uuid().optional(),
  data: paymentMutationData,
  clientVersion: z.number().int().min(1).optional(),
  idempotencyKey: z.string().max(64),
});

const mutationSchema = z.discriminatedUnion("table", [
  expenseMutation,
  settingsMutation,
  ledgerMutation,
  paymentMutation,
]);

export const syncCommitSchema = z.object({
  workspaceId: z.string().uuid(),
  mutations: z.array(mutationSchema).min(1).max(100),
});

// ── Settings update ──────────────────────────────────────────

export const updateSettingsSchema = z.object({
  salary: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  categories: z.array(z.string()).optional(),
  customCategories: z.array(z.unknown()).optional(),
  hiddenDefaults: z.array(z.string()).optional(),
  categoryBudgets: z.record(z.string(), z.number()).optional(),
  recurringExpenses: z.array(z.unknown()).optional(),
  savedFilters: z.array(z.unknown()).optional(),
  goals: z.array(z.unknown()).optional(),
  rolloverEnabled: z.boolean().optional(),
  rolloverHistory: z.record(z.string(), z.number()).optional(),
  businessMode: z.boolean().optional(),
  revenueExpectations: z.array(z.unknown()).optional(),
  businessTags: z.array(z.string()).optional(),
});
