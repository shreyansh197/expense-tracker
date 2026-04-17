"use client";

import { m } from "framer-motion";
import { Check } from "lucide-react";

interface AccentColorPickerProps {
  currentColor?: string;
  onSelect: (color: string) => void;
}

export const ACCENT_PRESETS = [
  { id: "moss",   label: "Moss",   accent: "#3D5A3E", accentDark: "#8FAF8B", soft: "#C8D9C4", softDark: "rgba(143,175,139,0.14)", hover: "#2D6A4F", hoverDark: "#A3C4A0", deep: "#2B4A2C", deepDark: "#6D8F6A", border: "#8FAF8B", borderDark: "rgba(143,175,139,0.35)" },
  { id: "clay",   label: "Clay",   accent: "#B5654A", accentDark: "#D4906A", soft: "#F5E6DF", softDark: "rgba(212,144,106,0.14)", hover: "#A0583F", hoverDark: "#C07A55", deep: "#8B4A34", deepDark: "#A0583F", border: "#D4906A", borderDark: "rgba(212,144,106,0.35)" },
  { id: "purple", label: "Purple", accent: "#7C3AED", accentDark: "#A78BFA", soft: "#EDE9FE", softDark: "rgba(167,139,250,0.14)", hover: "#6D28D9", hoverDark: "#C4B5FD", deep: "#5B21B6", deepDark: "#7C3AED", border: "#A78BFA", borderDark: "rgba(167,139,250,0.35)" },
  { id: "blue",   label: "Blue",   accent: "#2563EB", accentDark: "#60A5FA", soft: "#DBEAFE", softDark: "rgba(96,165,250,0.14)", hover: "#1D4ED8", hoverDark: "#93C5FD", deep: "#1E40AF", deepDark: "#2563EB", border: "#60A5FA", borderDark: "rgba(96,165,250,0.35)" },
  { id: "green",  label: "Green",  accent: "#16A34A", accentDark: "#4ADE80", soft: "#DCFCE7", softDark: "rgba(74,222,128,0.14)", hover: "#15803D", hoverDark: "#86EFAC", deep: "#166534", deepDark: "#16A34A", border: "#4ADE80", borderDark: "rgba(74,222,128,0.35)" },
  { id: "orange", label: "Orange", accent: "#EA580C", accentDark: "#FB923C", soft: "#FFEDD5", softDark: "rgba(251,146,60,0.14)", hover: "#C2410C", hoverDark: "#FDBA74", deep: "#9A3412", deepDark: "#EA580C", border: "#FB923C", borderDark: "rgba(251,146,60,0.35)" },
  { id: "rose",   label: "Rose",   accent: "#E11D48", accentDark: "#FB7185", soft: "#FFE4E6", softDark: "rgba(251,113,133,0.14)", hover: "#BE123C", hoverDark: "#FDA4AF", deep: "#9F1239", deepDark: "#E11D48", border: "#FB7185", borderDark: "rgba(251,113,133,0.35)" },
  { id: "amber",  label: "Amber",  accent: "#D97706", accentDark: "#FBBF24", soft: "#FEF3C7", softDark: "rgba(251,191,36,0.14)", hover: "#B45309", hoverDark: "#FCD34D", deep: "#92400E", deepDark: "#D97706", border: "#FBBF24", borderDark: "rgba(251,191,36,0.35)" },
  { id: "indigo", label: "Indigo", accent: "#4F46E5", accentDark: "#818CF8", soft: "#E0E7FF", softDark: "rgba(129,140,248,0.14)", hover: "#4338CA", hoverDark: "#A5B4FC", deep: "#3730A3", deepDark: "#4F46E5", border: "#818CF8", borderDark: "rgba(129,140,248,0.35)" },
] as const;

export function AccentColorPicker({ currentColor, onSelect }: AccentColorPickerProps) {
  const selected = currentColor || "purple";

  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Accent color">
      {ACCENT_PRESETS.map((preset) => {
        const isActive = selected === preset.id;
        return (
          <button
            key={preset.id}
            role="radio"
            aria-checked={isActive}
            aria-label={preset.label}
            onClick={() => onSelect(preset.id)}
            className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-medium transition-all"
            style={{
              background: isActive ? "var(--surface-secondary)" : "transparent",
              boxShadow: isActive ? "inset 0 0 0 2px var(--accent)" : "none",
            }}
          >
            <m.div
              className="relative flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: preset.accent }}
              whileTap={{ scale: 0.9 }}
            >
              {isActive && (
                <m.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check size={14} color="#fff" strokeWidth={3} />
                </m.div>
              )}
            </m.div>
            <span style={{ color: isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Apply accent color CSS variables to the document root */
export function applyAccentColor(colorId: string | undefined) {
  if (typeof document === "undefined") return;
  const preset = ACCENT_PRESETS.find((p) => p.id === colorId) ?? ACCENT_PRESETS[0]; // default to moss
  const isDark = document.documentElement.classList.contains("dark");
  const s = document.documentElement.style;
  s.setProperty("--accent", isDark ? preset.accentDark : preset.accent);
  s.setProperty("--accent-soft", isDark ? preset.softDark : preset.soft);
  s.setProperty("--accent-hover", isDark ? preset.hoverDark : preset.hover);
  s.setProperty("--accent-deep", isDark ? preset.deepDark : preset.deep);
  s.setProperty("--accent-border", isDark ? preset.borderDark : preset.border);
  s.setProperty("--accent-gradient", `linear-gradient(135deg, ${isDark ? preset.accentDark : preset.accent}, ${isDark ? preset.hoverDark : preset.hover})`);
  s.setProperty("--focus-ring", `rgba(${hexToRgb(isDark ? preset.accentDark : preset.accent)}, 0.2)`);
}

/** Convert hex color to "r, g, b" string */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
