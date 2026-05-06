"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Lock, AlertCircle, Fingerprint, Loader2 } from "lucide-react";
import { useVisualViewport } from "@/hooks/useVisualViewport";

interface PinLockProps {
  onVerify: (pin: string) => Promise<boolean | "locked-out">;
  /** When provided, shows a biometric unlock button that calls this function. */
  onBiometricVerify?: () => Promise<boolean>;
}

const PIN_LENGTH = 4;

export function PinLock({ onVerify, onBiometricVerify }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bioChecking, setBioChecking] = useState(false);
  const [bioError, setBioError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track visual viewport so the overlay shrinks above the keyboard
  const { height: vpHeight, keyboardHeight } = useVisualViewport();

  useEffect(() => {
    // Auto-focus triggers the native keyboard on mobile
    inputRef.current?.focus();
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
    setBioChecking(true);
    setBioError(false);
    const ok = await onBiometricVerify();
    if (!ok) {
      setBioError(true);
      setBioChecking(false);
      inputRef.current?.focus();
    }
    // If ok, parent unmounts this component
  }, [onBiometricVerify, bioChecking, checking]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[999] flex flex-col items-center justify-center gap-8 overflow-y-auto backdrop-blur-xl"
      style={{
        // Constrain height to the visible area above the keyboard.
        // When keyboardHeight > 0 (keyboard open): shrink and justify to top
        // so content stays fully visible and not obscured.
        height: vpHeight > 0 ? `${vpHeight}px` : "100dvh",
        // Shift content toward top when keyboard is open so PIN dots are visible
        justifyContent: keyboardHeight > 40 ? "flex-start" : "center",
        paddingTop: keyboardHeight > 40
          ? "env(safe-area-inset-top, 16px)"
          : "env(safe-area-inset-top, 0px)",
        paddingBottom: keyboardHeight > 40
          ? "12px"
          : "env(safe-area-inset-bottom, 0px)",
        background: "color-mix(in srgb, var(--surface) 95%, transparent)",
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
          autoComplete="off"
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
    </div>
  );
}
