"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/authClient";

const BIOMETRIC_ENABLED_KEY = "expenstream-biometric-enabled";
const BIOMETRIC_CREDENTIAL_KEY = "expenstream-biometric-credential-id";
const BIOMETRIC_TRANSPORTS_KEY = "expenstream-biometric-transports";

// ── Base64url helpers ─────────────────────────────────────────

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// ── Credential serialization ──────────────────────────────────

function credentialToJson(
  credential: PublicKeyCredential,
): Record<string, unknown> {
  const response = credential.response as
    | AuthenticatorAssertionResponse
    | AuthenticatorAttestationResponse;

  const base: Record<string, unknown> = {
    id: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    type: credential.type,
  };

  if ("attestationObject" in response) {
    // Registration response
    const att = response as AuthenticatorAttestationResponse;
    base.response = {
      clientDataJSON: bufferToBase64url(att.clientDataJSON),
      attestationObject: bufferToBase64url(att.attestationObject),
      // Include transports if available (helps server store them correctly)
      transports:
        typeof att.getTransports === "function" ? att.getTransports() : [],
    };
  } else {
    // Authentication response
    const asr = response as AuthenticatorAssertionResponse;
    base.response = {
      clientDataJSON: bufferToBase64url(asr.clientDataJSON),
      authenticatorData: bufferToBase64url(asr.authenticatorData),
      signature: bufferToBase64url(asr.signature),
      userHandle: asr.userHandle ? bufferToBase64url(asr.userHandle) : null,
    };
  }

  return base;
}

// ── Hook ─────────────────────────────────────────────────────

export interface BiometricLockState {
  /** True when the device has a platform authenticator (fingerprint / Face ID). */
  isAvailable: boolean;
  /** True when the user has registered a passkey for app-lock. */
  isEnabled: boolean;
  /**
   * True when the browser supports WebAuthn Conditional UI (iOS 16+, Chrome 108+).
   * When true, passkeys appear in the keyboard QuickType bar — tapping one
   * triggers Face ID/fingerprint immediately without any modal popup.
   */
  isConditionalSupported: boolean;
  /** Busy while registering a new passkey. */
  registering: boolean;
  /** Busy while verifying the biometric prompt. */
  verifying: boolean;
  /** Register a platform passkey for app-lock biometric unlock. */
  register: () => Promise<{ ok: boolean; error?: string }>;
  /**
   * Trigger biometric verification.
   * - Without signal: shows the regular modal prompt (works on all platforms).
   * - With signal (and isConditionalSupported): uses Conditional UI — the passkey
   *   appears in the keyboard bar, Face ID runs on tap with no popup.
   *   Abort the signal to cancel (e.g. when the user unlocks via PIN instead).
   */
  verify: (signal?: AbortSignal) => Promise<boolean>;
  /** Remove biometric unlock (clears local storage + disables). */
  unregister: () => void;
}

export function useBiometricLock(): BiometricLockState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConditionalSupported, setIsConditionalSupported] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // On mount: check platform authenticator support and whether it's enabled
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      if (
        typeof PublicKeyCredential === "undefined" ||
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !==
          "function"
      )
        return;
      try {
        const available =
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (cancelled) return;
        setIsAvailable(available);
        if (available) {
          setIsEnabled(
            localStorage.getItem(BIOMETRIC_ENABLED_KEY) === "1" &&
              !!localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY),
          );
          // Check for Conditional UI support (iOS 16+, Chrome 108+)
          // This allows passkeys to appear in the keyboard QuickType bar,
          // triggering Face ID directly without any modal popup.
          const conditionalCheck =
            (PublicKeyCredential as { isConditionalMediationAvailable?: () => Promise<boolean> })
              .isConditionalMediationAvailable;
          if (typeof conditionalCheck === "function") {
            try {
              const supported = await conditionalCheck();
              if (!cancelled) setIsConditionalSupported(supported);
            } catch { /* not supported */ }
          }
        }
      } catch {
        // Browser doesn't support WebAuthn
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Register the device's platform authenticator as an app-lock passkey.
   * Reuses the existing /api/auth/passkey/register-* endpoints.
   * Returns { ok: true } on success, or { ok: false, error: "reason" }.
   */
  const register = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (registering) return { ok: false, error: "Already registering" };
    setRegistering(true);
    try {
      // 1. Get registration options (challenge) from server
      const optRes = await authFetch("/api/auth/passkey/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!optRes.ok) {
        const body = await optRes.json().catch(() => ({}));
        return { ok: false, error: body?.error ?? `Server error ${optRes.status}` };
      }

      const options = await optRes.json();

      // 2. Convert base64url fields to ArrayBuffers for the browser API
      options.challenge = base64urlToBuffer(options.challenge);
      options.user.id = base64urlToBuffer(options.user.id);

      // ── Key fix #1 ───────────────────────────────────────────────────────
      // Clear excludeCredentials for app-lock registration.
      // The server excludes all existing passkeys to prevent duplicates during
      // login-passkey registration. But for app-lock we intentionally need to
      // register even if a login passkey already exists on this device.
      // Without this, iOS/Android refuse registration with InvalidStateError.
      options.excludeCredentials = [];
      // ────────────────────────────────────────────────────────────────────

      // 3. Trigger the OS biometric enrollment dialog
      let credential: PublicKeyCredential;
      try {
        const created = await navigator.credentials.create({
          publicKey: {
            ...options,
            // Force platform authenticator (fingerprint / Face ID / Windows Hello)
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "preferred",
            },
          },
        });
        if (!created) return { ok: false, error: "No credential returned" };
        credential = created as PublicKeyCredential;
      } catch (err) {
        const name = (err as DOMException)?.name ?? "UnknownError";
        const msg = (err as DOMException)?.message ?? String(err);
        // NotAllowedError = user cancelled or timed out
        // InvalidStateError = credential already exists (should not happen after fix #1)
        // NotSupportedError = platform authenticator not available
        return { ok: false, error: `${name}: ${msg}` };
      }

      // ── Key fix #2 ───────────────────────────────────────────────────────
      // Store the transports reported by the authenticator.
      // These are needed later in verify() so the browser/OS can find the
      // credential. Hardcoding ["internal"] breaks Android (hybrid transport)
      // and some iOS configurations.
      const att = credential.response as AuthenticatorAttestationResponse;
      const transports: string[] =
        typeof att.getTransports === "function" ? att.getTransports() : [];
      // ────────────────────────────────────────────────────────────────────

      // 4. Send credential to server for verification + storage
      const verifyRes = await authFetch("/api/auth/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: credentialToJson(credential),
          deviceName: "Biometric App Lock",
        }),
      });
      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        return { ok: false, error: body?.error ?? `Verify failed ${verifyRes.status}` };
      }

      // 5. Persist locally so we know which credential + transports to use for unlock
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, credential.id);
      localStorage.setItem(BIOMETRIC_TRANSPORTS_KEY, JSON.stringify(transports));
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, "1");
      setIsEnabled(true);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: String(err) };
    } finally {
      setRegistering(false);
    }
  }, [registering]);

  /**
   * Verify the device biometric to unlock the app.
   *
   * Two modes depending on whether an AbortSignal is passed:
   *
   * 1. No signal (modal mode): Immediately shows the "Use Passkey" system sheet.
   *    User taps Continue → Face ID/fingerprint runs. Works on all platforms.
   *
   * 2. With signal (conditional mode, iOS 16+ / Chrome 108+): Uses
   *    WebAuthn Conditional UI. The passkey silently appears in the keyboard
   *    QuickType bar — tapping it triggers Face ID with zero popup/modal.
   *    Abort the signal when the user unlocks via PIN so the pending call
   *    is cleaned up.
   */
  const verify = useCallback(async (signal?: AbortSignal): Promise<boolean> => {
    const credentialId = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
    if (!credentialId || verifying) return false;

    // ── Key fix #3 ─────────────────────────────────────────────────────────
    // Retrieve the transports that were recorded during registration.
    // Using stored transports (instead of hardcoded ["internal"]) ensures the
    // browser/OS can locate the credential on Android (which may use "hybrid")
    // and various iOS configurations.
    let storedTransports: AuthenticatorTransport[] | undefined;
    try {
      const raw = localStorage.getItem(BIOMETRIC_TRANSPORTS_KEY);
      if (raw) storedTransports = JSON.parse(raw);
    } catch { /* ignore */ }
    // ───────────────────────────────────────────────────────────────────────

    setVerifying(true);
    try {
      // 1. Get a fresh challenge from the server
      const optRes = await authFetch("/api/auth/passkey/login-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!optRes.ok) return false;

      const options = await optRes.json();
      options.challenge = base64urlToBuffer(options.challenge);

      // Scope to only our registered app-lock credential.
      // Use stored transports; omit the field entirely if none stored so the
      // browser tries all available transports (safest fallback).
      const allowEntry: PublicKeyCredentialDescriptor = {
        id: base64urlToBuffer(credentialId),
        type: "public-key",
      };
      if (storedTransports && storedTransports.length > 0) {
        allowEntry.transports = storedTransports;
      }
      options.allowCredentials = [allowEntry];
      options.userVerification = "required";

      // 2. Trigger the OS biometric prompt
      let assertion: PublicKeyCredential;
      try {
        // Conditional UI: passkey appears in keyboard QuickType bar, no modal.
        // Regular (no signal): shows the system "Use Passkey" modal sheet.
        const getOptions: CredentialRequestOptions = { publicKey: options };
        if (signal && isConditionalSupported) {
          getOptions.mediation = "conditional";
          getOptions.signal = signal;
        }
        const result = await navigator.credentials.get(getOptions);
        if (!result) return false;
        assertion = result as PublicKeyCredential;
      } catch (err) {
        // AbortError is expected when the signal fires (user typed PIN)
        if ((err as DOMException)?.name === "AbortError") return false;
        // User cancelled or biometric failed
        return false;
      }

      // 3. Verify with the app-lock endpoint (no new tokens issued)
      const verifyRes = await authFetch("/api/auth/passkey/app-lock-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentialToJson(assertion)),
      });

      if (!verifyRes.ok) return false;
      const data = await verifyRes.json();
      return data.ok === true;
    } catch {
      return false;
    } finally {
      setVerifying(false);
    }
  }, [verifying, isConditionalSupported]);

  /** Disable biometric unlock and remove local state. */
  const unregister = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
    localStorage.removeItem(BIOMETRIC_TRANSPORTS_KEY);
    setIsEnabled(false);
  }, []);

  return { isAvailable, isEnabled, isConditionalSupported, registering, verifying, register, verify, unregister };
}
