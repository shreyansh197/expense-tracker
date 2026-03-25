"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineScreen() {
  const isOnline = useOnlineStatus();
  const [isChecking, setIsChecking] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Track when we transition offline → show with animation
  useEffect(() => {
    if (!isOnline) {
      // Small delay so the overlay doesn't flash briefly during online→offline transition
      const t = setTimeout(() => {
        if (mountedRef.current) setVisible(true);
      }, 120);
      return () => clearTimeout(t);
    } else {
      // Defer to avoid synchronous setState-in-effect warning
      const t = setTimeout(() => {
        if (mountedRef.current) {
          setVisible(false);
          setStillOffline(false);
          setIsChecking(false);
        }
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOnline]);

  const handleRetry = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    setStillOffline(false);

    try {
      // Real network check — don't trust navigator.onLine alone
      const res = await fetch("/favicon.ico?_=" + Date.now(), {
        cache: "no-store",
        method: "HEAD",
      });
      if (res.ok && mountedRef.current) {
        window.location.reload();
        return;
      }
    } catch {
      // Network truly unavailable
    }

    if (mountedRef.current) {
      setIsChecking(false);
      setStillOffline(true);
      setShakeKey((k) => k + 1); // re-trigger shake animation
      const t = setTimeout(() => {
        if (mountedRef.current) setStillOffline(false);
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [isChecking]);

  if (!visible) return null;

  return (
    <div
      role="alertdialog"
      aria-label="No internet connection"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        animation: "et-screen-in 0.22s ease both",
      }}
    >
      {/* Subtle grid texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "var(--surface)",
          borderRadius: "20px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
          border: "1px solid var(--border)",
          padding: "40px 32px 32px",
          maxWidth: "360px",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0",
        }}
      >
        {/* Icon with pulse ring */}
        <div
          style={{
            position: "relative",
            width: 88,
            height: 88,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          {/* Outer pulse ring */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid var(--danger)",
              opacity: 0.35,
              animation: "et-offline-ring 2s ease-out infinite",
            }}
          />
          {/* Inner pulse ring */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: "8px",
              borderRadius: "50%",
              border: "2px solid var(--danger)",
              opacity: 0.2,
              animation: "et-offline-ring 2s ease-out infinite",
              animationDelay: "0.6s",
            }}
          />
          {/* Icon background */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "var(--danger-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WifiOff size={36} color="var(--danger)" strokeWidth={1.8} />
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            marginBottom: "10px",
          }}
        >
          No Internet Connection
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "28px",
            maxWidth: "280px",
          }}
        >
          Your data is safe. Any changes you make will sync automatically when
          you&rsquo;re back online.
        </p>

        {/* Retry button */}
        <button
          key={shakeKey}
          onClick={handleRetry}
          disabled={isChecking}
          style={{
            width: "100%",
            padding: "13px 24px",
            borderRadius: "12px",
            border: "none",
            background: isChecking
              ? "var(--accent-soft)"
              : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: isChecking ? "var(--accent)" : "white",
            fontSize: "0.925rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
            cursor: isChecking ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "background-color 0.2s, transform 0.1s, opacity 0.2s",
            animation: stillOffline ? `et-shake 0.5s ease both` : undefined,
            boxShadow: isChecking
              ? "none"
              : "0 4px 14px rgba(37,99,235,0.35)",
          }}
          onMouseEnter={(e) => {
            if (!isChecking) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
          onMouseDown={(e) => {
            if (!isChecking) (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          <RefreshCw
            size={16}
            strokeWidth={2.2}
            style={{
              animation: isChecking ? "spin 0.8s linear infinite" : undefined,
            }}
          />
          {isChecking ? "Checking…" : "Try Again"}
        </button>

        {/* Still offline feedback */}
        <div
          style={{
            marginTop: "12px",
            minHeight: "20px",
            fontSize: "0.8rem",
            color: "var(--danger)",
            fontWeight: 500,
            opacity: stillOffline ? 1 : 0,
            transition: "opacity 0.3s ease",
          }}
          aria-live="polite"
        >
          Still offline — please check your connection
        </div>

        {/* Footer hint */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border-subtle)",
            width: "100%",
            fontSize: "0.78rem",
            color: "var(--text-tertiary)",
          }}
        >
          The app will reconnect automatically
        </div>
      </div>
    </div>
  );
}
