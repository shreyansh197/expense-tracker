"use client";

/**
 * AmbientBackground — decorative animated gradient mesh + floating particles.
 * Used behind empty states to make them feel intentional, not unfinished.
 * Pure CSS animations — no JS runtime cost. Respects prefers-reduced-motion
 * via the global CSS rule that collapses all animation durations.
 */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Gradient mesh */}
      <div
        className="absolute inset-0 opacity-45 animate-gradient-drift"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, var(--accent-soft) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, var(--success-soft) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, var(--warning-soft) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />
      {/* Floating particles */}
      {[
        { size: 6, x: '15%', y: '25%', delay: '0s', dur: '7s' },
        { size: 4, x: '75%', y: '20%', delay: '1.5s', dur: '9s' },
        { size: 5, x: '55%', y: '70%', delay: '3s', dur: '8s' },
        { size: 3, x: '30%', y: '60%', delay: '2s', dur: '10s' },
        { size: 4, x: '85%', y: '55%', delay: '4s', dur: '7.5s' },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            background: 'var(--accent)',
            opacity: 0.25,
            animation: `particle-drift ${p.dur} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
