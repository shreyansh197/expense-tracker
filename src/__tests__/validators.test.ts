/// <reference types="jest" />
import {
  registerSchema,
  loginSchema,
  totpVerifySchema,
  refreshSchema,
  magicLinkRequestSchema,
  createWorkspaceSchema,
  createInviteSchema,
  acceptInviteSchema,
  acceptDeviceLinkSchema,
  syncChangesSchema,
  syncCommitSchema,
  updateSettingsSchema,
} from "../lib/validators";

// =========== registerSchema ===========

describe("registerSchema", () => {
  test("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass",
    });
    expect(result.success).toBe(true);
  });

  test("accepts registration with optional name", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass",
      name: "John Doe",
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "securepass",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty email", () => {
    const result = registerSchema.safeParse({ email: "", password: "securepass" });
    expect(result.success).toBe(false);
  });

  test("rejects short password (< 8 chars)", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  test("rejects password > 128 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(129),
    });
    expect(result.success).toBe(false);
  });

  test("accepts password exactly 8 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "12345678",
    });
    expect(result.success).toBe(true);
  });

  test("accepts password exactly 72 chars (bcrypt limit)", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(72),
    });
    expect(result.success).toBe(true);
  });

  test("rejects password > 72 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "a".repeat(73),
    });
    expect(result.success).toBe(false);
  });

  test("rejects email > 255 chars", () => {
    const result = registerSchema.safeParse({
      email: "a".repeat(250) + "@b.com",
      password: "securepass",
    });
    expect(result.success).toBe(false);
  });

  test("rejects name > 120 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass",
      name: "a".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  test("accepts name exactly 120 chars", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass",
      name: "a".repeat(120),
    });
    expect(result.success).toBe(true);
  });
});

// =========== loginSchema ===========

describe("loginSchema", () => {
  test("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "anypassword" });
    expect(result.success).toBe(false);
  });

  test("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });

  test("login does not require min 8 chars password (unlike register)", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "x",
    });
    expect(result.success).toBe(true);
  });
});

// =========== totpVerifySchema ===========

describe("totpVerifySchema", () => {
  test("accepts valid 6-digit code", () => {
    expect(totpVerifySchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  test("rejects non-numeric code", () => {
    expect(totpVerifySchema.safeParse({ code: "abcdef" }).success).toBe(false);
  });

  test("rejects 5-digit code", () => {
    expect(totpVerifySchema.safeParse({ code: "12345" }).success).toBe(false);
  });

  test("rejects 7-digit code", () => {
    expect(totpVerifySchema.safeParse({ code: "1234567" }).success).toBe(false);
  });

  test("rejects empty string", () => {
    expect(totpVerifySchema.safeParse({ code: "" }).success).toBe(false);
  });

  test("rejects code with spaces", () => {
    expect(totpVerifySchema.safeParse({ code: "12 456" }).success).toBe(false);
  });
});

// =========== refreshSchema ===========

describe("refreshSchema", () => {
  test("accepts non-empty refresh token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "some-token" }).success).toBe(true);
  });

  test("rejects empty refresh token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
  });

  test("rejects missing refreshToken", () => {
    expect(refreshSchema.safeParse({}).success).toBe(false);
  });
});

// =========== magicLinkRequestSchema ===========

describe("magicLinkRequestSchema", () => {
  test("accepts valid email", () => {
    expect(magicLinkRequestSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  test("rejects invalid email", () => {
    expect(magicLinkRequestSchema.safeParse({ email: "bad" }).success).toBe(false);
  });

  test("rejects email > 255 chars", () => {
    const result = magicLinkRequestSchema.safeParse({ email: "a".repeat(250) + "@b.com" });
    expect(result.success).toBe(false);
  });
});

// =========== createWorkspaceSchema ===========

describe("createWorkspaceSchema", () => {
  test("accepts valid workspace name", () => {
    expect(createWorkspaceSchema.safeParse({ name: "My Workspace" }).success).toBe(true);
  });

  test("rejects empty name", () => {
    expect(createWorkspaceSchema.safeParse({ name: "" }).success).toBe(false);
  });

  test("rejects name > 120 chars", () => {
    expect(createWorkspaceSchema.safeParse({ name: "a".repeat(121) }).success).toBe(false);
  });

  test("accepts single character name", () => {
    expect(createWorkspaceSchema.safeParse({ name: "X" }).success).toBe(true);
  });
});

// =========== createInviteSchema ===========

describe("createInviteSchema", () => {
  test("accepts ADMIN role", () => {
    const result = createInviteSchema.safeParse({ role: "ADMIN" });
    expect(result.success).toBe(true);
  });

  test("accepts MEMBER role", () => {
    const result = createInviteSchema.safeParse({ role: "MEMBER" });
    expect(result.success).toBe(true);
  });

  test("defaults role to MEMBER", () => {
    const result = createInviteSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe("MEMBER");
  });

  test("defaults expiresInMinutes to 1440", () => {
    const result = createInviteSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.expiresInMinutes).toBe(1440);
  });

  test("rejects invalid role", () => {
    expect(createInviteSchema.safeParse({ role: "SUPERADMIN" }).success).toBe(false);
  });

  test("rejects expiresInMinutes < 15", () => {
    expect(createInviteSchema.safeParse({ expiresInMinutes: 10 }).success).toBe(false);
  });

  test("rejects expiresInMinutes > 10080", () => {
    expect(createInviteSchema.safeParse({ expiresInMinutes: 20000 }).success).toBe(false);
  });

  test("accepts expiresInMinutes at boundaries", () => {
    expect(createInviteSchema.safeParse({ expiresInMinutes: 15 }).success).toBe(true);
    expect(createInviteSchema.safeParse({ expiresInMinutes: 10080 }).success).toBe(true);
  });

  test("rejects non-integer expiresInMinutes", () => {
    expect(createInviteSchema.safeParse({ expiresInMinutes: 100.5 }).success).toBe(false);
  });
});

// =========== acceptInviteSchema ===========

describe("acceptInviteSchema", () => {
  test("accepts non-empty token", () => {
    expect(acceptInviteSchema.safeParse({ token: "abc123" }).success).toBe(true);
  });

  test("rejects empty token", () => {
    expect(acceptInviteSchema.safeParse({ token: "" }).success).toBe(false);
  });
});

// =========== acceptDeviceLinkSchema ===========

describe("acceptDeviceLinkSchema", () => {
  test("accepts non-empty token", () => {
    expect(acceptDeviceLinkSchema.safeParse({ token: "xyz" }).success).toBe(true);
  });

  test("rejects empty token", () => {
    expect(acceptDeviceLinkSchema.safeParse({ token: "" }).success).toBe(false);
  });
});

// =========== syncChangesSchema ===========

describe("syncChangesSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";

  test("accepts valid sync changes request", () => {
    const result = syncChangesSchema.safeParse({ workspaceId: validUuid });
    expect(result.success).toBe(true);
  });

  test("accepts with optional since datetime", () => {
    const result = syncChangesSchema.safeParse({
      workspaceId: validUuid,
      since: "2026-03-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  test("accepts valid tables filter", () => {
    const result = syncChangesSchema.safeParse({
      workspaceId: validUuid,
      tables: ["expenses", "workspace_settings"],
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid table name", () => {
    const result = syncChangesSchema.safeParse({
      workspaceId: validUuid,
      tables: ["invalid_table"],
    });
    expect(result.success).toBe(false);
  });

  test("rejects non-UUID workspaceId", () => {
    expect(syncChangesSchema.safeParse({ workspaceId: "bad-id" }).success).toBe(false);
  });

  test("rejects invalid since format", () => {
    const result = syncChangesSchema.safeParse({
      workspaceId: validUuid,
      since: "not-a-date",
    });
    expect(result.success).toBe(false);
  });
});

// =========== syncCommitSchema ===========

describe("syncCommitSchema", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const validMutation = {
    table: "expenses" as const,
    operation: "upsert" as const,
    data: { amount: 100 },
    idempotencyKey: "key-1",
  };

  test("accepts valid sync commit", () => {
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations: [validMutation],
    });
    expect(result.success).toBe(true);
  });

  test("rejects empty mutations array", () => {
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations: [],
    });
    expect(result.success).toBe(false);
  });

  test("rejects mutations array > 100 items", () => {
    const mutations = Array.from({ length: 101 }, (_, i) => ({
      ...validMutation,
      idempotencyKey: `key-${i}`,
    }));
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations,
    });
    expect(result.success).toBe(false);
  });

  test("accepts exactly 100 mutations", () => {
    const mutations = Array.from({ length: 100 }, (_, i) => ({
      ...validMutation,
      idempotencyKey: `key-${i}`,
    }));
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations,
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid table in mutation", () => {
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations: [{ ...validMutation, table: "users" }],
    });
    expect(result.success).toBe(false);
  });

  test("rejects invalid operation in mutation", () => {
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations: [{ ...validMutation, operation: "drop" }],
    });
    expect(result.success).toBe(false);
  });

  test("accepts delete operation", () => {
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations: [{ ...validMutation, operation: "delete" }],
    });
    expect(result.success).toBe(true);
  });

  test("accepts all valid table types", () => {
    const tables = ["expenses", "workspace_settings", "business_ledgers", "business_payments"] as const;
    for (const table of tables) {
      const result = syncCommitSchema.safeParse({
        workspaceId: validUuid,
        mutations: [{ ...validMutation, table }],
      });
      expect(result.success).toBe(true);
    }
  });

  test("rejects idempotencyKey > 64 chars", () => {
    const result = syncCommitSchema.safeParse({
      workspaceId: validUuid,
      mutations: [{ ...validMutation, idempotencyKey: "a".repeat(65) }],
    });
    expect(result.success).toBe(false);
  });
});

// =========== updateSettingsSchema ===========

describe("updateSettingsSchema", () => {
  test("accepts empty object (all fields optional)", () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(true);
  });

  test("accepts valid salary", () => {
    expect(updateSettingsSchema.safeParse({ salary: 50000 }).success).toBe(true);
  });

  test("accepts salary of 0", () => {
    expect(updateSettingsSchema.safeParse({ salary: 0 }).success).toBe(true);
  });

  test("rejects negative salary", () => {
    expect(updateSettingsSchema.safeParse({ salary: -1 }).success).toBe(false);
  });

  test("accepts valid 3-char currency code", () => {
    expect(updateSettingsSchema.safeParse({ currency: "INR" }).success).toBe(true);
    expect(updateSettingsSchema.safeParse({ currency: "USD" }).success).toBe(true);
  });

  test("rejects 2-char currency code", () => {
    expect(updateSettingsSchema.safeParse({ currency: "US" }).success).toBe(false);
  });

  test("rejects 4-char currency code", () => {
    expect(updateSettingsSchema.safeParse({ currency: "USDD" }).success).toBe(false);
  });

  test("accepts boolean rolloverEnabled", () => {
    expect(updateSettingsSchema.safeParse({ rolloverEnabled: true }).success).toBe(true);
    expect(updateSettingsSchema.safeParse({ rolloverEnabled: false }).success).toBe(true);
  });

  test("accepts boolean businessMode", () => {
    expect(updateSettingsSchema.safeParse({ businessMode: true }).success).toBe(true);
  });

  test("accepts categories array", () => {
    expect(updateSettingsSchema.safeParse({ categories: ["groceries", "transport"] }).success).toBe(true);
  });

  test("accepts categoryBudgets record", () => {
    const result = updateSettingsSchema.safeParse({
      categoryBudgets: { groceries: 5000, transport: 2000 },
    });
    expect(result.success).toBe(true);
  });

  test("accepts rolloverHistory record", () => {
    const result = updateSettingsSchema.safeParse({
      rolloverHistory: { "2026-01": 5000, "2026-02": 3000 },
    });
    expect(result.success).toBe(true);
  });

  test("accepts multiple fields at once", () => {
    const result = updateSettingsSchema.safeParse({
      salary: 60000,
      currency: "EUR",
      categories: ["groceries"],
      rolloverEnabled: true,
      businessMode: false,
    });
    expect(result.success).toBe(true);
  });
});
