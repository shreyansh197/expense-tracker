"use client";

import { useState } from "react";
import {
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface AuthModalProps {
  onComplete: (salary?: number) => void;
  initialMode?: "register" | "login" | "join";
  inviteToken?: string;
}

export function AuthModal({
  onComplete,
  initialMode = "register",
}: AuthModalProps) {
  const [mode, setMode] = useState<"choose" | "register" | "login">(
    initialMode === "join" ? "login" : "choose",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [salary, setSalary] = useState("");
  const [showSalary, setShowSalary] = useState(false);

  const { login, register } = useAuth();

  const handleRegister = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setLoading(true);
    const result = await register(email, password, name || undefined);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // After registration, ask for salary
    setShowSalary(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.requires2FA) {
      // TODO: Show TOTP input
      setError("2FA verification required (coming soon)");
      return;
    }

    onComplete();
  };

  const handleSalarySubmit = () => {
    const val = parseFloat(salary);
    onComplete(val > 0 ? val : undefined);
  };

  // ── Salary step (after registration) ───────────────────────

  if (showSalary) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Set Your Monthly Budget
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Enter your monthly salary or budget to track spending against.
          </p>

          <div className="relative mb-6">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              ₹
            </span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="e.g. 50000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-8 pr-4 text-lg text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSalarySubmit}
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            {salary ? "Get Started" : "Skip for Now"}
          </button>
        </div>
      </div>
    );
  }

  // ── Choose mode ────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to ExpenseTracker
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Track your expenses, set budgets, and manage your finances.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setMode("register")}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Create Account
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Start fresh with a new workspace
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("login")}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Sign In
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Access your existing account
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Register / Login form ──────────────────────────────────

  const isRegister = mode === "register";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <button
          onClick={() => {
            setMode("choose");
            setError("");
          }}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {isRegister ? "Create Account" : "Sign In"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isRegister
            ? "Set up your account to get started"
            : "Welcome back! Sign in to continue"}
        </p>

        <div className="space-y-4">
          {isRegister && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              placeholder={isRegister ? "Password (min 8 chars)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={isRegister ? handleRegister : handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? "Create Account" : "Sign In"}
          </button>

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create one
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
