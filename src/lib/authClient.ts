const AUTH_STORAGE_KEY = "expenstream-auth";

function getClientDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("expense-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("expense-device-id", id);
  }
  return id;
}

export interface AuthTokens {
  accessToken: string;
  /** @deprecated Refresh token is now stored as httpOnly cookie. Kept for migration compatibility. */
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AuthWorkspace {
  id: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  workspaces: AuthWorkspace[];
  activeWorkspaceId: string | null;
}

// ── Storage ──────────────────────────────────────────────────

/** Non-sensitive state persisted to localStorage (no credentials). */
interface PersistedAuthState {
  user: AuthUser | null;
  workspaces: AuthWorkspace[];
  activeWorkspaceId: string | null;
}

function loadState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, tokens: null, workspaces: [], activeWorkspaceId: null };
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, tokens: null, workspaces: [], activeWorkspaceId: null };
    const persisted: PersistedAuthState = JSON.parse(raw);
    // accessToken is never persisted — it lives in _accessToken (module memory only)
    return { ...persisted, tokens: null };
  } catch {
    return { user: null, tokens: null, workspaces: [], activeWorkspaceId: null };
  }
}

function saveState(state: AuthState) {
  if (typeof window === "undefined") return;
  // Persist only non-sensitive fields; accessToken stays in memory (_accessToken)
  const persisted: PersistedAuthState = {
    user: state.user,
    workspaces: state.workspaces,
    activeWorkspaceId: state.activeWorkspaceId,
  };
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(persisted));
}

export function clearAuthState() {
  if (typeof window === "undefined") return;
  _accessToken = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// ── Singleton state + subscribers ────────────────────────────

let _state: AuthState = loadState();
/** Access token stored in module memory only — never written to localStorage. */
let _accessToken: string | null = null;
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

export function getAuthState(): AuthState {
  return _state;
}

export function subscribeAuth(fn: () => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function setAuthState(update: Partial<AuthState>) {
  // If tokens are being updated, extract accessToken into module memory only
  if (update.tokens?.accessToken !== undefined) {
    _accessToken = update.tokens.accessToken;
  }
  _state = { ..._state, ...update };
  saveState(_state);
  notify();
}

export function isAuthenticated(): boolean {
  return !!_accessToken;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function getActiveWorkspaceId(): string | null {
  return _state.activeWorkspaceId;
}

// ── Token refresh ────────────────────────────────────────────

/**
 * "ok"           – refresh succeeded, new access token stored
 * "revoked"      – server explicitly rejected the token (401/403) — user must log in
 * "network-error" – fetch failed or server returned 5xx — transient; keep cached state
 */
export type RefreshResult = "ok" | "revoked" | "network-error";

let _refreshPromise: Promise<RefreshResult> | null = null;

export async function refreshTokens(): Promise<RefreshResult> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends httpOnly cookie
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        // 401/403 → session definitively invalid; anything else is transient
        if (res.status === 401 || res.status === 403) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("expenstream:session-expired"));
          }
          return "revoked";
        }
        return "network-error";
      }

      const data = await res.json();
      setAuthState({
        tokens: {
          accessToken: data.accessToken,
          // refreshToken is now in httpOnly cookie, not in response body
        },
      });
      return "ok";
    } catch {
      // Network unreachable, DNS failure, timeout, etc. — do NOT sign the user out
      return "network-error";
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── API fetch wrapper with auto-refresh ──────────────────────

export async function authFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("X-Device-Id", getClientDeviceId());

  let res = await fetch(input, { ...init, headers, credentials: "include" });

  // If 401, try refreshing (cookie-based)
  if (res.status === 401 && _state.tokens?.accessToken) {
    const result = await refreshTokens();
    if (result === "ok") {
      const newToken = getAccessToken();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(input, { ...init, headers, credentials: "include" });
      }
    }
  }

  return res;
}
