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
  TrendingUp,
  PieChart,
  Shield,
  Smartphone,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

/* ── Google G color-mark SVG ──────────────────────────────── */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

interface AuthModalProps {
  onComplete: (salary?: number) => void;
  initialMode?: "register" | "login" | "join";
  inviteToken?: string;
}

/* ── Feature items for the hero panel ────────────────────── */
const FEATURES = [
  {
    icon: PieChart,
    title: "Visual Analytics",
    desc: "Beautiful charts and category breakdowns at a glance",
    color: "text-violet-400",
    bg: "bg-violet-500/20",
  },
  {
    icon: TrendingUp,
    title: "Budget Tracking",
    desc: "Auto-rollover budgets with real-time remaining alerts",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    desc: "Two-factor auth, encrypted sessions & device management",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    desc: "Full PWA support — install as an app on any device",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
];

/* ── Animated floating orbs (pure CSS) ──────────────────── */
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl animate-pulse [animation-delay:1s]" />
      <div className="absolute -bottom-16 left-1/4 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl animate-pulse [animation-delay:2s]" />
    </div>
  );
}

/* ── Hero / branding panel (desktop only — left side) ───── */
function DesktopHeroPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 px-12 py-14 text-white">
      <FloatingOrbs />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Wallet className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">ExpenseTracker</span>
        </div>

        <h1 className="mt-8 text-4xl font-extrabold leading-tight">
          Take control of{" "}
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            your finances
          </span>
        </h1>
        <p className="mt-3 max-w-md text-base leading-relaxed text-blue-100/70">
          Track every rupee, set smart budgets, and discover where your money
          actually goes — all in one elegant app.
        </p>
      </div>

      <div className="relative z-10 mt-10 grid grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.10]"
          >
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${f.bg}`}>
              <f.icon className={`h-4 w-4 ${f.color}`} />
            </div>
            <p className="text-xs font-semibold text-white/90">{f.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/50">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="relative z-10 mt-8 text-[11px] text-white/30">
        Trusted by thousands · Free forever · Open source
      </p>
    </div>
  );
}

/* ── Mobile full-screen layout ──────────────────────────── */
function MobileAuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-gradient-to-b from-gray-900 via-blue-950 to-indigo-950 lg:hidden">
      <FloatingOrbs />

      {/* Top branding area */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-12 pb-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm shadow-lg shadow-blue-900/30">
          <Wallet className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-3 text-xl font-bold text-white">ExpenseTracker</h1>
        <p className="mt-1 text-xs text-blue-200/60">Smart budgeting, effortless tracking</p>
      </div>

      {/* Card area — pushed up with rounded top */}
      <div className="relative z-10 mt-auto flex-1 flex flex-col">
        <div className="flex-1 flex flex-col rounded-t-3xl bg-white px-6 pt-6 pb-8 shadow-2xl shadow-black/20 dark:bg-gray-900"
          style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex-1 flex flex-col justify-center">
            {children}
          </div>
          <p className="mt-4 text-center text-[10px] text-gray-400 dark:text-gray-600">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop split layout ───────────────────────────────── */
function DesktopAuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden min-h-screen w-full lg:flex lg:flex-row">
      <div className="w-1/2 min-h-screen">
        <DesktopHeroPanel />
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-gray-50 px-16 py-10 dark:bg-gray-950">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-10 h-60 w-60 rounded-full bg-blue-100/50 blur-3xl dark:bg-blue-900/15" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-purple-100/40 blur-3xl dark:bg-purple-900/10" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-xl shadow-gray-200/40 dark:border-gray-800/60 dark:bg-gray-900 dark:shadow-none">
            {children}
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-600">
            By continuing, you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Combined wrapper that renders both (CSS hides one) ── */
function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MobileAuthPage>{children}</MobileAuthPage>
      <DesktopAuthPage>{children}</DesktopAuthPage>
    </>
  );
}

export function AuthModal({
  onComplete,
  initialMode = "register",
}: AuthModalProps) {
  const [mode, setMode] = useState<"choose" | "register" | "login" | "totp">(
    initialMode === "join" ? "login" : "choose",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [salary, setSalary] = useState("");
  const [showSalary, setShowSalary] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const { login, loginWith2FA, register } = useAuth();

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

    if (result.requires2FA && result.userId) {
      setPendingUserId(result.userId);
      setTotpCode("");
      setError("");
      setMode("totp");
      return;
    }

    onComplete();
  };

  const handleVerify2FA = async () => {
    if (!pendingUserId || totpCode.length !== 6) return;

    setError("");
    setLoading(true);
    const result = await loginWith2FA(pendingUserId, totpCode);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onComplete();
  };

  const handleSalarySubmit = () => {
    const val = parseFloat(salary);
    onComplete(val > 0 ? val : undefined);
  };

  // ── TOTP verification step ─────────────────────────────────

  if (mode === "totp") {
    return (
      <AuthPage>
        <button
          onClick={() => {
            setMode("login");
            setError("");
            setPendingUserId(null);
            setTotpCode("");
          }}
          className="mb-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
          Two-Factor Authentication
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter the 6-digit code from your authenticator app to continue.
        </p>

        <div className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 text-center font-mono text-2xl tracking-[0.4em] text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify2FA(); }}
          />

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleVerify2FA}
            disabled={totpCode.length !== 6 || loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & Sign In
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            You can also use a recovery code
          </p>
        </div>
      </AuthPage>
    );
  }

  // ── Salary step (after registration) ───────────────────────

  if (showSalary) {
    return (
      <AuthPage>
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
          Set Your Monthly Budget
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your monthly salary or budget to track spending against.
        </p>

        <div className="relative mb-6">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
            ₹
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="e.g. 50000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSalarySubmit(); }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-9 pr-4 text-lg font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>

        <button
          onClick={handleSalarySubmit}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all"
        >
          {salary ? "Get Started →" : "Skip for Now"}
        </button>
      </AuthPage>
    );
  }

  // ── Choose mode ────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <AuthPage>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Get Started
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
          Track expenses, set budgets, and manage your finances.
        </p>

        <div className="space-y-3">
          {/* Google sign-in */}
          <button
            onClick={() => { window.location.href = "/api/auth/google"; }}
            className="group relative flex w-full items-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-3.5 text-left transition-all hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-700">
              <GoogleIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Continue with Google</div>
              <div className="text-xs text-gray-400">Sign in or create account instantly</div>
            </div>
          </button>

          {/* OR divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>
          <button
            onClick={() => setMode("register")}
            className="group relative flex w-full items-center gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-left text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-base">Create Account</div>
              <div className="text-xs text-blue-100/80">
                Start fresh with a new workspace
              </div>
            </div>
            <ArrowLeft className="ml-auto h-4 w-4 rotate-180 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => setMode("login")}
            className="group relative flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100 hover:-translate-y-0.5 active:translate-y-0 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-emerald-700 dark:hover:shadow-emerald-900/10"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-100 transition-colors group-hover:bg-emerald-200 dark:bg-emerald-900/50 dark:group-hover:bg-emerald-900/70">
              <LogIn className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900 dark:text-white">
                Sign In
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Access your existing account
              </div>
            </div>
            <ArrowLeft className="ml-auto h-4 w-4 rotate-180 text-gray-300 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1 dark:text-gray-600" />
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
        className="mb-5 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        {isRegister ? "Create Account" : "Welcome Back"}
      </h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
        {isRegister
          ? "Set up your account to get started"
          : "Sign in to continue tracking your expenses"}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading) (isRegister ? handleRegister : handleLogin)();
        }}
        className="space-y-3.5"
      >
        {isRegister && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="password"
            placeholder={isRegister ? "Password (min 8 chars)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRegister ? "Create Account" : "Sign In"}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create one
              </button>
            </>
          )}
        </p>
      </form>

      {/* OR + Google button */}
      <div className="mt-5 relative flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">or continue with</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>
      <button
        type="button"
        onClick={() => { window.location.href = "/api/auth/google"; }}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <GoogleIcon className="h-4 w-4" />
        Google
      </button>
    </AuthPage>
  );
}
