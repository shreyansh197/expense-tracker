-- ═══════════════════════════════════════════════════════════════
-- ExpenStream — Critical-Table Migration
-- PostgreSQL 15+  ·  Idempotent (IF NOT EXISTS everywhere)
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ──────────────────────────  EXTENSIONS  ──────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ──────────────────────────  ENUMS  ──────────────────────────
DO $$ BEGIN
  CREATE TYPE account_type AS ENUM (
    'CHECKING','SAVINGS','CREDIT_CARD','CASH','WALLET','INVESTMENT'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('EXPENSE','INCOME','TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('EXPENSE','INCOME','TRANSFER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('DAILY','WEEKLY','MONTHLY','YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM (
    'BUDGET_WARNING','BUDGET_EXCEEDED','GOAL_MILESTONE','GOAL_DEADLINE',
    'SUBSCRIPTION_RENEWAL','RECURRING_DUE','ANOMALY','SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE budget_period AS ENUM ('WEEKLY','MONTHLY','YEARLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════  USERS  ══════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255),
  name             VARCHAR(120) NOT NULL,
  avatar_url       TEXT,
  email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  default_currency VARCHAR(3)  NOT NULL DEFAULT 'INR',
  timezone         VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at  ON users (deleted_at);

COMMENT ON TABLE  users IS 'Core user identity. One row per registered person.';
COMMENT ON COLUMN users.deleted_at IS 'Soft-delete timestamp; NULL = active.';

-- ══════════════════════════  ACCOUNTS  ═══════════════════════
CREATE TABLE IF NOT EXISTS accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  VARCHAR(100) NOT NULL,
  type                  account_type NOT NULL DEFAULT 'CHECKING',
  balance               NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency              VARCHAR(3)  NOT NULL DEFAULT 'INR',
  institution           VARCHAR(120),
  account_number_last4  VARCHAR(4),
  is_default            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_deleted ON accounts (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_default ON accounts (user_id, is_default);

COMMENT ON TABLE accounts IS 'Financial account (bank, credit card, cash wallet).';

-- ══════════════════════════  CATEGORIES  ═════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  name       VARCHAR(60)   NOT NULL,
  slug       VARCHAR(60)   NOT NULL,
  color      VARCHAR(9)    NOT NULL DEFAULT '#6B7280',
  bg_color   VARCHAR(9),
  icon       VARCHAR(40)   NOT NULL DEFAULT 'Circle',
  type       category_type NOT NULL DEFAULT 'EXPENSE',
  sort_order INT           NOT NULL DEFAULT 0,
  is_system  BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_user_slug
  ON categories (user_id, slug);
CREATE INDEX IF NOT EXISTS idx_categories_user_type
  ON categories (user_id, type, deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_parent
  ON categories (parent_id);

COMMENT ON TABLE  categories IS 'Hierarchical categories. System rows have user_id = NULL and is_system = TRUE.';
COMMENT ON COLUMN categories.parent_id IS 'Self-ref for sub-categories (one level recommended).';

-- ══════════════════════════  TAGS  ═══════════════════════════
CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(40)  NOT NULL,
  color      VARCHAR(9)   NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_user_name ON tags (user_id, name);

-- ══════════════════════════  MERCHANTS  ══════════════════════
CREATE TABLE IF NOT EXISTS merchants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(120) NOT NULL,
  logo_url            TEXT,
  default_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_merchants_user_name ON merchants (user_id, name);

COMMENT ON TABLE merchants IS 'Payee/vendor for auto-categorisation.';

-- ══════════════════════════  TRANSACTIONS  ═══════════════════
-- This is the heaviest table. Indexes are critical for dashboard perf.
CREATE TABLE IF NOT EXISTS transactions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id             UUID REFERENCES accounts(id)   ON DELETE SET NULL,
  category_id            UUID REFERENCES categories(id)  ON DELETE SET NULL,
  merchant_id            UUID REFERENCES merchants(id)   ON DELETE SET NULL,
  recurring_schedule_id  UUID REFERENCES recurring_schedules(id) ON DELETE SET NULL,
  type                   transaction_type NOT NULL DEFAULT 'EXPENSE',
  amount                 NUMERIC(14,2) NOT NULL,
  currency               VARCHAR(3)  NOT NULL DEFAULT 'INR',
  description            VARCHAR(255),
  notes                  TEXT,
  date                   DATE NOT NULL,
  is_recurring           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at             TIMESTAMPTZ
);

-- Primary query: user's monthly expenses, newest first
CREATE INDEX IF NOT EXISTS idx_txn_user_date
  ON transactions (user_id, date DESC, deleted_at);

-- Category drill-down (dashboard, category page)
CREATE INDEX IF NOT EXISTS idx_txn_user_cat_date
  ON transactions (user_id, category_id, date DESC);

-- Account register view
CREATE INDEX IF NOT EXISTS idx_txn_user_acct_date
  ON transactions (user_id, account_id, date DESC);

-- Merchant analytics
CREATE INDEX IF NOT EXISTS idx_txn_user_merchant
  ON transactions (user_id, merchant_id);

-- Recurring link
CREATE INDEX IF NOT EXISTS idx_txn_recurring
  ON transactions (recurring_schedule_id);

-- Partial index: only active rows (speeds WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_txn_user_active
  ON transactions (user_id, date DESC)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE  transactions IS 'Central ledger. Every spend, earning, or transfer.';
COMMENT ON COLUMN transactions.deleted_at IS 'Soft-delete; NULL = active.';
COMMENT ON COLUMN transactions.amount IS 'Always positive. `type` indicates direction.';

-- ══════════════════════════  TRANSACTION_TAGS (M:N)  ═════════
CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id         UUID NOT NULL REFERENCES tags(id)         ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_txntag_tag ON transaction_tags (tag_id);

-- ══════════════════════════  RULES  ══════════════════════════
CREATE TABLE IF NOT EXISTS rules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions    JSONB NOT NULL DEFAULT '{}',
  priority   INT   NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rules_user_active
  ON rules (user_id, is_active, priority);

COMMENT ON TABLE rules IS 'Auto-categorisation rules evaluated on create/import.';
COMMENT ON COLUMN rules.conditions IS 'JSON: {"merchant_contains":"Swiggy","amount_gt":100}';
COMMENT ON COLUMN rules.actions    IS 'JSON: {"set_category":"<uuid>","add_tags":["food"]}';

-- ══════════════════════════  RECURRING SCHEDULES  ════════════
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  account_id    UUID REFERENCES accounts(id)             ON DELETE SET NULL,
  category_id   UUID REFERENCES categories(id)           ON DELETE SET NULL,
  merchant_id   UUID REFERENCES merchants(id)            ON DELETE SET NULL,
  amount        NUMERIC(14,2) NOT NULL,
  currency      VARCHAR(3)  NOT NULL DEFAULT 'INR',
  description   VARCHAR(255),
  frequency     recurring_frequency NOT NULL DEFAULT 'MONTHLY',
  interval      INT NOT NULL DEFAULT 1,
  day_of_month  INT,          -- 1-28
  day_of_week   INT,          -- 0=Sun .. 6=Sat
  start_date    DATE NOT NULL,
  end_date      DATE,
  next_due_date DATE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_day_of_month CHECK (day_of_month IS NULL OR day_of_month BETWEEN 1 AND 28),
  CONSTRAINT chk_day_of_week  CHECK (day_of_week  IS NULL OR day_of_week  BETWEEN 0 AND 6),
  CONSTRAINT chk_interval     CHECK (interval >= 1)
);

CREATE INDEX IF NOT EXISTS idx_recurring_user_active
  ON recurring_schedules (user_id, is_active, next_due_date);

-- ══════════════════════════  SUBSCRIPTIONS  ══════════════════
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id)                ON DELETE CASCADE,
  recurring_schedule_id UUID NOT NULL REFERENCES recurring_schedules(id)  ON DELETE CASCADE,
  provider_name         VARCHAR(120) NOT NULL,
  plan_name             VARCHAR(120),
  billing_url           TEXT,
  trial_ends_at         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_user_active
  ON subscriptions (user_id, cancelled_at);

-- ══════════════════════════  GOALS  ══════════════════════════
CREATE TABLE IF NOT EXISTS goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  target_amount  NUMERIC(14,2) NOT NULL,
  current_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency       VARCHAR(3)  NOT NULL DEFAULT 'INR',
  target_date    DATE,
  icon           VARCHAR(40) NOT NULL DEFAULT 'Target',
  color          VARCHAR(9)  NOT NULL DEFAULT '#10B981',
  is_completed   BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,

  CONSTRAINT chk_target_positive CHECK (target_amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_goals_user_active
  ON goals (user_id, is_completed, deleted_at);

-- ══════════════════════════  STATEMENTS  ═════════════════════
CREATE TABLE IF NOT EXISTS statements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  account_id     UUID REFERENCES accounts(id)        ON DELETE SET NULL,
  file_name      VARCHAR(255) NOT NULL,
  file_url       TEXT NOT NULL,
  period_start   DATE NOT NULL,
  period_end     DATE NOT NULL,
  imported_count INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_statements_user_period
  ON statements (user_id, period_start);

-- ══════════════════════════  RECEIPTS  ═══════════════════════
CREATE TABLE IF NOT EXISTS receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id)          ON DELETE SET NULL,
  file_name      VARCHAR(255) NOT NULL,
  file_url       TEXT NOT NULL,
  file_size      INT NOT NULL,
  mime_type      VARCHAR(50) NOT NULL,
  ocr_data       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts (user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_txn  ON receipts (transaction_id);

-- ══════════════════════════  ALERTS  ═════════════════════════
CREATE TABLE IF NOT EXISTS alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       alert_type  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unread
  ON alerts (user_id, is_read, created_at DESC);

-- ══════════════════════════  BUDGETS  ════════════════════════
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id)          ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  period      budget_period NOT NULL DEFAULT 'MONTHLY',
  start_date  DATE NOT NULL,
  end_date    DATE,
  rollover    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_budget_positive CHECK (amount > 0)
);

-- One budget per user+category+period+start — prevents duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_user_cat_period
  ON budgets (user_id, category_id, period, start_date);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period
  ON budgets (user_id, period, start_date);

COMMENT ON TABLE  budgets IS 'Global (category_id IS NULL) or per-category spending limit.';
COMMENT ON COLUMN budgets.rollover IS 'If TRUE, unused budget carries forward to next period.';

-- ══════════════════════════  AUDIT LOGS  ═════════════════════
-- Append-only: no UPDATE or DELETE expected.
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  action      VARCHAR(20) NOT NULL,   -- CREATE, UPDATE, DELETE, RESTORE
  changes     JSONB,                  -- { "amount": { "old": 500, "new": 750 } }
  ip_address  VARCHAR(45),
  user_agent  VARCHAR(512),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user_time
  ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_logs (entity_type, entity_id);

COMMENT ON TABLE audit_logs IS 'Immutable append-only change log for compliance & debugging.';

-- ══════════════════════════  updated_at TRIGGER  ═════════════
-- Shared function: auto-update `updated_at` on any row change.
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to every table that has updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','accounts','categories','merchants','rules',
    'recurring_schedules','subscriptions','goals','budgets'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at
         BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
      t
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ══════════════════════════  SEED SYSTEM CATEGORIES  ═════════
INSERT INTO categories (user_id, name, slug, color, bg_color, icon, type, sort_order, is_system)
VALUES
  (NULL, 'Subscriptions',    'subscriptions',  '#8B5CF6', '#8B5CF620', 'Tv',               'EXPENSE', 1, TRUE),
  (NULL, 'Transport',        'transport',      '#3B82F6', '#3B82F620', 'Car',              'EXPENSE', 2, TRUE),
  (NULL, 'Groceries',        'groceries',      '#10B981', '#10B98120', 'ShoppingCart',     'EXPENSE', 3, TRUE),
  (NULL, 'Eat Out / Order',  'eat-out',        '#F97316', '#F9731620', 'UtensilsCrossed',  'EXPENSE', 4, TRUE),
  (NULL, 'Shopping',         'shopping',       '#EC4899', '#EC489920', 'ShoppingBag',      'EXPENSE', 5, TRUE),
  (NULL, 'Miscellaneous',    'miscellaneous',  '#6B7280', '#6B728020', 'MoreHorizontal',   'EXPENSE', 6, TRUE),
  (NULL, 'Credit Card',      'credit-card',    '#EF4444', '#EF444420', 'CreditCard',       'EXPENSE', 7, TRUE),
  (NULL, 'Internet',         'internet',       '#06B6D4', '#06B6D420', 'Wifi',             'EXPENSE', 8, TRUE),
  (NULL, 'SIP & NPS',        'sip-nps',        '#14B8A6', '#14B8A620', 'TrendingUp',       'EXPENSE', 9, TRUE),
  (NULL, 'Salary',           'salary',         '#22C55E', '#22C55E20', 'Banknote',         'INCOME',  1, TRUE),
  (NULL, 'Freelance',        'freelance',      '#A855F7', '#A855F720', 'Briefcase',        'INCOME',  2, TRUE),
  (NULL, 'Interest',         'interest',       '#0EA5E9', '#0EA5E920', 'Percent',          'INCOME',  3, TRUE)
ON CONFLICT DO NOTHING;

COMMIT;
