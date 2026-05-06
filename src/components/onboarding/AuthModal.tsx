"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
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
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
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

/* ── Animated orbs background (CSS-driven) ────────────────── */
function HeroBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", inset: "-50%",
        background: `
          radial-gradient(ellipse at 20% 50%, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, color-mix(in srgb, var(--secondary) 12%, transparent) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 50%)
        `,
        animation: "sp-mesh 20s ease-in-out infinite alternate",
      }} />
      <div style={{
        position: "absolute", top: "-10%", left: "-8%",
        width: 320, height: 320, borderRadius: "50%",
        background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 70%)",
        animation: "sp-orb-drift 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "-12%",
        width: 280, height: 280, borderRadius: "50%",
        background: "radial-gradient(circle, color-mix(in srgb, var(--secondary) 18%, transparent) 0%, transparent 70%)",
        animation: "sp-orb-drift 15s ease-in-out infinite reverse",
        animationDelay: "2s",
      }} />
      <div style={{
        position: "absolute", bottom: "-12%", left: "20%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 70%)",
        animation: "sp-orb-drift 18s ease-in-out infinite",
        animationDelay: "5s",
      }} />
    </div>
  );
}

/* ── Desktop layout — video background + right form ──────── */
function DesktopAuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="hidden h-screen w-full lg:block" style={{ position: "relative", overflow: "hidden" }}>
      <video
        autoPlay
        muted
        playsInline
        preload="auto"
        src="/ExpenStream.mp4"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center 60%",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to right, transparent 35%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.7) 100%)",
        }}
      />
      <div className="relative z-10 flex min-h-full items-center justify-end pr-[6%] py-10 overflow-y-auto">
        <div className="w-full max-w-sm" style={{ animation: "sp-form-in 0.45s ease both" }}>
          <div className="card-glass rounded-2xl p-8 shadow-2xl">
            {children}
          </div>
          <p className="mt-4 text-center text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
            By continuing, you agree to our Terms of Service.
          </p>
          <div className="mt-2 flex items-center justify-center gap-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span className="flex items-center gap-1 text-overline"><Lock size={10} /> 256-bit encrypted</span>
            <span className="flex items-center gap-1 text-overline"><ShieldCheck size={10} /> No credit card needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile layout — single-screen: brand top + form bottom ── */
function MobileAuthPage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col lg:hidden"
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "var(--background)",
        // Allow overflow so the form can scroll above the keyboard.
        // HeroBackground uses absolute positioning so it won't cause overflow.
        overflow: "visible",
      }}
    >
      <HeroBackground />

      {/* ── Brand header ────────────────────────────────── */}
      <div
        style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 48px)",
          paddingBottom: 32,
        }}
      >
        {/* Logo with glow */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <div style={{
            position: "absolute", inset: -6, borderRadius: 22,
            background: "linear-gradient(135deg, var(--accent, var(--primary)), var(--primary))",
            opacity: 0.25, filter: "blur(14px)",
          }} />
          <div style={{
            position: "relative",
            width: 56, height: 56, borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 6px 24px color-mix(in srgb, var(--primary) 40%, transparent)",
            animation: "sp-card-in 0.4s ease both",
          }}>
            <Image src="/icons/icon-192.png" alt="ExpenStream" width={56} height={56} style={{ display: "block", width: "100%", height: "100%" }} />
          </div>
        </div>

        {/* Brand name */}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem", fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            animation: "sp-card-in 0.4s ease both",
            animationDelay: "0.08s",
          }}
        >
          ExpenStream
        </h1>

        {/* Tagline */}
        <p
          style={{
            marginTop: 10, fontSize: "0.9375rem", fontWeight: 500,
            letterSpacing: "0.01em",
            color: "var(--text-secondary)",
            animation: "sp-card-in 0.4s ease both",
            animationDelay: "0.14s",
          }}
        >
          Know where every rupee goes.
        </p>

        {/* Feature proof chips */}
        <div
          style={{
            display: "flex", gap: 8, marginTop: 20,
            animation: "sp-card-in 0.4s ease both",
            animationDelay: "0.2s",
          }}
        >
          {["📊 Smart analytics", "🔄 Multi-device sync", "🎯 Budget tracking"].map((f) => (
            <span
              key={f}
              style={{
                fontSize: "0.7rem", fontWeight: 500,
                padding: "4px 10px",
                borderRadius: 99,
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                color: "var(--text-secondary)",
                border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                whiteSpace: "nowrap",
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── Form card — bottom section ──────────────────── */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ flex: 1, minHeight: 8 }} />
        <div
          className="card-terrain rounded-t-3xl px-6 pt-7 pb-8 shadow-2xl"
          style={{
            paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))",
            animation: "sp-card-in 0.45s ease both",
            animationDelay: "0.2s",
            borderTop: "1px solid var(--border-subtle, var(--border))",
          }}
        >
          {children}
          <p className="mt-4 text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            By continuing, you agree to our Terms of Service.
          </p>
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <Lock size={12} />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Combined wrapper — renders both, CSS toggles visibility ── */
function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopAuthPage>{children}</DesktopAuthPage>
      <MobileAuthPage>{children}</MobileAuthPage>
    </>
  );
}

export function AuthModal({
  onComplete,
  initialMode = "register",
}: AuthModalProps) {
  const [mode, setMode] = useState<"choose" | "register" | "login" | "totp" | "forgot">(
    initialMode === "join" ? "login" : "choose",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [salary, setSalary] = useState("");
  const [showSalary, setShowSalary] = useState(false);
  const [pendingChallengeToken, setPendingChallengeToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { symbol } = useCurrency();
  const searchParams = useSearchParams();

  const { login, loginWith2FA, register } = useAuth();

  // Surface OAuth error from URL params (e.g. /?error=oauth_state_mismatch)
  useEffect(() => {
    const oauthError = searchParams.get("error");
    const detail = searchParams.get("detail");
    if (!oauthError) return;
    const messages: Record<string, string> = {
      google_not_configured: "Google sign-in is not configured. Please contact support.",
      google_denied: "Google sign-in was cancelled.",
      oauth_state_mismatch: "Security check failed. Please try signing in again.",
      oauth_no_code: "Google did not return an authorization code. Please try again.",
      oauth_token_exchange: "Could not complete Google sign-in. Please try again.",
      oauth_user_info: "Could not retrieve your Google profile. Please try again.",
      oauth_internal: detail
        ? `Sign-in error: ${detail}. Please try again or contact support.`
        : "An internal error occurred during sign-in. Please try again.",
      oauth_exchange: "Could not finalize sign-in. Please try again.",
    };
    setError(messages[oauthError] ?? `Sign-in error (${oauthError}). Please try again.`);
    // Clean the error from the URL without triggering a navigation
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("detail");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams]);

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

    if (result.requires2FA && result.challengeToken) {
      setPendingChallengeToken(result.challengeToken);
      setTotpCode("");
      setError("");
      setMode("totp");
      return;
    }

    onComplete();
  };

  const handleVerify2FA = async () => {
    if (!pendingChallengeToken || totpCode.length !== 6) return;

    setError("");
    setLoading(true);
    const result = await loginWith2FA(pendingChallengeToken, totpCode);
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

  // ── Forgot password step ────────────────────────────────────

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setForgotSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "forgot") {
    return (
      <AuthPage>
        <button
          onClick={() => { setMode("login"); setError(""); setForgotSent(false); }}
          className="mb-6 -ml-2 flex items-center gap-1.5 rounded-lg py-2 pl-2 pr-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </button>

        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--secondary-soft)', boxShadow: 'inset 0 0 0 1px var(--secondary-border)' }}>
          <Mail className="h-5 w-5" style={{ color: 'var(--secondary-text)' }} />
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Forgot password?
        </h2>
        <p className="mt-1.5 text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
          {forgotSent
            ? "Check your inbox for a password reset link."
            : "Enter your email and we\u2019ll send you a reset link."}
        </p>

        {forgotSent ? (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-sm border text-center leading-relaxed" style={{ background: 'var(--success-soft)', color: 'var(--success-text)', borderColor: 'var(--goal-achieved-border)' }}>
              If an account exists for <strong className="break-all">{email}</strong>, you&apos;ll receive an email with a reset link shortly.
            </div>
            <button
              onClick={() => { setMode("login"); setForgotSent(false); setError(""); }}
              className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 50%, var(--accent) 100%)",
                boxShadow: "0 6px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
              }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (!loading) handleForgotPassword(); }}
            className="space-y-3.5"
          >
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                className="w-full rounded-2xl py-4 pl-10 pr-4 text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:border-[var(--primary)]"
                style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl p-3.5 text-sm border" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}>
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 50%, var(--accent) 100%)",
                boxShadow: "0 6px 20px color-mix(in srgb, var(--primary) 35%, transparent)",
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Reset Link
            </button>
          </form>
        )}
      </AuthPage>
    );
  }

  // ── TOTP verification step ─────────────────────────────────

  if (mode === "totp") {
    return (
      <AuthPage>
        <button
          onClick={() => { setMode("login"); setError(""); setPendingChallengeToken(null); setTotpCode(""); }}
          className="mb-6 -ml-2 flex items-center gap-1.5 rounded-lg py-2 pl-2 pr-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'var(--secondary-soft)', boxShadow: 'inset 0 0 0 1px var(--secondary-border)' }}>
          <Shield className="h-5 w-5" style={{ color: 'var(--secondary-text)' }} />
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Two-Factor Auth
        </h2>
        <p className="mt-1.5 text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
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
            className="w-full rounded-2xl py-4 text-center font-mono text-2xl tracking-[0.5em] transition-all placeholder:tracking-normal focus:outline-none focus:ring-2"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify2FA(); }}
          />

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl p-3.5 text-sm border" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}>
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleVerify2FA}
            disabled={totpCode.length !== 6 || loading}
            className="w-full rounded-2xl py-3.5 text-base font-semibold text-white hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent)",
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Verify &amp; Sign In
          </button>

          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
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
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl ring-1" style={{ backgroundColor: "var(--auth-badge-bg)", boxShadow: "inset 0 0 0 1px var(--auth-badge-ring)" }}>
          <Sparkles className="h-5 w-5" style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Set your budget
        </h2>
        <p className="mt-1.5 text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
          Enter your monthly income or budget. You can change this anytime in Settings.
        </p>

        <div className="relative mb-5">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-lg font-semibold" style={{ color: 'var(--text-muted)' }}>{symbol}</span>
          </div>
          <input
            type="number"
            inputMode="numeric"
            placeholder="50,000"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleSalarySubmit(); }}
            className="w-full rounded-2xl py-4 pl-10 pr-4 text-xl font-semibold transition-all placeholder:font-normal focus:outline-none focus:ring-2"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
          />
        </div>

        <button
          onClick={handleSalarySubmit}
          className="w-full rounded-2xl py-3.5 text-base font-semibold text-white hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 25%, transparent)",
          }}
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
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
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
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome to ExpenStream
          </h2>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Your finances, beautifully organized.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm border" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}>
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-7 space-y-3">
          {/* Create Account — primary CTA (top) */}
          <button
            onClick={() => setMode("register")}
            className="group relative flex w-full items-center gap-4 rounded-2xl p-4 text-left text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--accent, var(--primary)) 0%, var(--primary) 50%, var(--primary-hover) 100%)",
              boxShadow: "0 8px 24px color-mix(in srgb, var(--primary) 40%, transparent), 0 2px 8px color-mix(in srgb, var(--primary-hover) 25%, transparent)",
              animation: "sp-card-in 0.4s ease both",
              animationDelay: "0.05s",
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%)" }}
            />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base leading-tight">Create Account</div>
              <div className="text-xs text-white/70 mt-0.5">Start fresh in seconds</div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Sign In — secondary */}
          <button
            onClick={() => setMode("login")}
            className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left transition-all hover:border-[color-mix(in_srgb,var(--primary)_30%,var(--surface))] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ animation: "sp-card-in 0.4s ease both", animationDelay: "0.12s" }}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors" style={{ background: 'var(--secondary-soft)' }}>
              <LogIn className="h-5 w-5" style={{ color: 'var(--secondary-text)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>Sign In</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Access your existing account</div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* OR divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>or</span>
            <div className="flex-1" style={{ borderTop: '1px solid var(--border)' }} />
          </div>

          {/* Google — social option (bottom) */}
          <button
            onClick={() => { window.location.href = "/api/auth/google"; }}
            className="group relative flex w-full items-center gap-3.5 rounded-2xl border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 text-left transition-all hover:border-[var(--border-strong)] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ animation: "sp-card-in 0.4s ease both", animationDelay: "0.19s" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <GoogleIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Continue with Google</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>One tap to get started</div>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-80 transition-opacity" style={{ color: 'var(--text-muted)' }} />
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
        className="mb-6 -ml-2 flex items-center gap-1.5 rounded-lg py-2 pl-2 pr-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
        {isRegister ? "Create account" : "Welcome back"}
      </h2>
      <p className="mt-1.5 text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
        {isRegister
          ? "Set up your ExpenStream account in seconds"
          : "Sign in to continue tracking your finances"}
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (!loading) (isRegister ? handleRegister : handleLogin)(); }}
        className="space-y-3.5"
      >
        {isRegister && (
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl py-4 pl-10 pr-4 text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:border-[var(--primary)]"
              style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-2xl py-4 pl-10 pr-4 text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:border-[var(--primary)]"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder={isRegister ? "Min 8 characters" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full rounded-2xl py-4 pl-10 pr-12 text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:border-[var(--primary)] [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
            style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--primary)', WebkitTextSecurity: showPassword ? "none" : undefined } as React.CSSProperties}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {!isRegister && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(""); setForgotSent(false); }}
              className="rounded-lg px-2 py-1 text-xs font-medium hover:underline hover:bg-[var(--surface-secondary)] transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl p-3.5 text-sm border" style={{ background: 'var(--danger-soft)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}>
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl py-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          style={{
            background: "linear-gradient(135deg, var(--accent, var(--primary)) 0%, var(--primary) 50%, var(--primary-hover) 100%)",
            boxShadow: "0 6px 20px color-mix(in srgb, var(--primary) 40%, transparent)",
          }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isRegister ? "Create Account" : "Sign In"}
        </button>

        <p className="text-center text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }}
                className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }}
                className="font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                Create one
              </button>
            </>
          )}
        </p>
      </form>

      {/* Google shortcut */}
      <button
        type="button"
        onClick={() => { window.location.href = "/api/auth/google"; }}
        className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-medium transition-all hover:shadow-sm hover:border-[var(--border-strong)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </button>
    </AuthPage>
  );
}
