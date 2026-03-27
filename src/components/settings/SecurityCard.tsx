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

  const disable2FA = async () => {
    const res = await authFetch("/api/auth/2fa", { method: "DELETE" });
    if (res.ok) {
      setTwoFAEnabled(false);
      setRecoveryCodes(null);
      toast("2FA disabled");
    }
  };

  // Load sessions and devices on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSessions();
    fetchDevices();
  }, [isAuthenticated, fetchSessions, fetchDevices]);

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* ─── Two-Factor Authentication ─── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Two-Factor Authentication</h3>
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
                    <code key={i} className="rounded bg-white px-2 py-1 text-center font-mono text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
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

            <button
              onClick={disable2FA}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
            >
              Disable 2FA
            </button>
          </div>
        ) : totpUri ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>

            {/* QR Code */}
            {qrDataUrl ? (
              <div className="flex justify-center">
                <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
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
              <div className="flex h-[200px] items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            )}

            {/* Manual entry secret */}
            {totpSecret && (
              <div className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-1">
                  Can&apos;t scan? Enter manually:
                </p>
                <div className="flex items-center gap-2">
                  <p className="flex-1 font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                    {totpSecret}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(totpSecret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {copiedSecret ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Verification input */}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
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
                  className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center font-mono text-sm tracking-[0.3em] dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Cancel setup
            </button>
          </div>
        ) : (
          <button
            onClick={setup2FA}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
            <Key size={16} className="text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Active Sessions</h3>
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
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-400">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
              >
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {s.deviceName || "Unknown Device"}
                    {s.isCurrent && <span className="ml-2 text-emerald-500">(current)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">
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
          <Smartphone size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Linked Devices</h3>
        </div>

        {loadingDevices ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : devices.length === 0 ? (
          <p className="text-xs text-slate-400">No linked devices</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800"
              >
                <div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {d.name || "Unnamed Device"}
                    {d.isCurrent && <span className="ml-2 text-emerald-500">(this device)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">
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
