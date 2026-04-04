"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

interface ThreeCanvasProps {
  /** Container size class, e.g. "h-24 w-24" */
  className?: string;
  /** Static fallback for no-WebGL / reduced-motion */
  fallback?: ReactNode;
  /** Camera position — default [0, 0, 4] */
  cameraPosition?: [number, number, number];
  /** Camera field-of-view — default 35 */
  fov?: number;
  children: ReactNode;
}

/**
 * Reusable 3D canvas wrapper with:
 * - dpr capped [1, 1.5] for battery/performance
 * - IntersectionObserver auto-pause (frameloop)
 * - prefers-reduced-motion → static fallback
 * - WebGL detection → static fallback if missing
 * - Shared ambient + directional lighting
 */
export function ThreeCanvas({
  className = "h-24 w-24",
  fallback = null,
  cameraPosition = [0, 0, 4],
  fov = 35,
  children,
}: ThreeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const reduced = useReducedMotion();

  // Detect WebGL support once
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
      setWebglOk(ok);
    } catch {
      setWebglOk(false);
    }
  }, []);

  // Pause rendering when scrolled off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (reduced || !webglOk) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div ref={containerRef} className={className}>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
        frameloop={visible ? "always" : "never"}
        camera={{ position: cameraPosition, fov }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 5]} intensity={0.8} />
        {children}
      </Canvas>
    </div>
  );
}
