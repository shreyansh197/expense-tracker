"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  getAuthState,
  subscribeAuth,
  setAuthState,
  clearAuthState,
  authFetch,
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

  // ── Session heartbeat: detect revoked sessions ────────────
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; });

  useEffect(() => {
    if (!state.tokens?.accessToken) return;

    const INTERVAL_MS = 30_000; // 30 seconds

    const checkSession = async () => {
      try {
        const res = await authFetch("/api/auth/check");
        if (res.status === 401) {
          // Session was revoked — force logout
          clearAuthState();
          setAuthState({ user: null, tokens: null, workspaces: [], activeWorkspaceId: null });
        } else if (res.ok) {
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
        isAuthenticated: !!state.tokens?.accessToken,
        login,
        loginWith2FA,
        register,
        logout,
        switchWorkspace,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
