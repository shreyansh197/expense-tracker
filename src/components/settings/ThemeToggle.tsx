"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Monitor } from "lucide-react";

/**
 * Animated Sun ↔ Moon toggle inspired by popular apps.
 * Tapping cycles: light → dark → system → light …
 * The sun/moon SVG morphs with CSS transitions (rays shrink, crescent appears).
 */
export function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();

  const next = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const isDark = theme === "dark" || (theme === "system" && resolved === "dark");
  const isSystem = theme === "system";

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={next}
        aria-label={`Theme: ${theme}. Tap to switch.`}
        className="relative h-14 w-14 rounded-2xl flex items-center justify-center transition-colors duration-500 overflow-hidden"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        }}
      >
        {/* Stars (visible in dark mode) */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: isDark ? 1 : 0 }}
        >
          <span className="absolute top-2 left-2.5 h-1 w-1 rounded-full bg-white/70 animate-pulse" />
          <span className="absolute top-4 right-3 h-0.5 w-0.5 rounded-full bg-white/50 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <span className="absolute bottom-3 left-4 h-0.5 w-0.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {/* Sun / Moon icon container */}
        <div className="relative h-7 w-7">
          {/* Sun body / Moon body */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-500 ease-in-out"
            style={{
              background: isDark ? "#e2e8f0" : "#f59e0b",
              transform: isDark ? "scale(0.85)" : "scale(1)",
              boxShadow: isDark ? "none" : "0 0 12px 2px rgba(245,158,11,0.4)",
            }}
          />

          {/* Moon crescent mask (slides in for dark) */}
          <div
            className="absolute rounded-full transition-all duration-500 ease-in-out"
            style={{
              width: "18px",
              height: "18px",
              top: "1px",
              right: "0px",
              background: isDark
                ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
                : "transparent",
              transform: isDark ? "translateX(0)" : "translateX(10px)",
              opacity: isDark ? 1 : 0,
            }}
          />

          {/* Sun rays (visible only in light mode) */}
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 block rounded-full transition-all duration-500"
              style={{
                width: "2px",
                height: isDark ? "0px" : "5px",
                background: "#f59e0b",
                transformOrigin: "center -3px",
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(${isDark ? "0px" : "-12px"})`,
                opacity: isDark ? 0 : 0.9,
              }}
            />
          ))}
        </div>

        {/* System badge */}
        {isSystem && (
          <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center">
            <Monitor size={10} className="text-[var(--text-muted)]" />
          </div>
        )}
      </button>

      {/* Label + hint */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {theme === "system" ? "Follows device setting" : "Tap to change"}
        </span>
      </div>

      {/* Three-dot indicator showing current position */}
      <div className="ml-auto flex gap-1.5">
        {(["light", "dark", "system"] as const).map((t) => (
          <span
            key={t}
            className="h-2 w-2 rounded-full transition-all duration-300"
            style={{
              background: theme === t ? "var(--accent)" : "var(--border-strong)",
              transform: theme === t ? "scale(1.3)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
