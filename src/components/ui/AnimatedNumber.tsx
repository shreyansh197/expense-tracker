"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedNumber({ value, format, duration = 400, className, style }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const raf = useRef<number>(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;

    if (from === to) {
      return;
    }

    // Reduced motion: no counting animation — settle on the final value in one frame.
    const start = performance.now();
    const diff = to - from;
    const total = reducedMotion ? 0 : duration;

    function tick(now: number) {
      const elapsed = now - start;
      const t = total === 0 ? 1 : Math.min(elapsed / total, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + diff * eased);
      if (t < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration, reducedMotion]);

  return <span className={className} style={style}>{format(display)}</span>;
}
