"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { encryptString, decryptString, hasEncryptionKey } from "@/lib/crypto";

const PIN_STORAGE_KEY = "expenstream-pin-hash";
const PIN_TIMEOUT_KEY = "expenstream-pin-timeout";
const PIN_LAST_ACTIVE_KEY = "expenstream-pin-last-active";

type PinTimeout = 5 | 15 | 30; // minutes

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

async function savePinHash(hash: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (hasEncryptionKey()) {
    const encrypted = await encryptString(hash);
    localStorage.setItem(PIN_STORAGE_KEY, encrypted);
  } else {
    localStorage.setItem(PIN_STORAGE_KEY, hash);
  }
}

function clearPinHash(): void {
  localStorage.removeItem(PIN_STORAGE_KEY);
  localStorage.removeItem(PIN_TIMEOUT_KEY);
  localStorage.removeItem(PIN_LAST_ACTIVE_KEY);
}

function getTimeout(): PinTimeout {
  const raw = localStorage.getItem(PIN_TIMEOUT_KEY);
  const val = parseInt(raw || "", 10);
  if (val === 5 || val === 15 || val === 30) return val;
  return 5;
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
  const [timeout, setTimeoutVal] = useState<PinTimeout>(5);
  const activityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize: check if PIN is set and whether we should lock on load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedHash = await loadPinHash();
      if (cancelled) return;
      if (!storedHash) {
        setIsEnabled(false);
        setIsLocked(false);
        return;
      }
      setIsEnabled(true);
      setTimeoutVal(getTimeout());

      // Check if we should lock (exceeded timeout since last activity)
      const last = getLastActive();
      const timeoutMs = getTimeout() * 60 * 1000;
      if (!last || Date.now() - last > timeoutMs) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
        setLastActive();
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Activity tracking: reset timer on user interaction
  useEffect(() => {
    if (!isEnabled || isLocked) return;

    const resetActivity = () => setLastActive();

    window.addEventListener("pointerdown", resetActivity, { passive: true });
    window.addEventListener("keydown", resetActivity, { passive: true });

    // Check inactivity every 30s
    activityTimer.current = setInterval(() => {
      const last = getLastActive();
      const timeoutMs = getTimeout() * 60 * 1000;
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

  /** Verify a PIN attempt. Returns true if correct. */
  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = await loadPinHash();
    if (!storedHash) return false;
    const inputHash = await hashPin(pin);
    if (inputHash === storedHash) {
      setIsLocked(false);
      setLastActive();
      return true;
    }
    return false;
  }, []);

  /** Set up a new PIN. */
  const setupPin = useCallback(async (pin: string, timeoutMinutes: PinTimeout = 5) => {
    const hash = await hashPin(pin);
    await savePinHash(hash);
    setTimeout_(timeoutMinutes);
    setLastActive();
    setIsEnabled(true);
    setIsLocked(false);
    setTimeoutVal(timeoutMinutes);
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

  return {
    isLocked,
    isEnabled,
    timeout,
    verifyPin,
    setupPin,
    disablePin,
    updateTimeout,
  };
}
