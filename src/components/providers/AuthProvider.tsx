"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getAuthState,
  subscribeAuth,
  setAuthState,
  clearAuthState,
  authFetch,
  refreshTokens,
  type AuthState,
  type AuthUser,
  type AuthWorkspace,
} from "@/lib/authClient";
import { switchSettingsUser, clearSettingsForCurrentUser } from "@/hooks/useSettings";
import { getDeviceId } from "@/lib/utils";
import { storeEncryptionKey, clearEncryptionKey, hasEncryptionKey } from "@/lib/crypto";
import * as Sentry from "@sentry/nextjs";

// ── Context ──────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA?: boolean; challengeToken?: string; error?: string }>;
  loginWith2FA: (challengeToken: string, code: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Stable server snapshot for useSyncExternalStore (must be referentially stable)
const SERVER_SNAPSHOT: AuthState = {
  user: null,
  tokens: null,
  workspaces: [] as AuthWorkspace[],
  activeWorkspaceId: null,
};

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeAuth, getAuthState, () => SERVER_SNAPSHOT);
  // True while we are trying to restore the session from the httpOnly refresh cookie.
  // Prevents the login form from flashing on hard refresh.
  const [bootRefreshDone, setBootRefreshDone] = useState(false);
  // True when the boot refresh failed due to a network/server error (not an auth rejection).
  // In this case the user is kept "soft-authenticated" using cached localStorage data
  // and a silent retry is scheduled so they are not forced to log in on every app open
  // after coming back from sleep / offline.
  const [bootNetworkError, setBootNetworkError] = useState(false);

  useEffect(() => {
    // If we already have an access token in module memory, no refresh needed.
    if (state.tokens?.accessToken) {
      setBootRefreshDone(true);
      return;
    }
    // Attempt silent restore from httpOnly refresh cookie.
    refreshTokens()
      .then((result) => {
        if (result === "network-error" && getAuthState().user) {
          // Transient failure (device waking from sleep, flaky network, server hiccup).
          // Keep the user signed-in using cached state; retry when the network recovers.
          setBootNetworkError(true);
        }
        // "revoked" → nothing extra; isAuthenticated will be false → login screen shown
        // "ok" → state already updated inside refreshTokens
      })
      .catch(() => { /* should not reach here; refreshTokens never throws */ })
      .finally(() => setBootRefreshDone(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // When a network-error boot happened, retry silently on visibility change or after a delay.
  useEffect(() => {
    if (!bootNetworkError) return;

    let cancelled = false;

    const retry = async () => {
      if (cancelled || document.visibilityState !== "visible") return;
      const result = await refreshTokens();
      if (cancelled) return;
      if (result !== "network-error") {
        // Either recovered ("ok") or session was actually revoked — either way, clear the
        // soft-auth flag so the correct state is shown.
        setBootNetworkError(false);
      }
    };

    const onVisibility = () => { if (document.visibilityState === "visible") retry(); };
    document.addEventListener("visibilitychange", onVisibility);
    // Also retry after a brief delay in case the network comes up quickly.
    const timer = setTimeout(retry, 5_000);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer);
    };
  }, [bootNetworkError]);

  // Fetch workspace encryption key and store in sessionStorage
  const fetchEncryptionKey = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth/encryption-key");
      if (res.ok) {
        const { key } = await res.json();
        if (key) storeEncryptionKey(key);
      }
    } catch {
      // Non-fatal: encryption is best-effort
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      let data;
      try { data = await res.json(); } catch { return { error: "Server error. Please try again." }; }
      if (!res.ok) return { error: data.error ?? "Login failed" };

      if (data.requires2FA) {
        return { requires2FA: true, challengeToken: data.challengeToken };
      }

      setAuthState({
        user: data.user as AuthUser,
        tokens: {
          accessToken: data.accessToken,
        },
        workspaces: data.workspaces,
        activeWorkspaceId: data.activeWorkspaceId,
      });
      switchSettingsUser(data.user.id);
      fetchEncryptionKey();

      return {};
    },
    [fetchEncryptionKey],
  );

  const loginWith2FA = useCallback(
    async (challengeToken: string, code: string) => {
      const res = await fetch("/api/auth/login/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
        body: JSON.stringify({ challengeToken, code }),
        credentials: "include",
      });

      let data;
      try { data = await res.json(); } catch { return { error: "Server error. Please try again." }; }
      if (!res.ok) return { error: data.error ?? "Verification failed" };

      setAuthState({
        user: data.user as AuthUser,
        tokens: {
          accessToken: data.accessToken,
        },
        workspaces: data.workspaces,
        activeWorkspaceId: data.activeWorkspaceId,
      });
      switchSettingsUser(data.user.id);
      fetchEncryptionKey();

      return {};
    },
    [fetchEncryptionKey],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });

      let data;
      try { data = await res.json(); } catch { return { error: "Server error. Please try again." }; }
      if (!res.ok) return { error: data.error ?? "Registration failed" };

      setAuthState({
        user: data.user as AuthUser,
        tokens: {
          accessToken: data.accessToken,
        },
        workspaces: [
          { id: data.workspace.id, name: data.workspace.name, role: "OWNER" },
        ],
        activeWorkspaceId: data.workspace.id,
      });
      switchSettingsUser(data.user.id);
      fetchEncryptionKey();

      return {};
    },
    [fetchEncryptionKey],
  );

  const logout = useCallback(async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort
    }
    clearSettingsForCurrentUser();
    clearEncryptionKey();
    clearAuthState();
    setAuthState({
      user: null,
      tokens: null,
      workspaces: [],
      activeWorkspaceId: null,
    });
  }, []);

  const switchWorkspace = useCallback((workspaceId: string) => {
    setAuthState({ activeWorkspaceId: workspaceId });
    fetchEncryptionKey();
  }, [fetchEncryptionKey]);

  // ── Restore settings for user already in localStorage on page load ──
  // switchSettingsUser is only called on explicit login/register, but auth state
  // is restored from localStorage at module init — so we must sync settings here too.
  useEffect(() => {
    if (state.user?.id) {
      switchSettingsUser(state.user.id);
      Sentry.setUser({ id: state.user.id, email: state.user.email });
    } else {
      Sentry.setUser(null);
    }
  }, [state.user?.id, state.user?.email]);

  // ── Restore encryption key on page load if auth exists but key is gone ──
  useEffect(() => {
    if (state.tokens?.accessToken && !hasEncryptionKey()) {
      fetchEncryptionKey();
    }
  }, [state.tokens?.accessToken, fetchEncryptionKey]);

  // ── Sync profile (avatar, name) on first load ─────────────
  useEffect(() => {
    if (!state.tokens?.accessToken) return;
    let cancelled = false;
    const syncProfile = async () => {
      try {
        const res = await authFetch("/api/auth/check");
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.user) {
            const current = getAuthState().user;
            if (current && (current.avatarUrl !== data.user.avatarUrl || current.name !== data.user.name)) {
              setAuthState({ user: { ...current, name: data.user.name, avatarUrl: data.user.avatarUrl } });
            }
          }
        }
      } catch { /* non-fatal */ }
    };
    syncProfile();
    return () => { cancelled = true; };
  }, [state.tokens?.accessToken]);

  // ── Session heartbeat: detect revoked sessions ────────────
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; });

  useEffect(() => {
    if (!state.tokens?.accessToken) return;

    const INTERVAL_MS = 30_000; // 30 seconds

    let consecutive401 = 0;

    const checkSession = async () => {
      try {
        const res = await authFetch("/api/auth/check");
        if (res.status === 401) {
          // authFetch already attempted token refresh. If still 401, the
          // session is likely revoked — but require 2 consecutive failures
          // to avoid clearing auth on transient server errors.
          consecutive401++;
          if (consecutive401 >= 2) {
            clearAuthState();
            setAuthState({ user: null, tokens: null, workspaces: [], activeWorkspaceId: null });
          }
        } else if (res.ok) {
          consecutive401 = 0;
          // Sync user profile (avatar, name) from server
          const data = await res.json().catch(() => null);
          if (data?.user) {
            const current = getAuthState().user;
            if (current && (current.avatarUrl !== data.user.avatarUrl || current.name !== data.user.name)) {
              setAuthState({ user: { ...current, name: data.user.name, avatarUrl: data.user.avatarUrl } });
            }
          }
        }
      } catch {
        // Network error — ignore, retry on next tick
      }
    };

    const id = setInterval(checkSession, INTERVAL_MS);

    // Also check when tab becomes visible again
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkSession();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state.tokens?.accessToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        // Soft-auth: treat user as authenticated if the boot refresh failed due to a
        // network error (not a 401) and we have cached user data from localStorage.
        // This prevents devices from being signed out just because the network was
        // unavailable when the app was opened (e.g. waking from sleep).
        // The retry effect above will re-verify when connectivity returns.
        isAuthenticated: !!state.tokens?.accessToken || (bootNetworkError && !!state.user),
        login,
        loginWith2FA,
        register,
        logout,
        switchWorkspace,
      }}
    >
      {!bootRefreshDone ? null : children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
