"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, BarChart2, PiggyBank, DollarSign } from "lucide-react";

type Phase = "visible" | "fading" | "hidden";

const DISPLAY_DURATION = 2200; // ms before fade starts
const FADE_DURATION = 600;     // ms for fade transition

export function SplashScreen() {
  // Start hidden — server renders nothing (avoids hydration mismatch entirely).
  // useEffect decides whether to show the splash only on the client.
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    // Already shown this browser session → stay hidden
    if (sessionStorage.getItem("et-splash-shown")) return;

    // First visit this session → show splash (deferred to avoid sync setState-in-effect)
    const showTimer = setTimeout(() => setPhase("visible"), 0);

    const fadeTimer = setTimeout(() => {
      setPhase("fading");
    }, DISPLAY_DURATION);

    const hideTimer = setTimeout(() => {
      setPhase("hidden");
      sessionStorage.setItem("et-splash-shown", "1");
    }, DISPLAY_DURATION + FADE_DURATION);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
        opacity: phase === "fading" ? 0 : 1,
        transition: `opacity ${FADE_DURATION}ms ease`,
        pointerEvents: phase === "fading" ? "none" : "all",
      }}
    >
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Decorative corner icons */}
      <FloatIcon icon={<TrendingUp size={80} />} style={{ top: "6%",  left:  "4%",  animationDelay: "0s" }} />
      <FloatIcon icon={<BarChart2  size={64} />} style={{ top: "8%",  right: "5%",  animationDelay: "0.6s" }} />
      <FloatIcon icon={<PiggyBank  size={72} />} style={{ bottom: "7%", left: "5%", animationDelay: "1.2s" }} />
      <FloatIcon icon={<DollarSign size={56} />} style={{ bottom: "8%", right: "4%", animationDelay: "0.3s" }} />

      {/* Center content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* App icon circle */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(37,99,235,0.35), 0 2px 8px rgba(37,99,235,0.2)",
            animation: "et-icon-scale 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
            marginBottom: "20px",
          }}
        >
          <Wallet size={38} color="white" strokeWidth={1.8} />
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            animation: "et-slide-up 0.5s ease both",
            animationDelay: "0.15s",
            marginBottom: "6px",
          }}
        >
          ExpenseTracker
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "0.85rem",
            fontWeight: 400,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
            animation: "et-slide-up 0.5s ease both",
            animationDelay: "0.28s",
            marginBottom: "36px",
          }}
        >
          Track · Budget · Save
        </div>

        {/* Loading dots */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--accent)",
                opacity: 0.4,
                animation: `et-dot-bounce 1.3s ease-in-out infinite`,
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatIcon({
  icon,
  style,
}: {
  icon: React.ReactNode;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        color: "var(--text-primary)",
        opacity: 0.045,
        animation: "et-float 4s ease-in-out infinite",
        pointerEvents: "none",
        ...style,
      }}
    >
      {icon}
    </div>
  );
}
