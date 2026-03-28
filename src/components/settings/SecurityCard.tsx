"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { authFetch } from "@/lib/authClient";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Shield, Key, Smartphone, Trash2, Plus, Loader2, Copy, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

interface SessionItem {
  id: string;
  deviceName: string;
  platform: string;
  ipHash: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface DeviceItem {
  id: string;
  name: string;
  platform: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export function SecurityCard() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disabling2FA, setDisabling2FA] = useState(false);

  const fetchSessions = useCallback(async () => {
    startTransition(() => setLoadingSessions(true));
    try {
      const res = await authFetch("/api/sessions");
      if (res.ok) {
        const data = await res.json();
        startTransition(() => setSessions(data.sessions ?? []));
      }
    } catch { /* ignore */ }
    startTransition(() => setLoadingSessions(false));
  }, []);

  const fetchDevices = useCallback(async () => {
    startTransition(() => setLoadingDevices(true));
    try {
      const res = await authFetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        startTransition(() => setDevices(data.devices ?? []));
      }
    } catch { /* ignore */ }
    startTransition(() => setLoadingDevices(false));
  }, []);

  const revokeSession = async (sessionId: string) => {
    const res = await authFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Session revoked");
      fetchSessions();
    }
  };

  const revokeAllSessions = async () => {
    setRevokingAll(true);
    try {
      const res = await authFetch("/api/sessions", { method: "DELETE" });
      if (res.ok) {
        toast("All other sessions revoked");
        fetchSessions();
      }
    } catch { /* ignore */ }
    setRevokingAll(false);
  };

  const revokeDevice = async (deviceId: string) => {
    const res = await authFetch(`/api/devices/${deviceId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Device revoked");
      fetchDevices();
      fetchSessions();
    }
  };

  const setup2FA = async () => {
    const res = await authFetch("/api/auth/2fa");
    if (res.ok) {
      const data = await res.json();
      if (data.enabled) {
        setTwoFAEnabled(true);
        return;
      }
      setTotpUri(data.uri);
      setTotpSecret(data.secret);
      // Generate QR code data URL
      try {
        const url = await QRCode.toDataURL(data.uri, {
          width: 200,
          margin: 2,
          color: { dark: "#1e293b", light: "#ffffff" },
        });
        setQrDataUrl(url);
      } catch {
        // QR generation failed — user can still use manual entry
      }
    }
  };

  const verify2FA = async () => {
    if (verifyCode.length !== 6) return;
    setVerifying2FA(true);
    try {
      const res = await authFetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setTwoFAEnabled(true);
        setTotpUri(null);
        setTotpSecret(null);
        setQrDataUrl(null);
        setVerifyCode("");
        if (data.recoveryCodes?.length) {
          setRecoveryCodes(data.recoveryCodes);
          toast("2FA enabled! Save your recovery codes now.");
        } else {
          toast("2FA verified");
        }
      } else {
        toast("Invalid code, try again");
      }
    } catch { /* ignore */ }
    setVerifying2FA(false);
  };

  const check2FAStatus = useCallback(async () => {
    try {
      const res = await authFetch("/api/auth/2fa?status=1");
      if (res.ok) {
        const data = await res.json();
        if (data.enabled) startTransition(() => setTwoFAEnabled(true));
      }
    } catch { /* ignore */ }
  }, []);

  const disable2FA = async () => {
    if (disableCode.length !== 6) return;
    setDisabling2FA(true);
    try {
      const res = await authFetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      if (res.ok) {
        setTwoFAEnabled(false);
        setRecoveryCodes(null);
        setShowDisableConfirm(false);
        setDisableCode("");
        toast("2FA disabled");
      } else {
        toast("Invalid code, try again");
      }
    } catch { /* ignore */ }
    setDisabling2FA(false);
  };

  // Load sessions, devices, and 2FA status on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSessions();
    fetchDevices();
    check2FAStatus();
  }, [isAuthenticated, fetchSessions, fetchDevices, check2FAStatus]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* ─── Two-Factor Authentication ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h3>
        </div>

        {twoFAEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">2FA is enabled</span>
            </div>

            {/* Recovery codes display (shown right after enabling) */}
            {recoveryCodes && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Save these recovery codes — you won&apos;t see them again!
                </p>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {recoveryCodes.map((code, i) => (
                    <code key={i} className="rounded px-2 py-1 text-center font-mono text-xs" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>
                      {code}
                    </code>
                  ))}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(recoveryCodes.join("\n"));
                    toast("Recovery codes copied");
                  }}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400"
                >
                  <Copy size={12} />
                  Copy all codes
                </button>
              </div>
            )}

            {showDisableConfirm ? (
              <div className="space-y-2 rounded-lg p-3" style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Enter your authenticator code to confirm:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="form-input w-32 text-center font-mono text-sm tracking-[0.3em]"
                  />
                  <button
                    onClick={disable2FA}
                    disabled={disableCode.length !== 6 || disabling2FA}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {disabling2FA ? "Disabling..." : "Confirm"}
                  </button>
                </div>
                <button
                  onClick={() => { setShowDisableConfirm(false); setDisableCode(""); }}
                  className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
              >
                Disable 2FA
              </button>
            )}
          </div>
        ) : totpUri ? (
          <div className="space-y-4">
            <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>

            {/* QR Code */}
            {qrDataUrl ? (
              <div className="flex justify-center">
                <div className="rounded-xl p-3 shadow-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URL, next/image can't optimize */}
                  <img
                    src={qrDataUrl}
                    alt="TOTP QR Code"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
              </div>
            )}

            {/* Manual entry secret */}
            {totpSecret && (
              <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--surface-secondary)' }}>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Can&apos;t scan? Enter manually:
                </p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-mono text-xs break-all select-all" style={{ color: 'var(--text-primary)' }}>
                    {totpSecret}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(totpSecret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="shrink-0 p-1 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {copiedSecret ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Verification input */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                Enter the 6-digit code from your app:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="form-input w-32 text-center font-mono text-sm tracking-[0.3em]"
                />
                <button
                  onClick={verify2FA}
                  disabled={verifyCode.length !== 6 || verifying2FA}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {verifying2FA ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>

            {/* Cancel */}
            <button
              onClick={() => {
                setTotpUri(null);
                setTotpSecret(null);
                setQrDataUrl(null);
                setVerifyCode("");
              }}
              className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}
            >
              Cancel setup
            </button>
          </div>
        ) : (
          <button
            onClick={setup2FA}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
            style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <Plus size={14} />
            Enable 2FA
          </button>
        )}
      </div>

      {/* ─── Active Sessions ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key size={16} style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active Sessions</h3>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={revokeAllSessions}
              disabled={revokingAll}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 disabled:opacity-50"
            >
              {revokingAll ? "Revoking..." : "Revoke all others"}
            </button>
          )}
        </div>

        {loadingSessions ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {s.deviceName || "Unknown Device"}
                    {s.isCurrent && <span className="ml-2 text-emerald-500">(current)</span>}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Last active: {new Date(s.lastActiveAt).toLocaleDateString()}
                  </p>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => revokeSession(s.id)}
                    className="p-1 text-red-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Linked Devices ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Linked Devices</h3>
        </div>

        {loadingDevices ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : devices.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No linked devices</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {d.name || "Unnamed Device"}
                    {d.isCurrent && <span className="ml-2 text-emerald-500">(this device)</span>}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Last active: {new Date(d.lastActiveAt).toLocaleDateString()}
                  </p>
                </div>
                {!d.isCurrent && (
                  <button
                    onClick={() => revokeDevice(d.id)}
                    className="p-1 text-red-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
