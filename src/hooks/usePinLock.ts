"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { encryptString, decryptString, hasEncryptionKey } from "@/lib/crypto";

const PIN_STORAGE_KEY = "expenstream-pin-hash";
const PIN_TIMEOUT_KEY = "expenstream-pin-timeout";
const PIN_LAST_ACTIVE_KEY = "expenstream-pin-last-active";
const PIN_ATTEMPTS_KEY = "expenstream-pin-attempts";
const PIN_LOCKOUT_UNTIL_KEY = "expenstream-pin-lockout-until";

// Timeout values stored and compared in seconds
type PinTimeout = 30 | 60 | 300 | 600; // 30s | 1min | 5min | 10min

const MAX_ATTEMPTS_BEFORE_COOLDOWN = 3;
const COOLDOWN_MS = 30_000; // 30 seconds after 3 failures
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 10;

// ── SHA-256 hash of PIN (never store plaintext) ──

async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin);
  const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Storage helpers (encrypted if key available) ──

async function loadPinHash(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PIN_STORAGE_KEY);
  if (!raw) return null;
  if (raw.startsWith("enc:")) {
    try {
      return await decryptString(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function broadcastPinChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("expenstream:pin-changed"));
  }
}

async function savePinHash(hash: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (hasEncryptionKey()) {
    const encrypted = await encryptString(hash);
    localStorage.setItem(PIN_STORAGE_KEY, encrypted);
  } else {
    localStorage.setItem(PIN_STORAGE_KEY, hash);
  }
  broadcastPinChange();
}

function clearPinHash(): void {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(PIN_TIMEOUT_KEY);
  localStorage.removeItem(PIN_LAST_ACTIVE_KEY);
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  localStorage.removeItem(PIN_LOCKOUT_UNTIL_KEY);
  broadcastPinChange();
}

function getAttempts(): number {
  return parseInt(localStorage.getItem(PIN_ATTEMPTS_KEY) || "0", 10);
}

function setAttempts(n: number): void {
  localStorage.setItem(PIN_ATTEMPTS_KEY, String(n));
}

function getLockoutUntil(): number {
  return parseInt(localStorage.getItem(PIN_LOCKOUT_UNTIL_KEY) || "0", 10);
}

function setLockoutUntil(ts: number): void {
  localStorage.setItem(PIN_LOCKOUT_UNTIL_KEY, String(ts));
}

function resetAttempts(): void {
  localStorage.removeItem(PIN_ATTEMPTS_KEY);
  localStorage.removeItem(PIN_LOCKOUT_UNTIL_KEY);
}

function getTimeout(): PinTimeout {
  const raw = localStorage.getItem(PIN_TIMEOUT_KEY);
  const val = parseInt(raw || "", 10);
  if (val === 30 || val === 60 || val === 300 || val === 600) return val;
  return 300; // default: 5 minutes
}

function setTimeout_(minutes: PinTimeout): void {
  localStorage.setItem(PIN_TIMEOUT_KEY, String(minutes));
}

function getLastActive(): number {
  return parseInt(localStorage.getItem(PIN_LAST_ACTIVE_KEY) || "0", 10);
}

function setLastActive(): void {
  localStorage.setItem(PIN_LAST_ACTIVE_KEY, String(Date.now()));
}

// ── Hook ──

export function usePinLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [timeout, setTimeoutVal] = useState<PinTimeout>(300);
  const activityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const initFromStorage = useCallback(async () => {
    const storedHash = await loadPinHash();
    if (!storedHash) {
      setIsEnabled(false);
      setIsLocked(false);
      return;
    }
    setIsEnabled(true);
    setTimeoutVal(getTimeout());
    const last = getLastActive();
    const timeoutMs = getTimeout() * 1000;
    if (!last || Date.now() - last > timeoutMs) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
      setLastActive();
    }
  }, []);

  // Initialize: check if PIN is set and whether we should lock on load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await initFromStorage();
    })();
    return () => { cancelled = true; };
  }, [initFromStorage]);

  // Re-sync when another hook instance changes pin state (e.g. Settings → AppShell)
  useEffect(() => {
    const handler = () => { initFromStorage(); };
    window.addEventListener("expenstream:pin-changed", handler);
    return () => window.removeEventListener("expenstream:pin-changed", handler);
  }, [initFromStorage]);

  // Activity tracking: reset timer on user interaction
  useEffect(() => {
    if (!isEnabled || isLocked) return;

    const resetActivity = () => setLastActive();

    window.addEventListener("pointerdown", resetActivity, { passive: true });
    window.addEventListener("keydown", resetActivity, { passive: true });

    // Check inactivity every 10s (short enough to catch 30s timeout)
    activityTimer.current = setInterval(() => {
      const last = getLastActive();
      const timeoutMs = getTimeout() * 1000;
      if (last && Date.now() - last > timeoutMs) {
        setIsLocked(true);
      }
    }, 30_000);

    return () => {
      window.removeEventListener("pointerdown", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      if (activityTimer.current) clearInterval(activityTimer.current);
    };
  }, [isEnabled, isLocked]);

  /** Verify a PIN attempt. Returns true if correct, false if wrong, or "locked-out" string. */
  const verifyPin = useCallback(async (pin: string): Promise<boolean | "locked-out"> => {
    // Check lockout
    const lockoutUntil = getLockoutUntil();
    if (lockoutUntil && Date.now() < lockoutUntil) {
      return "locked-out";
    }

    // Check permanent lockout (10+ attempts)
    const attempts = getAttempts();
    if (attempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      return "locked-out";
    }

    const storedHash = await loadPinHash();
    if (!storedHash) return false;
    const inputHash = await hashPin(pin);
    if (inputHash === storedHash) {
      setIsLocked(false);
      setLastActive();
      resetAttempts();
      return true;
    }

    // Failed attempt
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
      // Permanent lockout — require full re-auth
      setLockoutUntil(Number.MAX_SAFE_INTEGER);
    } else if (newAttempts >= MAX_ATTEMPTS_BEFORE_COOLDOWN) {
      // Progressive cooldown: 30s * (attempts - 2)
      const cooldown = COOLDOWN_MS * (newAttempts - MAX_ATTEMPTS_BEFORE_COOLDOWN + 1);
      setLockoutUntil(Date.now() + cooldown);
    }
    return false;
  }, []);

  /** Set up a new PIN. */
  const setupPin = useCallback(async (pin: string, timeoutSeconds: PinTimeout = 300) => {
    const hash = await hashPin(pin);
    await savePinHash(hash);
    setTimeout_(timeoutSeconds);
    setLastActive();
    setIsEnabled(true);
    setIsLocked(false);
    setTimeoutVal(timeoutSeconds);
  }, []);

  /** Disable PIN lock. */
  const disablePin = useCallback(() => {
    clearPinHash();
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  /** Update the inactivity timeout. */
  const updateTimeout = useCallback((minutes: PinTimeout) => {
    setTimeout_(minutes);
    setTimeoutVal(minutes);
  }, []);

  /** Unlock without PIN verification — used by biometric unlock after server-side assertion succeeds. */
  const unlock = useCallback(() => {
    setIsLocked(false);
    setLastActive();
  }, []);

  return {
    isLocked,
    isEnabled,
    timeout,
    verifyPin,
    setupPin,
    disablePin,
    updateTimeout,
    unlock,
  };
}
