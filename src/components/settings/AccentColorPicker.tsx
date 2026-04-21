"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { m } from "framer-motion";
import { Check, Pipette } from "lucide-react";

interface AccentColorPickerProps {
  currentColor?: string;
  onSelect: (color: string) => void;
}

export const ACCENT_PRESETS = [
  { id: "moss",   label: "Moss",   accent: "#2D6B5A", accentDark: "#7BAF9E", soft: "#BDD9D0", softDark: "rgba(123,175,158,0.14)", hover: "#1B5B4A", hoverDark: "#A3C4A0", deep: "#1A4A3C", deepDark: "#5A9680", border: "#7BAF9E", borderDark: "rgba(123,175,158,0.35)" },
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
  const isCustom = selected.startsWith("#");
  const [hexInput, setHexInput] = useState(isCustom ? selected : "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const gradientRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Keep hex input in sync with external changes
  useEffect(() => {
    if (isCustom) setHexInput(selected);
  }, [selected, isCustom]);

  const handleHexChange = (value: string) => {
    const clean = value.startsWith("#") ? value : `#${value}`;
    setHexInput(clean);
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      onSelect(clean);
    }
  };

  const pickColorFromGradient = useCallback((clientX: number) => {
    const el = gradientRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = x / rect.width;
    // Map position to hue (0-360), with saturation/lightness for pleasant palette
    const hue = Math.round(pct * 360);
    const hex = hslToHex(hue, 65, 50);
    setHexInput(hex);
    onSelect(hex);
  }, [onSelect]);

  const handleGradientPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pickColorFromGradient(e.clientX);
  }, [pickColorFromGradient]);

  const handleGradientPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    pickColorFromGradient(e.clientX);
  }, [pickColorFromGradient]);

  const handleGradientPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Compute thumb position from current custom color
  const thumbPct = isCustom ? hueFromHex(selected) / 360 * 100 : 50;

  return (
    <div>
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Accent color">
        {ACCENT_PRESETS.map((preset) => {
          const isActive = selected === preset.id;
          return (
            <button
              key={preset.id}
              role="radio"
              aria-checked={isActive}
              aria-label={preset.label}
              onClick={() => { onSelect(preset.id); setHexInput(""); setPickerOpen(false); }}
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

      {/* Custom color toggle */}
      <button
        onClick={() => setPickerOpen(!pickerOpen)}
        className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all w-full"
        style={{
          background: pickerOpen || isCustom ? "var(--surface-secondary)" : "transparent",
          color: "var(--text-muted)",
        }}
      >
        <Pipette size={14} />
        Custom color
        {isCustom && (
          <span
            className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px]"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full border"
              style={{ background: selected, borderColor: selected }}
            />
            {selected.toUpperCase()}
          </span>
        )}
      </button>

      {/* Gradient color picker */}
      {pickerOpen && (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="pt-3 px-1 space-y-3">
            {/* Gradient strip */}
            <div className="relative">
              <div
                ref={gradientRef}
                onPointerDown={handleGradientPointerDown}
                onPointerMove={handleGradientPointerMove}
                onPointerUp={handleGradientPointerUp}
                className="h-10 w-full rounded-xl cursor-crosshair touch-none"
                style={{
                  background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                }}
              />
              {/* Thumb indicator */}
              {isCustom && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ left: `${thumbPct}%` }}
                >
                  <div
                    className="h-6 w-6 rounded-full border-2 border-white shadow-md"
                    style={{ background: selected, boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}
                  />
                </div>
              )}
            </div>

            {/* Hex input + preview */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg shrink-0 border"
                style={{
                  background: isCustom ? selected : hexInput && /^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : "var(--surface-secondary)",
                  borderColor: isCustom ? selected : "var(--border)",
                }}
              />
              <input
                type="text"
                placeholder="#A1B2C3"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                maxLength={7}
                className="flex-1 rounded-lg border px-3 py-2 text-xs font-mono"
                style={{
                  background: "var(--surface-secondary)",
                  borderColor: isCustom ? "var(--accent)" : "var(--border)",
                  color: "var(--text-primary)",
                }}
                aria-label="Custom hex color"
              />
            </div>
          </div>
        </m.div>
      )}
    </div>
  );
}

/** Apply accent color CSS variables to the document root */
export function applyAccentColor(colorId: string | undefined) {
  if (typeof document === "undefined") return;

  // Custom hex color
  if (colorId && colorId.startsWith("#") && /^#[0-9A-Fa-f]{6}$/.test(colorId)) {
    const isDark = document.documentElement.classList.contains("dark");
    const s = document.documentElement.style;
    const rgb = hexToRgb(colorId);
    // Generate lighter/darker variants
    const lighter = lightenHex(colorId, 0.3);
    const darker = darkenHex(colorId, 0.2);
    const accent = isDark ? lighter : colorId;
    const hover = isDark ? lightenHex(colorId, 0.15) : darker;
    const deep = isDark ? colorId : darkenHex(colorId, 0.35);
    s.setProperty("--accent", accent);
    s.setProperty("--accent-soft", isDark ? `rgba(${hexToRgb(lighter)}, 0.14)` : lightenHex(colorId, 0.85));
    s.setProperty("--accent-hover", hover);
    s.setProperty("--accent-deep", deep);
    s.setProperty("--accent-border", isDark ? `rgba(${hexToRgb(lighter)}, 0.35)` : lighter);
    s.setProperty("--accent-gradient", `linear-gradient(135deg, ${accent}, ${hover})`);
    s.setProperty("--focus-ring", `rgba(${rgb}, 0.2)`);
    return;
  }

  const preset = ACCENT_PRESETS.find((p) => p.id === colorId) ?? ACCENT_PRESETS[0];
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

function lightenHex(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount));
  const g = Math.min(255, Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amount));
  const b = Math.min(255, Math.round((n & 255) + (255 - (n & 255)) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darkenHex(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Convert HSL to hex string */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Extract approximate hue (0-360) from a hex color */
function hueFromHex(hex: string): number {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue = Math.round(hue * 60);
  return hue < 0 ? hue + 360 : hue;
}
