"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiProps {
  /** Whether to fire confetti */
  active: boolean;
  /** Duration in ms before auto-cleanup */
  duration?: number;
  /** Number of particles */
  particleCount?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const FALLBACK_COLORS = [
  "#B5654A", "#3D5A3E", "#F59E0B", "#EF4444", "#10B981",
  "#2D6A4F", "#EC4899", "#06B6D4", "#F97316", "#D4906A",
];

/** Resolve confetti palette from CSS tokens with hardcoded fallbacks. */
function getConfettiColors(): string[] {
  if (typeof window === "undefined") return FALLBACK_COLORS;
  const s = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string) => s.getPropertyValue(v).trim() || fb;
  return [
    get("--accent", "#B5654A"),
    get("--primary", "#3D5A3E"),
    get("--warning", "#F59E0B"),
    get("--danger", "#EF4444"),
    get("--success", "#10B981"),
    get("--secondary", "#2D6A4F"),
    "#EC4899", // decorative pink
    "#06B6D4", // decorative cyan
    "#F97316", // decorative orange
    "#D4906A", // decorative dust
  ];
}

/**
 * Lightweight canvas-based confetti burst for celebrations.
 * Renders a burst of colored particles that fall with gravity.
 * Self-cleans after duration.
 */
export function Confetti({ active, duration = 2500, particleCount = 60 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const createParticles = useCallback(() => {
    const colors = getConfettiColors();
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2 - 100,
        vx: (Math.random() - 0.5) * 12,
        vy: -(Math.random() * 10 + 5),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
    return particles;
  }, [particleCount]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = createParticles();
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.99; // air resistance
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, duration, createParticles]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: "var(--z-confetti)" as unknown as number }}
      aria-hidden="true"
    />
  );
}
