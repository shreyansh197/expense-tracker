"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Phase = "visible" | "fading" | "hidden";

const DISPLAY_DURATION = 800;
const FADE_DURATION = 400;

const BG = "linear-gradient(135deg, var(--background) 0%, var(--surface-secondary) 100%)";

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("et-splash-shown")) return;
    const t0 = setTimeout(() => setPhase("visible"), 0);
    const t1 = setTimeout(() => setPhase("fading"), DISPLAY_DURATION);
    const t2 = setTimeout(() => {
      setPhase("hidden");
      sessionStorage.setItem("et-splash-shown", "1");
    }, DISPLAY_DURATION + FADE_DURATION);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      {/* Logo with subtle glow */}
      <div style={{
        position: "relative",
        width: 80,
        height: 80,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: "0 0 40px var(--accent-soft), 0 0 80px var(--primary-soft)",
        animation: "et-icon-scale 0.4s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}>
        <Image src="/icons/icon-192.png" alt="ExpenStream" width={80} height={80} style={{ display: "block", width: "100%", height: "100%" }} />
      </div>

      {/* App name */}
      <div style={{
        fontSize: "1.75rem",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: "var(--text-primary)",
        opacity: 0,
        animation: "et-slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both 0.1s",
      }}>
        ExpenStream
      </div>
    </div>
  );
}

