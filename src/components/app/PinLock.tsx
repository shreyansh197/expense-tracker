"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { useVisualViewport } from "@/hooks/useVisualViewport";

interface PinLockProps {
  onVerify: (pin: string) => Promise<boolean | "locked-out">;
}

const PIN_LENGTH = 4;

export function PinLock({ onVerify }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { height: vpHeight, keyboardHeight } = useVisualViewport();

  useEffect(() => {
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

  return (
    // Outer: always covers the FULL screen so the dashboard is never visible
    // behind the overlay, even when the keyboard is open.
    <div
      className="fixed inset-0 z-[999] backdrop-blur-xl"
      style={{ background: "color-mix(in srgb, var(--surface) 95%, transparent)" }}
    >
      {/* Inner: constrained to vpHeight so content sits above the keyboard */}
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

          <p className="select-none text-xs" style={{ color: "var(--text-tertiary)" }}>
            {pin.length === 0
              ? "Tap here to open keyboard"
              : `${pin.length} of ${PIN_LENGTH} digits entered`}
          </p>

          {/*
            Invisible input over the dot area.
            type="tel" + inputMode="numeric" shows the native number pad.
            font-size 16px prevents iOS auto-zoom on focus.
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
        </div>
      </div>
    </div>
  );
}
