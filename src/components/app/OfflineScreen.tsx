"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineScreen() {
  const isOnline = useOnlineStatus();
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Track when we transition offline → show with animation
  useEffect(() => {
    if (!isOnline) {
      const t = setTimeout(() => {
        if (mountedRef.current) {
          setVisible(true);
          setDismissed(false);
        }
      }, 120);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        if (mountedRef.current) {
          setVisible(false);
          setIsChecking(false);
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  const handleRetry = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const res = await fetch("/favicon.ico?_=" + Date.now(), {
        cache: "no-store",
        method: "HEAD",
      });
      if (res.ok && mountedRef.current) {
        setVisible(false);
        return;
      }
    } catch {
      // Network truly unavailable
    }

    if (mountedRef.current) {
      setIsChecking(false);
    }
  }, [isChecking]);

  if (!visible || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        padding: "0 12px",
        paddingTop: "env(safe-area-inset-top, 0px)",
        animation: "et-banner-in 0.3s ease both",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "8px auto",
          background: "var(--surface)",
          border: "1px solid var(--danger)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--danger-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <WifiOff size={16} color="var(--danger)" strokeWidth={2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
            You&apos;re offline
          </p>
          <p style={{ fontSize: "0.725rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
            Changes will sync when you reconnect
          </p>
        </div>

        <button
          onClick={handleRetry}
          disabled={isChecking}
          style={{
            padding: "5px 10px",
            borderRadius: "8px",
            border: "none",
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: isChecking ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            opacity: isChecking ? 0.6 : 1,
          }}
        >
          <RefreshCw
            size={12}
            strokeWidth={2.2}
            style={{ animation: isChecking ? "spin 0.8s linear infinite" : undefined }}
          />
          {isChecking ? "…" : "Retry"}
        </button>

        <button
          onClick={() => setDismissed(true)}
          style={{
            padding: "4px",
            borderRadius: "6px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Dismiss offline banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
