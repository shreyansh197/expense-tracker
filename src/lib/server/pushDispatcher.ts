/**
 * Push Dispatcher — server-scheduled Web Push with retry + dead-letter.
 *
 * Sprint 3.1 (M3). Powers the per-minute `/api/push/send` cron. Every
 * scheduled notification is materialised as a `push_deliveries` row and driven
 * through a deterministic lifecycle:
 *
 *   pending ──send ok──▶ sent
 *      │
 *      └──transient fail──▶ failed (retry after backoff) ──exhausted──▶ dead
 *
 * Backoff schedule (T-3.1.3): 30s → 5min → 30min → dead, each delay perturbed
 * by ±20% jitter to avoid thundering-herd retries. A delivery is dead once it
 * has failed `PUSH_MAX_ATTEMPTS` (4) times.
 *
 * Stale endpoints (HTTP 404/410 from the push service, T-3.1.5) are pruned
 * from `push_subscriptions` — cascading their deliveries — and recorded via an
 * audit entry. No PII or monetary values are ever logged: only status codes
 * and short failure messages land in `last_error`.
 *
 * Quiet hours (T-3.2.3, Sprint 3.2): a due delivery whose recipient is inside
 * their configured quiet-hours window (evaluated in the window's own IANA
 * timezone, including overnight-wrap windows like 22:00–07:00) is held —
 * rescheduled to the exact moment the window ends — without consuming a
 * retry attempt. This is the single place quiet-hours timezone math happens.
 */
import webpush from "web-push";
import { prisma } from "./prisma";
import { audit } from "./audit";

// ── Backoff configuration ──────────────────────────────────────────────────

/** Delay (ms) before each retry: attempt 1→30s, 2→5min, 3→30min. */
export const PUSH_BACKOFF_SCHEDULE_MS = [30_000, 5 * 60_000, 30 * 60_000] as const;

/** Total delivery attempts before a delivery is dead-lettered (schedule + 1). */
export const PUSH_MAX_ATTEMPTS = PUSH_BACKOFF_SCHEDULE_MS.length + 1;

/** Jitter magnitude applied to each backoff delay (±20%). */
export const PUSH_JITTER_RATIO = 0.2;

/** Max deliveries processed per dispatch tick — bounds a single cron run. */
export const PUSH_DISPATCH_LIMIT = 500;

export type PushDeliveryStatus = "pending" | "sent" | "failed" | "dead";

/**
 * Apply symmetric ±`PUSH_JITTER_RATIO` jitter to a base delay.
 * Result is clamped to `[baseMs * (1 - ratio), baseMs * (1 + ratio)]` and never
 * negative. `rng` is injectable for deterministic tests.
 */
export function jitteredDelay(baseMs: number, rng: () => number = Math.random): number {
  const spread = baseMs * PUSH_JITTER_RATIO;
  const offset = (rng() * 2 - 1) * spread; // rng∈[0,1) → offset∈[-spread, +spread)
  return Math.max(0, Math.round(baseMs + offset));
}

/**
 * Delay (ms) before the next attempt given the number of attempts already made,
 * or `null` when the delivery has exhausted its budget and must be dead-lettered.
 *
 * @param attempts Attempts already performed (1 = first attempt just failed).
 */
export function nextBackoffMs(attempts: number, rng: () => number = Math.random): number | null {
  if (attempts >= PUSH_MAX_ATTEMPTS) return null;
  const base = PUSH_BACKOFF_SCHEDULE_MS[attempts - 1];
  if (base === undefined) return null;
  return jitteredDelay(base, rng);
}

// ── Quiet hours (T-3.2.3) ────────────────────────────────────────────────
//
// Resolved from the free-form `notification_prefs` JSONB blob so the
// dispatcher stays the single place that understands quiet-hours timezone
// math — no scattered per-caller conversions. Handles both same-day windows
// ("09:00"–"17:00") and windows that cross midnight ("22:00"–"07:00").

/** A resolved, valid quiet-hours window ready for time-of-day comparison. */
export interface QuietHoursWindow {
  /** Minutes since local midnight, 0–1439. */
  startMinutes: number;
  /** Minutes since local midnight, 0–1439. May be < startMinutes (overnight wrap). */
  endMinutes: number;
  /** IANA timezone the window is evaluated in. */
  timezone: string;
}

/** Parse "HH:MM" → minutes since midnight, or `null` if malformed. */
export function parseHHMMToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Resolve a validated quiet-hours window from a workspace's raw
 * `notificationPrefs` JSON blob, or `null` if quiet hours are disabled/unset
 * or malformed (fail open — never block delivery on bad data).
 */
export function resolveQuietHoursWindow(notificationPrefs: unknown): QuietHoursWindow | null {
  if (!notificationPrefs || typeof notificationPrefs !== "object") return null;
  const prefs = notificationPrefs as Record<string, unknown>;
  if (prefs.quietHoursEnabled !== true) return null;

  const startMinutes = parseHHMMToMinutes(prefs.quietHoursStart);
  const endMinutes = parseHHMMToMinutes(prefs.quietHoursEnd);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return null;

  const timezone =
    (typeof prefs.quietHoursTimezone === "string" && prefs.quietHoursTimezone) ||
    (typeof prefs.timezone === "string" && prefs.timezone) ||
    "UTC";

  return { startMinutes, endMinutes, timezone };
}

/** Minutes since local midnight for `date` in IANA timezone `tz`. */
function getLocalMinutesOfDay(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")!.value) % 24; // "24:00" edge case → 0
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  return hour * 60 + minute;
}

/** The Y/M/D calendar date `date` falls on in IANA timezone `tz`. */
function getLocalCalendarDate(date: Date, tz: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** UTC offset (minutes, e.g. +330 for IST) timezone `tz` observes at `instant`. */
function getTzOffsetMinutes(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  // `wallClockAsUtc` reinterprets the tz's displayed wall-clock time as if it
  // were UTC; the gap to the real UTC instant is the timezone's offset.
  const wallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((wallClockAsUtc - instant.getTime()) / 60_000);
}

/**
 * Is `now` inside the quiet-hours window, evaluated in the window's timezone?
 * Handles overnight wrap (`startMinutes > endMinutes`) by treating the window
 * as "quiet from start through midnight, then midnight through end".
 * The end boundary is exclusive so a delivery exactly at `quietHoursEnd` is
 * allowed to send immediately rather than waiting another full cycle.
 */
export function isQuietHoursActive(window: QuietHoursWindow, now: Date): boolean {
  const { startMinutes, endMinutes, timezone } = window;
  const current = getLocalMinutesOfDay(now, timezone);
  if (startMinutes < endMinutes) {
    return current >= startMinutes && current < endMinutes; // same-day window
  }
  return current >= startMinutes || current < endMinutes; // overnight wrap
}

/**
 * The next UTC instant at which the local clock in `tz` reads `targetMinutes`
 * (today if that time hasn't yet occurred locally, otherwise tomorrow).
 * Used to reschedule a held delivery for exactly the quiet-hours end.
 */
export function nextLocalClockTimeUtc(now: Date, tz: string, targetMinutes: number): Date {
  const { year, month, day } = getLocalCalendarDate(now, tz);
  const currentMinutes = getLocalMinutesOfDay(now, tz);
  const dayOffset = targetMinutes <= currentMinutes ? 1 : 0;

  const targetHour = Math.floor(targetMinutes / 60);
  const targetMinute = targetMinutes % 60;

  // First guess: treat the target wall-clock time as if it were already UTC,
  // then correct by the timezone's actual offset at that instant. A single
  // correction pass is exact except within seconds of a DST transition.
  const guessUtc = new Date(Date.UTC(year, month - 1, day + dayOffset, targetHour, targetMinute, 0));
  const offsetMinutes = getTzOffsetMinutes(guessUtc, tz);
  return new Date(guessUtc.getTime() - offsetMinutes * 60_000);
}

// ── Delivery / send plumbing ───────────────────────────────────────────────

export interface WebPushKeys {
  p256dh: string;
  auth: string;
}

export interface WebPushTarget {
  endpoint: string;
  keys: WebPushKeys;
}

/** Injectable sender so tests can drive success/failure without the network. */
export type PushSender = (target: WebPushTarget, payload: string) => Promise<unknown>;

/** Minimal Prisma surface the dispatcher relies on (keeps tests hermetic). */
export interface PushDispatcherDb {
  pushDelivery: {
    createMany: (args: { data: unknown[] }) => Promise<unknown>;
    findMany: (args: unknown) => Promise<PushDeliveryRow[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
  };
  pushSubscription: {
    findMany: (args: unknown) => Promise<PushSubscriptionRow[]>;
    deleteMany: (args: { where: { id: string } }) => Promise<unknown>;
  };
  /**
   * Optional quiet-hours lookup (T-3.2.3). Omitted in older/hermetic test
   * doubles that don't exercise quiet hours — dispatch simply skips the
   * gating step in that case, preserving prior behaviour exactly.
   */
  workspaceSettings?: {
    findMany: (args: unknown) => Promise<WorkspaceSettingsRow[]>;
  };
}

export interface PushDeliveryRow {
  id: string;
  subscriptionId: string;
  attempts: number;
  payload: string;
}

export interface PushSubscriptionRow {
  id: string;
  userId: string;
  workspaceId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Row shape for the quiet-hours lookup — only what dispatch needs, no PII. */
export interface WorkspaceSettingsRow {
  workspaceId: string;
  notificationPrefs: unknown;
}

export interface EnqueueItem {
  subscriptionId: string;
  payload: string;
  scheduledFor?: Date;
}

export interface DispatchResult {
  sent: number;
  failed: number;
  dead: number;
}

const defaultSender: PushSender = (target, payload) =>
  webpush.sendNotification(
    { endpoint: target.endpoint, keys: target.keys },
    payload,
    { TTL: 3600 },
  );

function statusCodeOf(err: unknown): number | undefined {
  return (err as { statusCode?: number } | null)?.statusCode;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 500);
  return String(err).slice(0, 500);
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Materialise scheduled notifications as `pending` delivery rows due `now`
 * (or at `scheduledFor`). Returns the number of rows enqueued.
 */
export async function enqueueDeliveries(
  items: EnqueueItem[],
  db: PushDispatcherDb = prisma as unknown as PushDispatcherDb,
  now: Date = new Date(),
): Promise<number> {
  if (items.length === 0) return 0;
  await db.pushDelivery.createMany({
    data: items.map((item) => ({
      subscriptionId: item.subscriptionId,
      payload: item.payload,
      scheduledFor: item.scheduledFor ?? now,
      status: "pending",
      attempts: 0,
    })),
  });
  return items.length;
}

/**
 * Remove a stale push subscription (its deliveries cascade) and record an
 * audit entry. Never throws on the audit path so a dispatch tick always
 * completes.
 */
export async function pruneStaleSubscription(
  sub: PushSubscriptionRow,
  reason: string,
  db: PushDispatcherDb = prisma as unknown as PushDispatcherDb,
): Promise<void> {
  await db.pushSubscription.deleteMany({ where: { id: sub.id } });
  try {
    await audit({
      userId: sub.userId,
      entityType: "push_subscription",
      entityId: sub.id,
      action: "push.subscription_pruned",
      meta: { workspaceId: sub.workspaceId, reason },
    });
  } catch {
    // Audit is best-effort; a logging failure must not abort delivery.
  }
}

/**
 * Send every delivery that is due (`pending`/`failed` with `scheduledFor <= now`)
 * and advance each row's lifecycle. Returns per-batch counters.
 */
export async function dispatchDueDeliveries(
  options: {
    db?: PushDispatcherDb;
    send?: PushSender;
    now?: Date;
    rng?: () => number;
    limit?: number;
  } = {},
): Promise<DispatchResult> {
  const db = options.db ?? (prisma as unknown as PushDispatcherDb);
  const send = options.send ?? defaultSender;
  const now = options.now ?? new Date();
  const rng = options.rng ?? Math.random;
  const limit = options.limit ?? PUSH_DISPATCH_LIMIT;

  const due = await db.pushDelivery.findMany({
    where: { status: { in: ["pending", "failed"] }, scheduledFor: { lte: now } },
    orderBy: { scheduledFor: "asc" },
    take: limit,
  });

  const result: DispatchResult = { sent: 0, failed: 0, dead: 0 };
  if (due.length === 0) return result;

  const subIds = [...new Set(due.map((d) => d.subscriptionId))];
  const subs = await db.pushSubscription.findMany({ where: { id: { in: subIds } } });
  const subById = new Map(subs.map((s) => [s.id, s]));
  const staleSubs = new Map<string, { sub: PushSubscriptionRow; reason: string }>();

  // Quiet hours (T-3.2.3): resolve each involved workspace's window once per
  // tick. Absent `workspaceSettings` (older/hermetic test doubles) simply
  // disables the gate — dispatch behaves exactly as it did in Sprint 3.1.
  const quietWindowByWorkspace = new Map<string, QuietHoursWindow>();
  if (db.workspaceSettings) {
    const workspaceIds = [...new Set(subs.map((s) => s.workspaceId))];
    if (workspaceIds.length > 0) {
      const settingsRows = await db.workspaceSettings.findMany({ where: { workspaceId: { in: workspaceIds } } });
      for (const row of settingsRows) {
        const window = resolveQuietHoursWindow(row.notificationPrefs);
        if (window) quietWindowByWorkspace.set(row.workspaceId, window);
      }
    }
  }

  for (const delivery of due) {
    const sub = subById.get(delivery.subscriptionId);
    if (!sub) {
      await db.pushDelivery.update({
        where: { id: delivery.id },
        data: { status: "dead", attempts: delivery.attempts + 1, lastError: "subscription_removed" },
      });
      result.dead++;
      continue;
    }

    // Never send inside the recipient's quiet hours — hold the delivery and
    // reschedule it for the exact moment the window ends, without spending
    // one of its retry attempts.
    const quietWindow = quietWindowByWorkspace.get(sub.workspaceId);
    if (quietWindow && isQuietHoursActive(quietWindow, now)) {
      const nextSlot = nextLocalClockTimeUtc(now, quietWindow.timezone, quietWindow.endMinutes);
      await db.pushDelivery.update({
        where: { id: delivery.id },
        data: { scheduledFor: nextSlot },
      });
      continue;
    }

    const attempts = delivery.attempts + 1;
    try {
      await send({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, delivery.payload);
      await db.pushDelivery.update({
        where: { id: delivery.id },
        data: { status: "sent", attempts, lastError: null },
      });
      result.sent++;
    } catch (err) {
      const code = statusCodeOf(err);
      if (code === 404 || code === 410) {
        // Stale endpoint: dead-letter this delivery and schedule a prune.
        staleSubs.set(sub.id, { sub, reason: `stale_endpoint_${code}` });
        await db.pushDelivery.update({
          where: { id: delivery.id },
          data: { status: "dead", attempts, lastError: `stale:${code}` },
        });
        result.dead++;
        continue;
      }

      const backoff = nextBackoffMs(attempts, rng);
      if (backoff === null) {
        await db.pushDelivery.update({
          where: { id: delivery.id },
          data: { status: "dead", attempts, lastError: errorMessage(err) },
        });
        result.dead++;
      } else {
        await db.pushDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "failed",
            attempts,
            lastError: errorMessage(err),
            scheduledFor: new Date(now.getTime() + backoff),
          },
        });
        result.failed++;
      }
    }
  }

  for (const { sub, reason } of staleSubs.values()) {
    await pruneStaleSubscription(sub, reason, db);
  }

  return result;
}
