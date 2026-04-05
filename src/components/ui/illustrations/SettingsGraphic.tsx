"use client";

/**
 * SettingsGraphic — abstract gear / sliders motif.
 * Suggests configuration and personalization. Decorative only.
 */
export function SettingsGraphic() {
  return (
    <svg
      viewBox="0 0 100 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[48px] w-[54px] sm:h-[80px] sm:w-[90px]"
    >
      {/* Large gear ring — implied cog */}
      <circle cx="50" cy="42" r="26" stroke="var(--primary)" strokeWidth="2" fill="none" opacity="0.07" />
      <circle cx="50" cy="42" r="16" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.10" />
      <circle cx="50" cy="42" r="5" fill="var(--primary)" opacity="0.12" />

      {/* Gear teeth — 4 small rectangles at cardinal points */}
      <rect x="47" y="10" width="6" height="10" rx="2" fill="var(--primary)" opacity="0.08" />
      <rect x="47" y="64" width="6" height="10" rx="2" fill="var(--primary)" opacity="0.08" />
      <rect x="18" y="39" width="10" height="6" rx="2" fill="var(--primary)" opacity="0.08" />
      <rect x="72" y="39" width="10" height="6" rx="2" fill="var(--primary)" opacity="0.08" />

      {/* Slider bars — below gear */}
      <line x1="15" y1="78" x2="45" y2="78" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" opacity="0.10" />
      <circle cx="35" cy="78" r="3" fill="var(--accent)" opacity="0.14" />

      <line x1="55" y1="78" x2="85" y2="78" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity="0.08" />
      <circle cx="72" cy="78" r="3" fill="var(--primary)" opacity="0.12" />

      {/* Floating accents */}
      <circle cx="86" cy="18" r="4" fill="var(--accent)" opacity="0.08" />
      <circle cx="14" cy="24" r="3" fill="var(--primary)" opacity="0.06" />
    </svg>
  );
}
