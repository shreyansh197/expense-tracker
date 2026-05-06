"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/authClient";

const BIOMETRIC_ENABLED_KEY = "expenstream-biometric-enabled";
const BIOMETRIC_CREDENTIAL_KEY = "expenstream-biometric-credential-id";

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
  /** Busy while registering a new passkey. */
  registering: boolean;
  /** Busy while verifying the biometric prompt. */
  verifying: boolean;
  /** Register a platform passkey for app-lock biometric unlock. */
  register: () => Promise<boolean>;
  /** Trigger biometric prompt and verify against the server. Returns true on success. */
  verify: () => Promise<boolean>;
  /** Remove biometric unlock (clears local storage + disables). */
  unregister: () => void;
}

export function useBiometricLock(): BiometricLockState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
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
   * Returns true on success.
   */
  const register = useCallback(async (): Promise<boolean> => {
    if (registering) return false;
    setRegistering(true);
    try {
      // 1. Get registration options (challenge) from server
      const optRes = await authFetch("/api/auth/passkey/register-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!optRes.ok) return false;

      const options = await optRes.json();

      // 2. Convert base64url fields to ArrayBuffers for the browser API
      options.challenge = base64urlToBuffer(options.challenge);
      options.user.id = base64urlToBuffer(options.user.id);
      if (Array.isArray(options.excludeCredentials)) {
        options.excludeCredentials = options.excludeCredentials.map(
          (c: { id: string; type: string; transports?: string[] }) => ({
            ...c,
            id: base64urlToBuffer(c.id),
          }),
        );
      }

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
        if (!created) return false;
        credential = created as PublicKeyCredential;
      } catch {
        // User cancelled or biometric unavailable
        return false;
      }

      // 4. Send credential to server for verification + storage
      const verifyRes = await authFetch(
        "/api/auth/passkey/register-verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: credentialToJson(credential),
            deviceName: "Biometric App Lock",
          }),
        },
      );
      if (!verifyRes.ok) return false;

      // 5. Persist locally so we know which credential to use for unlock
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, credential.id);
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, "1");
      setIsEnabled(true);
      return true;
    } catch {
      return false;
    } finally {
      setRegistering(false);
    }
  }, [registering]);

  /**
   * Verify the device biometric to unlock the app.
   * Gets a fresh challenge, presents the OS biometric prompt scoped to the
   * registered credential, then verifies with /api/auth/passkey/app-lock-verify.
   * Returns true on success (parent component should unlock the app).
   */
  const verify = useCallback(async (): Promise<boolean> => {
    const credentialId = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
    if (!credentialId || verifying) return false;

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

      // Scope to only our registered app-lock credential
      options.allowCredentials = [
        {
          id: base64urlToBuffer(credentialId),
          type: "public-key",
          transports: ["internal"] as AuthenticatorTransport[],
        },
      ];
      options.userVerification = "required";

      // 2. Trigger the OS biometric prompt
      let assertion: PublicKeyCredential;
      try {
        const result = await navigator.credentials.get({
          publicKey: options,
        });
        if (!result) return false;
        assertion = result as PublicKeyCredential;
      } catch {
        // User cancelled or biometric failed
        return false;
      }

      // 3. Verify with the app-lock endpoint (no new tokens issued)
      const verifyRes = await authFetch(
        "/api/auth/passkey/app-lock-verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentialToJson(assertion)),
        },
      );

      if (!verifyRes.ok) return false;
      const data = await verifyRes.json();
      return data.ok === true;
    } catch {
      return false;
    } finally {
      setVerifying(false);
    }
  }, [verifying]);

  /** Disable biometric unlock and remove local state. */
  const unregister = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
    setIsEnabled(false);
  }, []);

  return { isAvailable, isEnabled, registering, verifying, register, verify, unregister };
}
