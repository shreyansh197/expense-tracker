/**
 * Settings store — module-level singleton state shared across all useSettings consumers.
 * Extracted from useSettings.ts for separation of concerns.
 */
import { DEFAULT_SALARY } from "@/lib/constants";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { encryptJSON, decryptJSON, hasEncryptionKey } from "@/lib/crypto";
import type { UserSettings } from "@/types";

export const STORAGE_KEY_BASE = "expenstream-settings";

export function storageKeyForUser(userId: string | null): string {
  return userId ? `${STORAGE_KEY_BASE}-${userId}` : STORAGE_KEY_BASE;
}

export let _currentUserId: string | null = null;
export function setCurrentUserId(id: string | null) { _currentUserId = id; }

export const DEFAULT_SETTINGS: UserSettings = {
  salary: DEFAULT_SALARY,
  currency: "INR",
  categories: DEFAULT_CATEGORIES,
  customCategories: [],
  hiddenDefaults: [],
  categoryBudgets: {},
  recurringExpenses: [],
  savedFilters: [],
  goals: [],
  rolloverEnabled: false,
  rolloverHistory: {},
  monthlyBudgets: {},
  businessMode: false,
  revenueExpectations: [],
  businessTags: [],
  multiCurrencyEnabled: false,
  dismissedRecurringSuggestions: [],
  autoRules: [],
  createdAt: 0,
  updatedAt: 0,
};

/**
 * Merge two settings objects for conflict resolution.
 *
 * Scalar fields (salary, currency, etc.): whichever version has the higher
 * `updatedAt` wins (falls back to `remote` on a tie).
 * Collection fields (autoRules, recurringExpenses, etc.): only add items from
 * the OTHER side that are genuinely new (not present in the winner). Items
 * absent from the winner are treated as intentional deletions and are NOT
 * resurrected from the other side.
 */
export function mergeSettingsForConflict(
  local: UserSettings,
  remote: UserSettings,
): UserSettings {
  // Scalar winner: the side with the higher updatedAt; remote wins on tie
  const winner = local.updatedAt > remote.updatedAt ? local : remote;
  const other  = local.updatedAt > remote.updatedAt ? remote : local;

  // Only add items from `other` that do NOT appear in `winner` at all.
  // This preserves cross-device additions while respecting deletions made
  // on the winning device.
  const mergeById = <T extends { id: string }>(winnerArr: T[], otherArr: T[]): T[] => {
    const winnerIds = new Set(winnerArr.map(i => i.id));
    const additions = otherArr.filter(i => !winnerIds.has(i.id));
    return [...winnerArr, ...additions];
  };

  return {
    ...winner,
    autoRules: mergeById(winner.autoRules ?? [], other.autoRules ?? []),
    recurringExpenses: mergeById(winner.recurringExpenses ?? [], other.recurringExpenses ?? []),
    savedFilters: mergeById(winner.savedFilters ?? [], other.savedFilters ?? []),
    goals: mergeById(winner.goals ?? [], other.goals ?? []),
    customCategories: mergeById(winner.customCategories ?? [], other.customCategories ?? []),
    // Record fields: winner's keys take precedence; other only fills in missing keys
    categoryBudgets: { ...other.categoryBudgets, ...winner.categoryBudgets },
    monthlyBudgets: { ...(other.monthlyBudgets ?? {}), ...(winner.monthlyBudgets ?? {}) },
  };
}

/**
 * Cheap content hash (djb2) for settings comparison — excludes timestamps.
 * Returns a numeric hash; only used for equality checks, not security.
 */
export function settingsContentHash(s: UserSettings): number {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt: _c, updatedAt: _u, ...rest } = s;
  const str = JSON.stringify(rest);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// ── Shared module-level state ──

export let _settings: UserSettings = DEFAULT_SETTINGS;
const _listeners = new Set<() => void>();

export function _notify() {
  _listeners.forEach((fn) => fn());
}

export function _setShared(next: UserSettings) {
  if (next.salary !== _settings.salary) {
    console.log(`[settings] salary changed: ${_settings.salary} → ${next.salary} (updatedAt=${next.updatedAt})`);
  }
  _settings = next;
  _notify();
}

export function _getSnapshot(): UserSettings {
  return _settings;
}

export function _subscribe(cb: () => void): () => void {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

// ── localStorage persistence ──

export function loadSettings(userId: string | null = _currentUserId): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const key = storageKeyForUser(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      if (raw.startsWith("enc:")) {
        _decryptAndApplySettings(raw);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }

    if (userId !== null) {
      const oldRaw = localStorage.getItem(STORAGE_KEY_BASE);
      if (oldRaw) {
        const parsed = JSON.parse(oldRaw);
        if (parsed.salary > 0 || parsed.updatedAt > 0) {
          localStorage.setItem(key, oldRaw);
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

async function _decryptAndApplySettings(raw: string) {
  try {
    const parsed = await decryptJSON<UserSettings>(raw);
    if (parsed && parsed.updatedAt > 0) {
      _setShared({ ...DEFAULT_SETTINGS, ...parsed });
    }
  } catch {
    // Decryption failed — will fall back to IDB sync
  }
}

export function saveLocal(s: UserSettings) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(s);
  if (hasEncryptionKey()) {
    encryptJSON(s).then((encrypted) => {
      localStorage.setItem(storageKeyForUser(_currentUserId), encrypted);
    }).catch(() => {
      localStorage.setItem(storageKeyForUser(_currentUserId), json);
    });
  } else {
    localStorage.setItem(storageKeyForUser(_currentUserId), json);
  }
}

// ── Module-level initialization ──

if (typeof window !== "undefined") {
  try {
    const authRaw = localStorage.getItem("expenstream-auth");
    const authState = authRaw ? JSON.parse(authRaw) : null;
    const userId = authState?.user?.id ?? null;
    _currentUserId = userId;
    const local = loadSettings(userId);
    console.log(`[settings:init] userId=${userId?.slice(0,8) ?? 'null'} local.salary=${local.salary} local.updatedAt=${local.updatedAt}`);
    _setShared(local);
  } catch {
    const local = loadSettings(null);
    _setShared(local);
  }
}
