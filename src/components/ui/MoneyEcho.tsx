"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

interface MoneyEchoProps {
  /** Trigger the animation. Set to a new truthy value each time. */
  trigger: number;
  /** Origin point (center of burst) — viewport coords */
  origin?: { x: number; y: number };
  /** Category color hex — particles will use this instead of default moss */
  color?: string;
  /** Number of particles */
  count?: number;
  className?: string;
}

/**
 * Money Echo — particle burst + ripple ring on expense save.
 * ~800ms total. Reduced motion: simple crossfade pulse.
 */
export function MoneyEcho({
  trigger,
  origin,
  color,
  count = 10,
  className,
}: MoneyEchoProps) {
  const prefersReduced = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showRipple, setShowRipple] = useState(false);

  const burst = useCallback(() => {
    const pts: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      angle: (i / count) * 360 + (Math.random() - 0.5) * 30,
      distance: 40 + Math.random() * 50,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.08,
    }));
    setParticles(pts);
    setShowRipple(true);
    setTimeout(() => {
      setParticles([]);
      setShowRipple(false);
    }, 900);
  }, [count]);

  const prevTriggerRef = useRef(trigger);

  useEffect(() => {
    if (trigger > 0 && trigger !== prevTriggerRef.current) {
      prevTriggerRef.current = trigger;
      // Schedule burst outside the synchronous effect body
      const id = requestAnimationFrame(() => burst());
      return () => cancelAnimationFrame(id);
    }
  }, [trigger, burst]);

  if (!particles.length && !showRipple) return null;

  const cx = origin?.x ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 200);
  const cy = origin?.y ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 400);

  // Reduced motion: simple pulse ring
  if (prefersReduced) {
    return (
      <div className={`fixed inset-0 z-[200] pointer-events-none ${className ?? ""}`}>
        <AnimatePresence>
          {showRipple && (
            <m.div
              initial={{ opacity: 0.6, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                position: "absolute",
                left: cx - 30,
                top: cy - 30,
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: `2px solid ${color || "var(--accent)"}`,
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[200] pointer-events-none ${className ?? ""}`}>
      {/* Ripple ring */}
      <AnimatePresence>
        {showRipple && (
          <m.div
            initial={{ opacity: 0.5, scale: 0.2 }}
            animate={{ opacity: 0, scale: 2.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: cx - 40,
              top: cy - 40,
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `2px solid ${color || "var(--accent)"}`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Particles */}
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <m.div
            key={p.id}
            initial={{ opacity: 0.8, x: cx, y: cy, scale: 1 }}
            animate={{ opacity: 0, x: cx + tx, y: cy + ty, scale: 0.3 }}
            transition={{
              duration: 0.7,
              delay: p.delay,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: color || "var(--accent)",
            }}
          />
        );
      })}
    </div>
  );
}
