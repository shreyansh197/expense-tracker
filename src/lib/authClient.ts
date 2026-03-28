const AUTH_STORAGE_KEY = "expense-tracker-auth";

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
  refreshToken: string;
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

function loadState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, tokens: null, workspaces: [], activeWorkspaceId: null };
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, tokens: null, workspaces: [], activeWorkspaceId: null };
    return JSON.parse(raw);
  } catch {
    return { user: null, tokens: null, workspaces: [], activeWorkspaceId: null };
  }
}

function saveState(state: AuthState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function clearAuthState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// ── Singleton state + subscribers ────────────────────────────

let _state: AuthState = loadState();
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
  _state = { ..._state, ...update };
  saveState(_state);
  notify();
}

export function isAuthenticated(): boolean {
  return !!_state.tokens?.accessToken;
}

export function getAccessToken(): string | null {
  return _state.tokens?.accessToken ?? null;
}

export function getActiveWorkspaceId(): string | null {
  return _state.activeWorkspaceId;
}

// ── Token refresh ────────────────────────────────────────────

let _refreshPromise: Promise<boolean> | null = null;

export async function refreshTokens(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const rt = _state.tokens?.refreshToken;
    if (!rt) return false;

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });

      if (!res.ok) {
        clearAuthState();
        setAuthState({ user: null, tokens: null, workspaces: [], activeWorkspaceId: null });
        return false;
      }

      const data = await res.json();
      setAuthState({
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
      });
      return true;
    } catch {
      return false;
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

  let res = await fetch(input, { ...init, headers });

  // If 401, try refreshing
  if (res.status === 401 && _state.tokens?.refreshToken) {
    const ok = await refreshTokens();
    if (ok) {
      const newToken = getAccessToken();
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        res = await fetch(input, { ...init, headers });
      }
    }
  }

  return res;
}
