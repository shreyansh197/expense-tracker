"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, X } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";

const PENDING_KEY = "expenstream-recovery-codes-pending";

export function RecoveryCodeBanner() {
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setVisible(localStorage.getItem(PENDING_KEY) === "true");
  }, [isAuthenticated]);

  function dismiss() {
    localStorage.removeItem(PENDING_KEY);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "env(safe-area-inset-bottom, 16px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1200,
        width: "calc(100% - 32px)",
        maxWidth: 600,
        background: "var(--surface)",
        border: "1px solid var(--warning, #F59E0B)",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--warning-soft, #FEF9C3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <ShieldAlert size={16} color="var(--warning-text, #B45309)" strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
          Save your 2FA recovery codes
        </p>
        <p style={{ fontSize: "0.725rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
          Store them somewhere safe — you&apos;ll need them if you lose access to your authenticator.{" "}
          <Link
            href="/settings#security"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
            onClick={dismiss}
          >
            View in settings
          </Link>
        </p>
      </div>

      <button
        onClick={dismiss}
        style={{
          padding: "4px",
          borderRadius: "6px",
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          flexShrink: 0,
        }}
        aria-label="Dismiss recovery code reminder"
        title="I've saved my recovery codes"
      >
        <X size={14} />
      </button>
    </div>
  );
}
