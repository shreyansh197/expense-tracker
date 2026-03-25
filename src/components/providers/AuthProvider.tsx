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

// ── Context ──────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ requires2FA?: boolean; userId?: string; error?: string }>;
  loginWith2FA: (userId: string, code: string) => Promise<{ error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeAuth, getAuthState, () => ({
    user: null,
    tokens: null,
    workspaces: [] as AuthWorkspace[],
    activeWorkspaceId: null,
  }));

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try { data = await res.json(); } catch { return { error: "Server error. Please try again." }; }
      if (!res.ok) return { error: data.error ?? "Login failed" };

      if (data.requires2FA) {
        return { requires2FA: true, userId: data.userId };
      }

      setAuthState({
        user: data.user as AuthUser,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        workspaces: data.workspaces,
        activeWorkspaceId: data.activeWorkspaceId,
      });
      switchSettingsUser(data.user.id);

      return {};
    },
    [],
  );

  const loginWith2FA = useCallback(
    async (userId: string, code: string) => {
      const res = await fetch("/api/auth/login/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code }),
      });

      let data;
      try { data = await res.json(); } catch { return { error: "Server error. Please try again." }; }
      if (!res.ok) return { error: data.error ?? "Verification failed" };

      setAuthState({
        user: data.user as AuthUser,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        workspaces: data.workspaces,
        activeWorkspaceId: data.activeWorkspaceId,
      });
      switchSettingsUser(data.user.id);

      return {};
    },
    [],
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      let data;
      try { data = await res.json(); } catch { return { error: "Server error. Please try again." }; }
      if (!res.ok) return { error: data.error ?? "Registration failed" };

      setAuthState({
        user: data.user as AuthUser,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        },
        workspaces: [
          { id: data.workspace.id, name: data.workspace.name, role: "OWNER" },
        ],
        activeWorkspaceId: data.workspace.id,
      });
      switchSettingsUser(data.user.id);

      return {};
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort
    }
    clearSettingsForCurrentUser();
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
  }, []);

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
