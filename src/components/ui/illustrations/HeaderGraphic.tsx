"use client";

/**
 * HeaderGraphic — generative terrain SVG that responds to budget health.
 * Gentle rolling hills when healthy, sparse/angular when strained.
 * Decorative only (aria-hidden). Uses brand tokens.
 */

interface HeaderGraphicProps {
  budgetUsedPercent?: number;
}

export function HeaderGraphic({ budgetUsedPercent = 0 }: HeaderGraphicProps) {
  const p = Math.max(0, budgetUsedPercent);

  // Terrain band: 0-50 healthy, 50-80 caution, 80-100 danger, 100+ overspent
  const isHealthy = p <= 50;
  const isCaution = p > 50 && p <= 80;
  const isDanger = p > 80 && p <= 100;
  // const isOver = p > 100;  // overspent — sparse dots only

  // Hill control points lower as budget drains (higher Y = lower on screen)
  const hillBase = isHealthy ? 35 : isCaution ? 50 : isDanger ? 62 : 75;
  const hillPeak = isHealthy ? 18 : isCaution ? 32 : isDanger ? 48 : 68;
  const frontBase = isHealthy ? 45 : isCaution ? 58 : isDanger ? 68 : 78;
  const frontPeak = isHealthy ? 30 : isCaution ? 44 : isDanger ? 56 : 72;

  // Colors shift by band
  const backColor = isDanger || p > 100 ? "var(--danger)" : isCaution ? "var(--warning)" : "var(--primary)";
  const frontColor = isDanger || p > 100 ? "var(--danger)" : isCaution ? "var(--warning)" : "var(--accent)";
  const backOpacity = isHealthy ? 0.14 : isCaution ? 0.12 : 0.09;
  const frontOpacity = isHealthy ? 0.1 : isCaution ? 0.08 : 0.06;

  // Back hill path — smooth cubic bezier
  const backPath = isDanger || p > 100
    ? `M0 ${hillBase} L20 ${hillPeak - 4} L40 ${hillBase - 5} L60 ${hillPeak} L80 ${hillBase - 3} L100 ${hillPeak + 2} L120 ${hillBase} V90 H0 Z`
    : `M0 ${hillBase} C30 ${hillPeak} 50 ${hillPeak} 70 ${hillBase - 5} C90 ${hillPeak + 8} 110 ${hillPeak + 4} 120 ${hillBase} V90 H0 Z`;

  // Front hill path — offset
  const frontPath = isDanger || p > 100
    ? `M0 ${frontBase} L25 ${frontPeak + 2} L55 ${frontBase - 4} L85 ${frontPeak - 1} L120 ${frontBase} V90 H0 Z`
    : `M0 ${frontBase} C40 ${frontPeak} 65 ${frontPeak + 2} 90 ${frontBase - 4} C105 ${frontPeak + 6} 115 ${frontPeak + 8} 120 ${frontBase} V90 H0 Z`;

  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[50px] w-[66px] sm:h-[90px] sm:w-[120px]"
    >
      {/* Back hill */}
      <path d={backPath} fill={backColor} opacity={backOpacity} />

      {/* Front hill */}
      <path d={frontPath} fill={frontColor} opacity={frontOpacity} />

      {/* Caution ridge accent */}
      {isCaution && (
        <path
          d="M50 55 L60 42 L70 55"
          stroke="var(--warning)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.15"
        />
      )}

      {/* Scattered dots for sparse/overspent terrain */}
      {(isDanger || p > 100) && (
        <>
          <circle cx="20" cy="72" r="1.5" fill="var(--danger)" opacity="0.15" />
          <circle cx="55" cy="68" r="2" fill="var(--danger)" opacity="0.12" />
          <circle cx="90" cy="74" r="1.5" fill="var(--danger)" opacity="0.1" />
          <circle cx="108" cy="65" r="1" fill="var(--danger)" opacity="0.08" />
        </>
      )}

      {/* Healthy decorative dots */}
      {isHealthy && (
        <>
          <circle cx="105" cy="18" r="3" fill="var(--accent)" opacity="0.16" />
          <circle cx="15" cy="25" r="2" fill="var(--primary)" opacity="0.1" />
        </>
      )}
    </svg>
  );
}
