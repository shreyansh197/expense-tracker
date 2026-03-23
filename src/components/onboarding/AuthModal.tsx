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
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface AuthModalProps {
  onComplete: (salary?: number) => void;
  initialMode?: "register" | "login" | "join";
  inviteToken?: string;
}

/* ── Full-page wrapper with gradient background ─────────── */
function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950/40 dark:to-indigo-950/30 p-4 sm:p-6 md:p-8">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-900/20" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/10" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Branding */}
        <div className="mb-6 text-center sm:mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            ExpenseTracker
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Smart budgeting, effortless tracking
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-md dark:border-gray-800/60 dark:bg-gray-900/80">
          {children}
        </div>
      </div>
    </div>
  );
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
      <AuthPage>
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
      </AuthPage>
    );
  }

  // ── Choose mode ────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <AuthPage>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          Get Started
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Track expenses, set budgets, and manage your finances.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => setMode("register")}
            className="group flex w-full items-center gap-3 rounded-xl border border-gray-200/80 bg-white/60 p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700/80 dark:bg-gray-800/60 dark:hover:border-blue-700 dark:hover:bg-blue-950/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 transition-colors group-hover:bg-blue-200 dark:bg-blue-900/60 dark:group-hover:bg-blue-900">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 transition-colors group-hover:text-blue-700 dark:text-gray-100 dark:group-hover:text-blue-300">
                Create Account
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Start fresh with a new workspace
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode("login")}
            className="group flex w-full items-center gap-3 rounded-xl border border-gray-200/80 bg-white/60 p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-700/80 dark:bg-gray-800/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/60 dark:group-hover:bg-emerald-900">
              <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 transition-colors group-hover:text-emerald-700 dark:text-gray-100 dark:group-hover:text-emerald-300">
                Sign In
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Access your existing account
              </div>
            </div>
          </button>
        </div>
      </AuthPage>
    );
  }

  // ── Register / Login form ──────────────────────────────────

  const isRegister = mode === "register";

  return (
    <AuthPage>
      <button
        onClick={() => {
          setMode("choose");
          setError("");
        }}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
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
    </AuthPage>
  );
}
