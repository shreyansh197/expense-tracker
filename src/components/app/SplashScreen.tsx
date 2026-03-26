"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  TrendingUp, BarChart2, PiggyBank, DollarSign,
  Receipt, CreditCard, ArrowUpDown, Target, Coins,
} from "lucide-react";

type Phase = "visible" | "fading" | "hidden";

const DISPLAY_DURATION = 2400;
const FADE_DURATION    = 700;

// Fixed dark navy→indigo→violet palette — NEVER changes with theme
const BG = "linear-gradient(135deg, #0a0f1e 0%, #0d1340 45%, #130a2e 100%)";
const CYAN    = "#22d3ee";
const VIOLET  = "#a78bfa";
const INDIGO  = "#6366f1";

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (sessionStorage.getItem("et-splash-shown")) return;
    const t0 = setTimeout(() => setPhase("visible"), 0);
    const t1 = setTimeout(() => setPhase("fading"),   DISPLAY_DURATION);
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
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4,0,0.2,1)`,
        pointerEvents: phase === "fading" ? "none" : "all",
        overflow: "hidden",
      }}
    >
      {/* ── Animated mesh gradient orbs ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
      }}>
        {/* Top-left cyan orb */}
        <div style={{
          position: "absolute", top: "-15%", left: "-10%",
          width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)`,
          animation: "sp-orb 7s ease-in-out infinite",
        }} />
        {/* Center indigo orb */}
        <div style={{
          position: "absolute", top: "25%", left: "30%",
          width: 600, height: 600, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)`,
          animation: "sp-orb 9s ease-in-out infinite",
          animationDelay: "2s",
        }} />
        {/* Bottom-right violet orb */}
        <div style={{
          position: "absolute", bottom: "-15%", right: "-10%",
          width: 480, height: 480, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(167,139,250,0.18) 0%, transparent 70%)`,
          animation: "sp-orb 8s ease-in-out infinite",
          animationDelay: "4s",
        }} />
        {/* Subtle grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ── Decorative floating icons ── */}
      <FloatIcon icon={<TrendingUp  size={76} />} color={CYAN}   style={{ top: "6%",  left: "4%",   animationDelay: "0s",    animationDuration: "6s" }} />
      <FloatIcon icon={<BarChart2   size={60} />} color={VIOLET} style={{ top: "7%",  right: "5%",  animationDelay: "0.8s",  animationDuration: "7s" }} />
      <FloatIcon icon={<PiggyBank   size={68} />} color={INDIGO} style={{ bottom: "7%", left: "5%",  animationDelay: "1.4s",  animationDuration: "8s" }} />
      <FloatIcon icon={<DollarSign  size={52} />} color={CYAN}   style={{ bottom: "8%", right: "4%", animationDelay: "0.4s",  animationDuration: "5s" }} />
      <FloatIcon icon={<Receipt     size={42} />} color={VIOLET} style={{ top: "44%", left: "2%",   animationDelay: "1.1s",  animationDuration: "9s" }} />
      <FloatIcon icon={<CreditCard  size={38} />} color={INDIGO} style={{ top: "40%", right: "2%",  animationDelay: "1.7s",  animationDuration: "6s" }} />
      <FloatIcon icon={<ArrowUpDown size={34} />} color={CYAN}   style={{ top: "24%", left: "13%",  animationDelay: "0.5s",  animationDuration: "7s" }} />
      <FloatIcon icon={<Target      size={46} />} color={VIOLET} style={{ top: "22%", right: "11%", animationDelay: "2s",    animationDuration: "8s" }} />
      <FloatIcon icon={<Coins       size={50} />} color={INDIGO} style={{ bottom: "22%", left: "11%", animationDelay: "0.9s", animationDuration: "6s" }} />
      <FloatIcon icon={<BarChart2   size={36} />} color={CYAN}   style={{ bottom: "21%", right: "10%", animationDelay: "1.3s", animationDuration: "7s" }} />

      {/* ── Center content ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
      }}>
        {/* Outer glow ring */}
        <div style={{
          position: "relative",
          marginBottom: 24,
        }}>
          {/* Pulsing glow ring layer */}
          <div style={{
            position: "absolute", inset: -6,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${INDIGO}, ${CYAN})`,
            opacity: 0.35,
            filter: "blur(8px)",
            animation: "sp-glow-pulse 2.8s ease-in-out infinite",
          }} />
          {/* Icon circle */}
          <div style={{
            position: "relative",
            width: 96, height: 96,
            borderRadius: "50%",
            overflow: "hidden",
            boxShadow: `0 8px 40px rgba(99,102,241,0.5), 0 2px 12px rgba(99,102,241,0.3)`,
            animation: "et-icon-scale 0.55s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            <Image src="/icons/icon-192.png" alt="Spendly" width={96} height={96} style={{ display: "block", width: "100%", height: "100%" }} />
            {/* Shimmer beam */}
            <div style={{
              position: "absolute", top: 0, left: 0, width: "40%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
              animation: "sp-beam 2.5s ease-in-out infinite",
            }} />
          </div>
        </div>

        {/* App name */}
        <div style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: "#ffffff",
          animation: "et-slide-up 0.55s ease both",
          animationDelay: "0.18s",
          lineHeight: 1,
          marginBottom: 10,
          textShadow: `0 0 40px rgba(99,102,241,0.6)`,
        }}>
          Spendly
        </div>

        {/* Tagline — animated gradient text */}
        <div style={{
          fontSize: "0.8rem",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          background: `linear-gradient(90deg, ${CYAN}, ${VIOLET}, ${CYAN})`,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          animation: "et-slide-up 0.55s ease both, sp-text-shimmer 3s linear infinite",
          animationDelay: "0.3s, 1.2s",
          marginBottom: 40,
        }}>
          Spend smarter. Live better.
        </div>

        {/* Loading dots */}
        <div style={{ display: "flex", gap: 9, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              display: "block",
              width: 7, height: 7,
              borderRadius: "50%",
              background: CYAN,
              opacity: 0.5,
              animation: "et-dot-bounce 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatIcon({
  icon, color, style,
}: {
  icon: React.ReactNode;
  color: string;
  style: React.CSSProperties;
}) {
  return (
    <div style={{
      position: "absolute",
      color,
      opacity: 0.12,
      filter: `drop-shadow(0 0 8px ${color}80)`,
      animation: "sp-float 6s ease-in-out infinite",
      pointerEvents: "none",
      ...style,
    }}>
      {icon}
    </div>
  );
}

