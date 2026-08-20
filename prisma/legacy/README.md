# prisma/legacy — Archived SQL (audit only)

This folder holds SQL files that predate the numbered [`prisma/migrations/`](../migrations) history and are **not** applied by `prisma migrate`. They are retained for provenance and audit continuity per [ADR-0001](../../docs/adr/0001-postgres-over-firestore.md) and [`docs/CHANGELOG.md` Sprint 1.2](../../docs/CHANGELOG.md).

## Rules

- **Do not** run these against a production or staging database. The authoritative history is [`prisma/migrations/001_initial_schema.sql`](../migrations/001_initial_schema.sql) → the latest numbered file.
- **Do not** copy statements from here into a new migration without re-verifying the current schema — many are superseded or partially applied.
- **Do not** delete files from this folder without an entry in [`docs/CHANGELOG.md`](../../docs/CHANGELOG.md) explaining what was removed and why.

## Contents

| File                               | Origin                                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `supabase-setup.sql`               | Bootstrap script used before Prisma migrations existed.                             |
| `supabase-migration.sql`           | Full-schema idempotent apply used during early Supabase development.                |
| `supabase-migration-workspace.sql` | Workspace scaffolding fragment (superseded by `001_initial_schema.sql`).            |
| `supabase-migration-business.sql`  | Business ledger tables fragment (superseded by `001_initial_schema.sql`).           |
| `supabase-migration-settings.sql`  | Workspace-settings columns fragment (superseded by `006_new_settings_columns.sql`). |
| `supabase-migration-goals.sql`     | Savings-goals fragment (superseded by `001_initial_schema.sql`).                    |
| `supabase-migration-device-id.sql` | Device client-id addition (superseded by `005_device_client_id.sql`).               |

## Verification

`prisma migrate status` against a fresh clone must remain clean after this move — see [PRODUCTION_CHECKLIST §2](../../docs/PRODUCTION_CHECKLIST.md).

**Last reviewed:** 2026-07-23
