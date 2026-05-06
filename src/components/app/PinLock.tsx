"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Lock, AlertCircle, Fingerprint, Loader2 } from "lucide-react";
import { useVisualViewport } from "@/hooks/useVisualViewport";

interface PinLockProps {
  onVerify: (pin: string) => Promise<boolean | "locked-out">;
  /**
   * When provided, enables biometric unlock.
   * - Called without a signal: shows the regular modal prompt.
   * - Called with an AbortSignal: uses Conditional UI (passkey in keyboard bar,
   *   no popup). Only triggered when biometricIsConditional is true.
   */
  onBiometricVerify?: (signal?: AbortSignal) => Promise<boolean>;
  /**
   * When true, the browser supports WebAuthn Conditional UI (iOS 16+).
   * PinLock will focus the input immediately so the keyboard is shown and
   * the passkey appears in the QuickType bar — tapping it triggers Face ID
   * with no popup. Falls back to modal on the fingerprint button tap.
   */
  biometricIsConditional?: boolean;
}

const PIN_LENGTH = 4;

export function PinLock({ onVerify, onBiometricVerify, biometricIsConditional }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bioChecking, setBioChecking] = useState(false);
  const [bioError, setBioError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // AbortController for the background conditional-mediation WebAuthn call
  const conditionalAbortRef = useRef<AbortController | null>(null);
  // Track visual viewport so the overlay shrinks above the keyboard
  const { height: vpHeight, keyboardHeight } = useVisualViewport();

  useEffect(() => {
    if (!onBiometricVerify) {
      // No biometric — open the native keyboard straight away.
      inputRef.current?.focus();
      return;
    }

    if (biometricIsConditional) {
      // ── Conditional UI path (iOS 16+ / Chrome 108+) ────────────────────
      // Focus the input so the keyboard appears. The passkey is shown in the
      // keyboard QuickType bar. Tapping it triggers Face ID immediately with
      // no modal/popup — the same UX as native banking apps.
      inputRef.current?.focus();
      const controller = new AbortController();
      conditionalAbortRef.current = controller;
      // Start the background conditional call. It stays pending until the
      // user taps the passkey in the QuickType bar (resolves) or the signal
      // is aborted (e.g. after the user unlocks with PIN instead).
      onBiometricVerify(controller.signal).catch(() => {});
    } else {
      // ── Modal path (iOS 15 and below / unsupported browsers) ───────────
      // Auto-trigger the system sheet 300ms after the overlay renders.
      const t = setTimeout(() => handleBiometric(), 300);
      return () => clearTimeout(t);
    }

    return () => {
      // Abort the conditional call on unmount (PIN unlock or nav away).
      conditionalAbortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      if (value.length !== PIN_LENGTH || checking) return;
      setChecking(true);
      setError(false);
      setLockedOut(false);
      const result = await onVerify(value);
      if (result === "locked-out") {
        setLockedOut(true);
        setPin("");
        setChecking(false);
        inputRef.current?.focus();
      } else if (!result) {
        setError(true);
        setPin("");
        setChecking(false);
        inputRef.current?.focus();
      }
      // If ok, parent will unmount this component
    },
    [onVerify, checking],
  );

  const handleBiometric = useCallback(async () => {
    if (!onBiometricVerify || bioChecking || checking) return;
    // Abort any running conditional call — two concurrent credential.get() calls
    // would conflict. The modal flow replaces the conditional flow here.
    conditionalAbortRef.current?.abort();
    conditionalAbortRef.current = null;
    setBioChecking(true);
    setBioError(false);
    // Called without a signal → uses the regular modal prompt
    const ok = await onBiometricVerify();
    if (!ok) {
      setBioError(true);
      setBioChecking(false);
      // Fall back to PIN — open the keyboard now
      inputRef.current?.focus();
    }
    // If ok, parent unmounts this component
  }, [onBiometricVerify, bioChecking, checking]);

  return (
    // Outer: always covers the FULL screen (fixed inset-0) so the dashboard
    // is never visible behind the overlay, even when the keyboard is open.
    <div
      className="fixed inset-0 z-[999] backdrop-blur-xl"
      style={{ background: "color-mix(in srgb, var(--surface) 95%, transparent)" }}
    >
      {/*
        Inner: constrained to the visible area above the keyboard.
        When the keyboard opens, vpHeight shrinks — this div shrinks with it
        so the content (lock icon, PIN dots, biometric button) sits above
        the keyboard and isn't obscured, while the outer div still covers
        the full screen (including behind the keyboard).
      */}
      <div
        className="flex flex-col items-center gap-8 overflow-y-auto"
        style={{
          height: vpHeight > 0 ? `${vpHeight}px` : "100svh",
          justifyContent: keyboardHeight > 40 ? "flex-start" : "center",
          paddingTop: keyboardHeight > 40
            ? "env(safe-area-inset-top, 16px)"
            : "env(safe-area-inset-top, 0px)",
          paddingBottom: keyboardHeight > 40
            ? "12px"
            : "env(safe-area-inset-bottom, 0px)",
        }}
      >
      {/* Lock icon */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--accent-soft)" }}
      >
        <Lock size={28} style={{ color: "var(--accent)" }} />
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Enter PIN
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Enter your 4-digit PIN to continue
        </p>
      </div>

      {/* PIN dots + invisible native input overlay */}
      <div
        className="relative flex cursor-text flex-col items-center gap-4"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex gap-5">
          {Array.from({ length: PIN_LENGTH }, (_, i) => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition-all duration-200 ${
                error
                  ? "bg-[var(--danger)]"
                  : i < pin.length
                    ? "bg-[var(--accent)] scale-125"
                    : ""
              }`}
              style={
                !error && i >= pin.length
                  ? { background: "var(--border)", transform: "scale(1)" }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Tap hint */}
        <p className="select-none text-xs" style={{ color: "var(--text-tertiary)" }}>
          {pin.length === 0
            ? "Tap here to open keyboard"
            : `${pin.length} of ${PIN_LENGTH} digits entered`}
        </p>

        {/*
          Invisible input positioned over the tap area.
          type="tel" + inputMode="numeric" triggers the phone's native
          numeric keyboard on Android and iOS.
          font-size 16px prevents iOS from auto-zooming on focus.
          opacity-0 keeps it invisible; the dots above provide all visual feedback.
        */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          value={pin}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
            setPin(v);
            setError(false);
            setBioError(false);
            if (v.length === PIN_LENGTH) handleSubmit(v);
          }}
          disabled={checking || lockedOut}
          // "webauthn" tells iOS Safari this input is associated with a passkey,
          // which causes the registered passkey to appear in the keyboard QuickType
          // bar when the conditional WebAuthn call is in-flight.
          autoComplete={biometricIsConditional ? "webauthn" : "off"}
          aria-label="PIN entry"
          className="absolute inset-0 h-full w-full opacity-0"
          style={{ fontSize: "16px" }}
        />
      </div>

      {/* Error / lockout message */}
      <div aria-live="assertive" aria-atomic="true" className="min-h-[20px]">
        {lockedOut && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
            <AlertCircle size={14} />
            <span>Too many attempts. Please wait or re-authenticate.</span>
          </div>
        )}
        {error && !lockedOut && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
            <AlertCircle size={14} />
            <span>Incorrect PIN. Try again.</span>
          </div>
        )}
        {bioError && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--danger)" }}>
            <AlertCircle size={14} />
            <span>Biometric failed. Enter your PIN instead.</span>
          </div>
        )}
      </div>

      {/* Biometric unlock button — only shown when parent passes the handler */}
      {onBiometricVerify && !lockedOut && (
        <button
          onClick={handleBiometric}
          disabled={bioChecking || checking}
          className="flex flex-col items-center gap-2 rounded-2xl px-6 py-4 transition-all active:scale-95 disabled:opacity-50"
          style={{ background: "var(--surface-secondary)" }}
          aria-label="Unlock with biometrics"
        >
          {bioChecking ? (
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
          ) : (
            <Fingerprint size={28} style={{ color: "var(--accent)" }} />
          )}
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {bioChecking ? "Verifying…" : "Use Biometrics"}
          </span>
        </button>
      )}
      </div>{/* end inner content div */}
    </div>
  );
}
