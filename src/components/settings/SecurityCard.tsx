"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { authFetch } from "@/lib/authClient";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Shield, Key, Smartphone, Trash2, Plus, Loader2 } from "lucide-react";

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
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);

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
      setTotpUri(data.uri);
      setTotpSecret(data.secret);
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
        setVerifyCode("");
        if (data.recoveryCodes) {
          toast(`2FA enabled! Save your ${data.recoveryCodes.length} recovery codes`);
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
          <Shield size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Two-Factor Authentication</h3>
        </div>

        {twoFAEnabled ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">2FA is enabled</span>
            </div>
            <button
              onClick={disable2FA}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
            >
              Disable 2FA
            </button>
          </div>
        ) : totpUri ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Scan this QR code with your authenticator app, then enter the 6-digit code:</p>
            {totpSecret && (
              <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                <p className="text-xs text-gray-400">Manual entry:</p>
                <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{totpSecret}</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-center font-mono text-sm tracking-[0.3em] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={verify2FA}
                disabled={verifyCode.length !== 6 || verifying2FA}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {verifying2FA ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={setup2FA}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
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
            <Key size={16} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active Sessions</h3>
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
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-gray-400">No active sessions</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
              >
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {s.deviceName || "Unknown Device"}
                    {s.isCurrent && <span className="ml-2 text-emerald-500">(current)</span>}
                  </p>
                  <p className="text-[10px] text-gray-400">
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
          <Smartphone size={16} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Linked Devices</h3>
        </div>

        {loadingDevices ? (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            Loading...
          </div>
        ) : devices.length === 0 ? (
          <p className="text-xs text-gray-400">No linked devices</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800"
              >
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {d.name || "Unnamed Device"}
                    {d.isCurrent && <span className="ml-2 text-emerald-500">(this device)</span>}
                  </p>
                  <p className="text-[10px] text-gray-400">
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
