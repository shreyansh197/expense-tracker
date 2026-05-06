"use client";

import { useState } from "react";
import { usePinLock } from "@/hooks/usePinLock";
import { useBiometricLock } from "@/hooks/useBiometricLock";
import { useToast } from "@/components/ui/Toast";
import { Fingerprint, Loader2, CheckCircle2 } from "lucide-react";

/** PIN Lock settings UI — embedded in Security section */
export function PinLockSettings() {
  const { isEnabled, timeout, setupPin, disablePin, updateTimeout } = usePinLock();
  const biometric = useBiometricLock();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"idle" | "setup" | "confirm">("idle");
  const { toast } = useToast();

  const handleBiometricToggle = async () => {
    if (biometric.isEnabled) {
      biometric.unregister();
      toast("Biometric unlock disabled");
    } else {
      const ok = await biometric.register();
      if (ok) {
        toast("Biometric unlock enabled");
      } else {
        toast("Biometric registration failed or was cancelled");
      }
    }
  };

  const handleSetup = () => {
    if (step === "idle") {
      setStep("setup");
      return;
    }
    if (step === "setup") {
      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        toast("PIN must be exactly 4 digits");
        return;
      }
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (confirmPin !== newPin) {
        toast("PINs don't match. Try again.");
        setConfirmPin("");
        setStep("setup");
        return;
      }
      setupPin(newPin, timeout);
      setNewPin("");
      setConfirmPin("");
      setStep("idle");
      toast("PIN lock enabled");
    }
  };

  const handleDisable = () => {
    disablePin();
    toast("PIN lock disabled");
  };

  return (
    <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            App PIN Lock
          </h4>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Require a PIN to access the app after inactivity
          </p>
        </div>
        {isEnabled && (
          <button
            onClick={handleDisable}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-err hover:bg-err-soft"
          >
            Disable
          </button>
        )}
      </div>

      {isEnabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              Lock after
            </label>
            <select
              value={timeout}
              onChange={(e) => updateTimeout(Number(e.target.value) as 30 | 60 | 300 | 600)}
              className="rounded-lg border px-2 py-1 text-xs font-medium"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
              <option value={300}>5 minutes</option>
              <option value={600}>10 minutes</option>
            </select>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>of inactivity</span>
          </div>
          <p className="text-xs rounded-lg p-2" style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}>
            PIN lock is active. The app will ask for your PIN after{" "}
            {timeout < 60 ? `${timeout} seconds` : `${timeout / 60} minute${timeout / 60 !== 1 ? "s" : ""}`}{" "}
            of inactivity.
          </p>

          {/* Biometric unlock — only shown when the device supports it */}
          {biometric.isAvailable && (
            <div
              className="flex items-center justify-between rounded-lg p-3"
              style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2">
                <Fingerprint size={16} style={{ color: "var(--accent)" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    Biometric Unlock
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Use fingerprint or Face ID instead of PIN
                  </p>
                </div>
              </div>
              <button
                onClick={handleBiometricToggle}
                disabled={biometric.registering}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
                style={{
                  background: biometric.isEnabled ? "var(--success-soft)" : "var(--surface)",
                  color: biometric.isEnabled ? "var(--success-text)" : "var(--text-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                {biometric.registering ? (
                  <><Loader2 size={12} className="animate-spin" /> Registering…</>
                ) : biometric.isEnabled ? (
                  <><CheckCircle2 size={12} /> Enabled</>
                ) : (
                  "Enable"
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {step !== "idle" && (
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={step === "setup" ? "Enter 4-digit PIN" : "Confirm PIN"}
                value={step === "setup" ? newPin : confirmPin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (step === "setup") setNewPin(v);
                  else setConfirmPin(v);
                }}
                autoFocus
                className="w-full rounded-xl border py-2.5 px-3 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                {step === "setup" ? "Choose a 4-digit PIN" : "Re-enter your PIN to confirm"}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSetup}
              className="btn-primary btn-md"
            >
              {step === "idle" ? "Set Up PIN" : step === "setup" ? "Next" : "Confirm"}
            </button>
            {step !== "idle" && (
              <button
                onClick={() => { setStep("idle"); setNewPin(""); setConfirmPin(""); }}
                className="rounded-xl px-4 py-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
