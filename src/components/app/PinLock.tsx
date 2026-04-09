"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Lock, Delete, AlertCircle } from "lucide-react";

interface PinLockProps {
  onVerify: (pin: string) => Promise<boolean>;
}

const PIN_LENGTH = 4;

export function PinLock({ onVerify }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the hidden input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      if (value.length !== PIN_LENGTH || checking) return;
      setChecking(true);
      setError(false);
      const ok = await onVerify(value);
      if (!ok) {
        setError(true);
        setPin("");
        setChecking(false);
        inputRef.current?.focus();
      }
      // If ok, parent will unmount this component
    },
    [onVerify, checking],
  );

  const handleKeypad = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === PIN_LENGTH) {
      handleSubmit(next);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 backdrop-blur-xl"
      style={{ background: "color-mix(in srgb, var(--surface) 95%, transparent)" }}
    >
      {/* Lock icon */}
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--primary-soft)" }}
      >
        <Lock size={28} style={{ color: "var(--primary)" }} />
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Enter PIN
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Enter your 4-digit PIN to continue
        </p>
      </div>

      {/* PIN dots */}
      <div className="flex gap-4">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition-all duration-200 ${
              error
                ? "bg-red-500"
                : i < pin.length
                  ? "bg-[var(--primary)] scale-110"
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

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-sm">
          <AlertCircle size={14} />
          <span>Incorrect PIN. Try again.</span>
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map(
          (key) => {
            if (key === "") return <div key="empty" />;
            if (key === "del") {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  disabled={checking || pin.length === 0}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg transition-colors active:scale-95 disabled:opacity-30"
                  style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                >
                  <Delete size={22} />
                </button>
              );
            }
            return (
              <button
                key={key}
                onClick={() => handleKeypad(key)}
                disabled={checking}
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-semibold transition-colors active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-secondary)", color: "var(--text-primary)" }}
              >
                {key}
              </button>
            );
          },
        )}
      </div>

      {/* Hidden input for keyboard entry */}
      <input
        ref={inputRef}
        type="password"
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
        className="sr-only"
        autoComplete="off"
        aria-label="PIN entry"
      />
    </div>
  );
}
