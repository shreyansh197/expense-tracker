"use client";

/**
 * DecoGraphic — theme-aware decorative SVG background shapes.
 * Renders faint geometric/organic shapes as an absolute-positioned background layer.
 * Uses CSS variable colors at very low opacity (0.03–0.06) so it works in both light and dark mode.
 * Pure CSS — no JS runtime cost. Pointer-events disabled.
 */

type Variant = "finance" | "chart" | "abstract";

interface DecoGraphicProps {
  variant?: Variant;
  className?: string;
}

export function DecoGraphic({ variant = "abstract", className = "" }: DecoGraphicProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {variant === "finance" && <FinanceShapes />}
        {variant === "chart" && <ChartShapes />}
        {variant === "abstract" && <AbstractShapes />}
      </svg>
    </div>
  );
}

function FinanceShapes() {
  return (
    <>
      {/* Large circle — top right */}
      <circle cx="700" cy="80" r="120" stroke="var(--accent)" strokeWidth="1" opacity="0.14" />
      <circle cx="700" cy="80" r="80" stroke="var(--accent)" strokeWidth="0.5" opacity="0.10" />

      {/* Small circle cluster — bottom left */}
      <circle cx="100" cy="480" r="60" stroke="var(--accent)" strokeWidth="1" opacity="0.14" />
      <circle cx="140" cy="520" r="30" stroke="var(--accent)" strokeWidth="0.5" opacity="0.10" />

      {/* Diagonal lines — faint grid */}
      <line x1="0" y1="200" x2="200" y2="0" stroke="var(--accent)" strokeWidth="0.5" opacity="0.09" />
      <line x1="50" y1="250" x2="250" y2="50" stroke="var(--accent)" strokeWidth="0.5" opacity="0.07" />

      {/* Dots scattered */}
      <circle cx="300" cy="150" r="3" fill="var(--accent)" opacity="0.14" />
      <circle cx="500" cy="350" r="2" fill="var(--accent)" opacity="0.10" />
      <circle cx="650" cy="250" r="4" fill="var(--accent)" opacity="0.10" />

      {/* Curved path — like a wave */}
      <path
        d="M0 400 Q200 350 400 420 Q600 490 800 400"
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.10"
      />
    </>
  );
}

function ChartShapes() {
  return (
    <>
      {/* Grid dots */}
      {Array.from({ length: 8 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => (
          <circle
            key={`${i}-${j}`}
            cx={100 + i * 80}
            cy={80 + j * 80}
            r="1.5"
            fill="var(--accent)"
            opacity="0.14"
          />
        ))
      )}

      {/* Curve — like a trend line */}
      <path
        d="M80 450 Q200 380 350 420 Q500 460 600 320 Q700 180 780 200"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.14"
        strokeLinecap="round"
      />

      {/* Bar chart ghost */}
      <rect x="650" cy="400" y="400" width="20" height="80" rx="4" fill="var(--accent)" opacity="0.09" />
      <rect x="680" cy="380" y="380" width="20" height="100" rx="4" fill="var(--accent)" opacity="0.10" />
      <rect x="710" cy="420" y="420" width="20" height="60" rx="4" fill="var(--accent)" opacity="0.09" />
    </>
  );
}

function AbstractShapes() {
  return (
    <>
      {/* Large ring — top right */}
      <circle cx="720" cy="100" r="150" stroke="var(--accent)" strokeWidth="1" opacity="0.12" />

      {/* Medium ring — bottom left */}
      <circle cx="80" cy="500" r="100" stroke="var(--accent)" strokeWidth="1" opacity="0.10" />

      {/* Small accent circle */}
      <circle cx="400" cy="50" r="40" stroke="var(--accent)" strokeWidth="0.5" opacity="0.09" />

      {/* Flowing curve */}
      <path
        d="M-50 300 Q200 200 400 300 Q600 400 850 280"
        stroke="var(--accent)"
        strokeWidth="1"
        opacity="0.10"
      />

      {/* Scattered dots */}
      <circle cx="200" cy="180" r="2.5" fill="var(--accent)" opacity="0.14" />
      <circle cx="550" cy="450" r="3" fill="var(--accent)" opacity="0.10" />
      <circle cx="350" cy="350" r="2" fill="var(--accent)" opacity="0.09" />
      <circle cx="680" cy="380" r="2" fill="var(--accent)" opacity="0.10" />
    </>
  );
}
