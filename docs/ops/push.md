# Push Notification Scheduler — Operations Runbook

Sprint 3.1 (Epic M3), extended in Sprint 3.2 with quiet hours and an ops
health endpoint. This runbook covers the server-scheduled push pipeline: the
per-minute cron, retry/dead-letter behaviour, quiet-hours gating, and
stale-subscription hygiene.

## Overview

```
cron (every minute)
      │  POST /api/push/send   (Authorization: Bearer <CRON_SECRET>)
      ▼
route.ts ──► compute due notifications (per user local time)
         └─► enqueueDeliveries()  → push_deliveries rows (status=pending)
         └─► dispatchDueDeliveries()
                   ├─ inside quiet hours → held, scheduled_for = window end (no attempt spent)
                   ├─ send ok            → status=sent
                   ├─ transient failure  → status=failed, retry after backoff
                   ├─ budget exhausted    → status=dead
                   └─ 404 / 410 endpoint → status=dead + prune subscription
```

Every scheduled notification is materialised as a row in `push_deliveries`, so
each push has an observable lifecycle. The endpoint returns per-batch counters:

```json
{ "sent": 12, "failed": 1, "dead": 0, "enqueued": 13, "time": "21:00" }
```

## Cron entry

Delivery is driven by a scheduler that hits `/api/push/send` **every minute**.

- **Vercel:** configured in [`vercel.json`](../../vercel.json):

  ```json
  { "crons": [{ "path": "/api/push/send", "schedule": "* * * * *" }] }
  ```

  Vercel Cron automatically attaches `Authorization: Bearer <CRON_SECRET>` when
  the `CRON_SECRET` environment variable is set.

- **External scheduler (cron-job.org / Node):** issue a `POST` every minute with
  one of the accepted secret carriers:
  - `Authorization: Bearer <CRON_SECRET>` (preferred), or
  - `X-Cron-Secret: <CRON_SECRET>`, or
  - `?secret=<CRON_SECRET>` query parameter.

  Optional replay hardening: send `X-Cron-Timestamp` (Unix seconds; rejected if
  older than 5 minutes) and, when `CRON_SECRET_HMAC` is set, an
  `X-Cron-Signature` HMAC-SHA256 of the timestamp.

The route is whitelisted in [`src/middleware.ts`](../../src/middleware.ts) so the
secret-bearing request bypasses the `Authorization: Bearer <JWT>` gate that
protects other API routes.

### Required environment

| Variable            | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `CRON_SECRET`       | Shared secret gating `/api/push/send`.             |
| `VAPID_PUBLIC_KEY`  | Web Push VAPID public key.                          |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key.                          |
| `VAPID_EMAIL`       | `mailto:` contact for the push service (optional). |
| `CRON_SECRET_HMAC`  | Optional HMAC key for signed cron requests.        |

## Retry & dead-letter

Implemented in [`src/lib/server/pushDispatcher.ts`](../../src/lib/server/pushDispatcher.ts).

- **Backoff schedule:** `30s → 5min → 30min → dead`, each delay perturbed by
  **±20% jitter** to avoid thundering-herd retries.
- **Attempt budget:** a delivery is dead-lettered after **4 attempts**
  (`PUSH_MAX_ATTEMPTS`).
- Due rows (`status IN (pending, failed)` and `scheduled_for <= now`) are picked
  up on each tick, so retries ride the same per-minute cron.

## Stale-subscription hygiene

When the push service returns `404 Not Found` or `410 Gone`, the offending
`push_subscriptions` row is deleted (its deliveries cascade) and a
`push.subscription_pruned` audit entry is written. This keeps delivery metrics
honest and prevents wasted sends to dead endpoints.

## Thresholds & alerting

Inspect delivery health directly from `push_deliveries`:

```sql
-- Last-24h status breakdown
SELECT status, count(*) FROM push_deliveries
WHERE created_at > now() - interval '24 hours'
GROUP BY status;

-- Endpoints repeatedly failing / dead-lettered
SELECT subscription_id, attempts, last_error
FROM push_deliveries
WHERE status = 'dead' AND updated_at > now() - interval '24 hours'
ORDER BY updated_at DESC;
```

Suggested alert thresholds:

- **Dead-letter rate > 5%** of enqueued deliveries over 1 hour → investigate the
  push service / VAPID configuration.
- **No `sent` rows for > 10 minutes** during active hours → verify the cron is
  firing and `CRON_SECRET` matches.
- **`deliveredRatio` (below) < 0.95** over the trailing 24h → the M3 exit
  criterion is a ≥ 95% delivery rate; investigate before it slips further.

## `/api/admin/push/health` (Sprint 3.2 / T-3.2.5)

`GET /api/admin/push/health` gives operators a machine-readable snapshot of
the last 24 hours without needing direct database access.

**Auth** — either of:

- The shared `CRON_SECRET`, via `Authorization: ****** `X-Cron-Secret`
  header, or `?secret=` query param (same carriers as `/api/push/send`) — lets
  an external uptime monitor poll it.
- A logged-in session (`Authorization: ****** whose user is an
  `OWNER`/`ADMIN` of their workspace.

Both paths are rate-limited (20 requests/minute per caller IP).

**Response:**

```json
{
  "windowHours": 24,
  "counts": { "pending": 3, "sent": 412, "failed": 5, "dead": 2 },
  "deliveredRatio": 0.983,
  "topFailingSubscriptions": [
    { "subscriptionId": "…", "attempts": 4, "lastError": "stale:410", "lastSeenAt": "…" }
  ],
  "generatedAt": "2026-09-28T12:00:00.000Z"
}
```

`deliveredRatio` is `sent / (sent + failed + dead)` over the window (`1` when
nothing has reached a terminal state yet). `topFailingSubscriptions` lists the
worst dead-lettered endpoints by attempt count — identified only by the opaque
`subscriptionId` UUID, never the raw push `endpoint` URL or any user-
identifying field, so the response is safe to paste into a chat channel.

## Quiet hours (Sprint 3.2 / T-3.2.3)

Users can configure a quiet-hours window (`quietHoursStart`/`quietHoursEnd`,
`HH:MM` local time, plus `quietHoursTimezone`) under Settings → Notifications.
`dispatchDueDeliveries` in
[`pushDispatcher.ts`](../../src/lib/server/pushDispatcher.ts) checks every due
delivery against its recipient's window, evaluated in the window's own IANA
timezone:

- **Same-day window** (`start < end`, e.g. `09:00`–`17:00`) — quiet while
  `start <= local time < end`.
- **Overnight window** (`start > end`, e.g. `22:00`–`07:00`) — quiet from
  `start` through midnight, then midnight through `end`.

A delivery due inside the window is **held**, not dropped: its `scheduled_for`
is moved to the exact UTC instant the window ends, and — critically — this
does **not** consume one of its 4 retry attempts. The same per-minute cron
picks it up again once quiet hours end.

## Privacy

`last_error` stores only status codes and short failure messages — never PII or
monetary values. Audit entries record the subscription id, workspace id, and a
prune reason.
