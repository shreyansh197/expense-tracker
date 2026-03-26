"use client";

import { useState } from "react";
import { useCurrency } from "@/hooks/useCurrency";
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
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

// ── Fixed palette for hero panels (never changes with theme) ──
const SP_BG   = "linear-gradient(135deg, #0a0f1e 0%, #0d1340 45%, #130a2e 100%)";
const SP_CYAN = "#22d3ee";
const SP_VIOLET = "#a78bfa";
const SP_INDIGO = "#6366f1";

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
    border: `rgba(167,139,250,0.3)`,
    iconColor: SP_VIOLET,
    iconBg: "rgba(167,139,250,0.15)",
  },
  {
    icon: TrendingUp,
    title: "Budget Tracking",
    desc: "Auto-rollover budgets with real-time remaining alerts",
    border: `rgba(34,211,238,0.3)`,
    iconColor: SP_CYAN,
    iconBg: "rgba(34,211,238,0.15)",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    desc: "Two-factor auth, encrypted sessions & device management",
    border: `rgba(99,102,241,0.3)`,
    iconColor: SP_INDIGO,
    iconBg: "rgba(99,102,241,0.15)",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    desc: "Full PWA support — install as an app on any device",
    border: `rgba(167,139,250,0.25)`,
    iconColor: SP_VIOLET,
    iconBg: "rgba(167,139,250,0.12)",
  },
];

/* ── Animated floating orbs — fixed palette, no CSS vars ─── */
function FloatingOrbs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", top: "-10%", left: "-8%",
        width: 420, height: 420, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(34,211,238,0.20) 0%, transparent 70%)`,
        animation: "sp-orb 8s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "35%", right: "-12%",
        width: 360, height: 360, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)`,
        animation: "sp-orb 10s ease-in-out infinite",
        animationDelay: "2s",
      }} />
      <div style={{
        position: "absolute", bottom: "-12%", left: "20%",
        width: 400, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 70%)`,
        animation: "sp-orb 9s ease-in-out infinite",
        animationDelay: "4s",
      }} />
    </div>
  );
}

/* ── Hero / branding panel (desktop only — left side) ───── */
function DesktopHeroPanel() {
  return (
    <div style={{
      position: "relative",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      height: "100%", overflow: "hidden",
      background: SP_BG,
      padding: "56px 48px",
      color: "white",
    }}>
      <FloatingOrbs />

      {/* Subtle grid overlay */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }} />

      {/* Logo + brand */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo with glow ring */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -3, borderRadius: "14px",
              background: `linear-gradient(135deg, ${SP_INDIGO}, ${SP_CYAN})`,
              opacity: 0.5, filter: "blur(6px)",
            }} />
            <div style={{
              position: "relative",
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${SP_INDIGO}, #4338ca)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 20px rgba(99,102,241,0.4)`,
            }}>
              <Wallet style={{ width: 22, height: 22, color: "white" }} />
            </div>
          </div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Spendly
          </span>
        </div>

        <h1 style={{
          marginTop: 32, fontSize: "2.5rem", fontWeight: 800,
          letterSpacing: "-0.04em", lineHeight: 1.15,
        }}>
          Take control of{" "}
          <span style={{
            background: `linear-gradient(90deg, ${SP_CYAN}, ${SP_VIOLET})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            your finances
          </span>
        </h1>
        <p style={{
          marginTop: 12, fontSize: "0.95rem", lineHeight: 1.7,
          color: "rgba(255,255,255,0.6)", maxWidth: 380,
        }}>
          Track every rupee, set smart budgets, and discover where your money
          actually goes — all in one elegant app.
        </p>
      </div>

      {/* Feature grid */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 32,
      }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${f.border}`,
            borderRadius: 14,
            padding: "14px 14px",
            backdropFilter: "blur(12px)",
            transition: "background 0.2s",
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: f.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 8,
            }}>
              <f.icon style={{ width: 15, height: 15, color: f.iconColor }} />
            </div>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>
              {f.title}
            </p>
            <p style={{ fontSize: "0.65rem", lineHeight: 1.5, color: "rgba(255,255,255,0.45)" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <p style={{
        position: "relative", zIndex: 1,
        marginTop: 24, fontSize: "0.68rem",
        color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em",
      }}>
        Trusted by thousands · Free forever · Open source
      </p>
    </div>
  );
}

/* ── Mobile full-screen layout ──────────────────────────── */
function MobileAuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: "relative",
      minHeight: "100dvh",
      background: SP_BG,
      overflow: "hidden",
    }} className="flex flex-col lg:hidden">
      <FloatingOrbs />

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
        backgroundSize: "44px 44px",
      }} />

      {/* Top branding */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "48px 24px 16px",
      }}>
        {/* Logo with glow ring */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <div style={{
            position: "absolute", inset: -4, borderRadius: "20px",
            background: `linear-gradient(135deg, ${SP_INDIGO}, ${SP_CYAN})`,
            opacity: 0.4, filter: "blur(8px)",
          }} />
          <div style={{
            position: "relative",
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, ${SP_INDIGO}, #4338ca)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 6px 24px rgba(99,102,241,0.5)`,
          }}>
            <Wallet style={{ width: 26, height: 26, color: "white" }} />
          </div>
        </div>
        <h1 style={{
          fontSize: "1.375rem", fontWeight: 800,
          letterSpacing: "-0.03em", color: "white",
        }}>
          Spendly
        </h1>
        <p style={{
          marginTop: 4, fontSize: "0.7rem", letterSpacing: "0.05em",
          textTransform: "uppercase",
          background: `linear-gradient(90deg, ${SP_CYAN}, ${SP_VIOLET})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Spend smarter. Live better.
        </p>
      </div>

      {/* Card — theme-aware (white / dark:gray-900) */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", marginTop: "auto" }}>
        <div
          className="flex-1 flex flex-col rounded-t-3xl bg-white px-6 pt-7 pb-8 shadow-2xl shadow-black/30 dark:bg-gray-900"
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
      <div className="w-[48%] min-h-screen">
        <DesktopHeroPanel />
      </div>

      <div className="relative flex flex-1 items-center justify-center bg-gray-50 px-16 py-10 dark:bg-gray-950">
        {/* Subtle decorative orbs — use Tailwind so they follow theme */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 right-10 h-60 w-60 rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-900/10" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-violet-100/50 blur-3xl dark:bg-violet-900/10" />
        </div>

        <div className="relative z-10 w-full max-w-sm" style={{ animation: "sp-form-in 0.45s ease both" }}>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-xl shadow-gray-200/60 dark:border-gray-800/60 dark:bg-gray-900 dark:shadow-none">
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

/* ── Combined wrapper (CSS hides one at a time) ─────────── */
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
  const [showPassword, setShowPassword] = useState(false);
  const { symbol } = useCurrency();

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
          onClick={() => { setMode("login"); setError(""); setPendingUserId(null); setTotpCode(""); }}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 ring-1 ring-indigo-200 dark:ring-indigo-700/50">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Two-Factor Auth
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 mb-7">
          Enter the 6-digit code from your authenticator app.
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
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 text-center font-mono text-2xl tracking-[0.5em] text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:text-gray-300 dark:placeholder:text-gray-600"
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify2FA(); }}
          />

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/40">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleVerify2FA}
            disabled={totpCode.length !== 6 || loading}
            className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Verify &amp; Sign In
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
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
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-900/30 ring-1 ring-cyan-200 dark:ring-cyan-700/50">
          <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Set your budget
        </h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 mb-7">
          Enter your monthly income or budget. You can change this anytime in Settings.
        </p>

        <div className="relative mb-5">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-lg font-semibold text-gray-400">{symbol}</span>
          </div>
          <input
            type="number"
            inputMode="numeric"
            placeholder="50,000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSalarySubmit(); }}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-4 pl-10 pr-4 text-xl font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 placeholder:font-normal"
          />
        </div>

        <button
          onClick={handleSalarySubmit}
          className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          {salary ? (
            <><ChevronRight className="h-4 w-4" /> Get Started</>
          ) : (
            "Skip for now"
          )}
        </button>
        {salary && (
          <button onClick={() => handleSalarySubmit()} className="hidden" aria-hidden />
        )}
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-3">
          You&apos;re all set — this is the last step!
        </p>
      </AuthPage>
    );
  }

  // ── Choose mode ────────────────────────────────────────────

  if (mode === "choose") {
    return (
      <AuthPage>
        <div className="mb-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to Spendly
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Track expenses, set budgets, and take control.
          </p>
        </div>

        <div className="mt-7 space-y-3">
          {/* Google — prominent secondary */}
          <button
            onClick={() => { window.location.href = "/api/auth/google"; }}
            className="group relative flex w-full items-center gap-3.5 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-left transition-all hover:border-gray-300 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-gray-600 dark:hover:shadow-none"
            style={{ animation: "sp-card-in 0.4s ease both", animationDelay: "0.05s" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-700">
              <GoogleIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Continue with Google</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Sign in or create account instantly</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-400 transition-colors dark:text-gray-600 dark:group-hover:text-gray-400" />
          </button>

          {/* OR divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700/80" />
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wide">or</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700/80" />
          </div>

          {/* Create Account — primary CTA */}
          <button
            onClick={() => setMode("register")}
            className="group relative flex w-full items-center gap-4 rounded-2xl p-4 text-left text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #4338ca 50%, #7c3aed 100%)",
              boxShadow: "0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(99,102,241,0.2)",
              animation: "sp-card-in 0.4s ease both",
              animationDelay: "0.12s",
            }}
          >
            {/* Subtle shimmer */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)" }}
            />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base leading-tight">Create Account</div>
              <div className="text-xs text-indigo-200/80 mt-0.5">Start fresh with a new workspace</div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Sign In — secondary */}
          <button
            onClick={() => setMode("login")}
            className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-left transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800/60 dark:hover:border-indigo-700/60 dark:hover:shadow-none"
            style={{ animation: "sp-card-in 0.4s ease both", animationDelay: "0.19s" }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 transition-colors group-hover:bg-indigo-100 dark:bg-indigo-900/30 dark:group-hover:bg-indigo-900/50">
              <LogIn className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Sign In</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Access your existing account</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all dark:text-gray-600" />
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
        onClick={() => { setMode("choose"); setError(""); }}
        className="mb-6 flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {isRegister ? "Create account" : "Welcome back"}
      </h2>
      <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 mb-7">
        {isRegister
          ? "Set up your Spendly account in seconds"
          : "Sign in to continue tracking your finances"}
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (!loading) (isRegister ? handleRegister : handleLogin)(); }}
        className="space-y-3.5"
      >
        {isRegister && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={isRegister ? "Password (min 8 chars)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-11 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800/80 dark:text-white dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
            style={{ WebkitTextSecurity: showPassword ? "none" : undefined } as React.CSSProperties}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/40">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #4338ca 50%, #7c3aed 100%)",
            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
          }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRegister ? "Create Account" : "Sign In"}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 pt-1">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                Create one
              </button>
            </>
          )}
        </p>
      </form>

      {/* OR + Google button */}
      <div className="mt-6 relative flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700/80" />
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wide">or continue with</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700/80" />
      </div>
      <button
        type="button"
        onClick={() => { window.location.href = "/api/auth/google"; }}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/80 dark:hover:border-gray-600"
      >
        <GoogleIcon className="h-4 w-4" />
        Google
      </button>
    </AuthPage>
  );
}
