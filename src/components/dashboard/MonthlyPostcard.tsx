"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Share2, Download, X, Check } from "lucide-react";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useUIStore } from "@/stores/uiStore";
import { useSettings } from "@/hooks/useSettings";
import { useCurrency } from "@/hooks/useCurrency";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useExpenses } from "@/hooks/useExpenses";
import { getMonthName } from "@/lib/utils";
import { getMonthNarrative, getWeekInsight } from "@/lib/chronicle";
import { buildCategoryMap } from "@/lib/categories";

/**
 * Monthly Postcard — branded shareable summary image.
 *
 * Renders a canvas-based postcard with:
 * - Month name (display font style)
 * - Total spent (large)
 * - Top 3 category bars
 * - One line of narrative
 * - ExpenStream terrain watermark
 *
 * Uses Web Share API when available, falls back to download.
 */
export function MonthlyPostcard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const { currentMonth, currentYear } = useUIStore();
  const { monthlyTotal, effectiveBudget, categoryTotals, dailyTotals, daysInMonth } =
    useCalculationsContext();
  const { settings } = useSettings();
  const { formatCurrency } = useCurrency();
  const { expenses } = useExpenses(currentMonth, currentYear);
  useHistoricalData(currentMonth, currentYear, 1);

  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const topCategories = useMemo(
    () =>
      [...categoryTotals]
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3),
    [categoryTotals],
  );

  const narrative = useMemo(
    () => getMonthNarrative(monthlyTotal, effectiveBudget, currentMonth, currentYear, formatCurrency),
    [monthlyTotal, effectiveBudget, currentMonth, currentYear, formatCurrency],
  );

  const weekLine = useMemo(
    () => getWeekInsight(dailyTotals, formatCurrency),
    [dailyTotals, formatCurrency],
  );

  const hasData = expenses.filter((e) => !e.deletedAt).length > 0;

  const drawPostcard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const dpr = 1; // already at high res
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, W, H);

    // Subtle terrain gradient at bottom
    const grad = ctx.createLinearGradient(0, H * 0.7, 0, H);
    grad.addColorStop(0, "rgba(200,217,196,0)");
    grad.addColorStop(1, "rgba(200,217,196,0.3)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw terrain ridge waves at bottom
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#3D5A3E";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) {
      const y = H - 80 - Math.sin(x / 60) * 25 - Math.sin(x / 30) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#8FAF8B";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) {
      const y = H - 50 - Math.sin(x / 45 + 1) * 18 - Math.cos(x / 25) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Month name — serif italic style
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "italic 72px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(`${getMonthName(currentMonth)} ${currentYear}`, 80, 160);

    // Divider line
    ctx.fillStyle = "#3D5A3E";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(80, 185, 80, 2);
    ctx.globalAlpha = 1;

    // Total amount — large monospace
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "bold 96px 'Courier New', monospace";
    ctx.fillText(formatCurrency(monthlyTotal), 80, 320);

    // Budget context
    if (effectiveBudget > 0) {
      const remaining = effectiveBudget - monthlyTotal;
      ctx.fillStyle = remaining >= 0 ? "#2D6A4F" : "#C0392B";
      ctx.font = "500 32px system-ui, sans-serif";
      ctx.fillText(
        remaining >= 0
          ? `${formatCurrency(remaining)} under budget`
          : `${formatCurrency(Math.abs(remaining))} over budget`,
        80,
        375,
      );
    }

    // Narrative prose
    ctx.fillStyle = "#4A4E6B";
    ctx.font = "300 30px system-ui, sans-serif";
    const lines = wrapText(ctx, narrative, W - 160);
    let textY = 450;
    for (const line of lines) {
      ctx.fillText(line, 80, textY);
      textY += 42;
    }

    // Week insight
    if (weekLine) {
      ctx.fillStyle = "#7A7F96";
      ctx.font = "italic 26px Georgia, serif";
      textY += 20;
      ctx.fillText(weekLine, 80, textY);
      textY += 50;
    } else {
      textY += 30;
    }

    // Top 3 categories — horizontal bars
    const barStartY = Math.max(textY + 20, 620);
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("Top categories", 80, barStartY);

    const maxCatTotal = topCategories[0]?.total ?? 1;
    const barMaxWidth = W - 280;

    topCategories.forEach((cat, i) => {
      const y = barStartY + 50 + i * 90;
      const meta = catMap[cat.category];
      const label = meta?.label ?? cat.category;
      const color = meta?.color ?? "#8FAF8B";
      const barW = Math.max((cat.total / maxCatTotal) * barMaxWidth, 20);

      // Category label
      ctx.fillStyle = "#4A4E6B";
      ctx.font = "500 26px system-ui, sans-serif";
      ctx.fillText(label, 80, y + 4);

      // Bar
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      roundRect(ctx, 80, y + 14, barW, 22, 6);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Amount
      ctx.fillStyle = "#1A1B2E";
      ctx.font = "600 24px 'Courier New', monospace";
      ctx.fillText(formatCurrency(cat.total), 80 + barW + 16, y + 34);
    });

    // Daily spending mini chart (bottom section)
    const chartY = barStartY + 50 + topCategories.length * 90 + 60;
    const chartH = 80;
    const chartW = W - 160;
    const maxDay = Math.max(...dailyTotals.map((d) => d.total), 1);

    ctx.fillStyle = "#1A1B2E";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(`${daysInMonth} days`, 80, chartY);

    dailyTotals.forEach((dt) => {
      const x = 80 + ((dt.day - 1) / (daysInMonth - 1)) * chartW;
      const h = (dt.total / maxDay) * chartH;
      const barW = Math.max(chartW / daysInMonth - 2, 3);
      ctx.fillStyle = "#3D5A3E";
      ctx.globalAlpha = dt.total > 0 ? 0.5 : 0.08;
      roundRect(ctx, x, chartY + 20 + (chartH - h), barW, Math.max(h, 2), 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Watermark
    ctx.fillStyle = "#3D5A3E";
    ctx.globalAlpha = 0.25;
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("ExpenStream", W - 80, H - 40);
    ctx.globalAlpha = 1;

    // Three dots watermark (terrain signature)
    const dotCx = W - 210;
    const dotCy = H - 44;
    ctx.fillStyle = "#3D5A3E";
    ctx.globalAlpha = 0.25;
    [[0, -6], [-6, 4], [6, 4]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dotCx + dx, dotCy + dy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }, [currentMonth, currentYear, monthlyTotal, effectiveBudget, formatCurrency, narrative, weekLine, topCategories, catMap, dailyTotals, daysInMonth]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setShared(false);
    // Draw after DOM update
    requestAnimationFrame(() => {
      requestAnimationFrame(drawPostcard);
    });
  }, [drawPostcard]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenstream-${getMonthName(currentMonth).toLowerCase()}-${currentYear}.png`;
    a.click();
    setShared(true);
  }, [currentMonth, currentYear]);

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return;

    const file = new File([blob], `expenstream-${getMonthName(currentMonth).toLowerCase()}-${currentYear}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `${getMonthName(currentMonth)} ${currentYear} — ExpenStream`,
          files: [file],
        });
        setShared(true);
      } catch {
        // User cancelled share — no error
      }
    } else {
      handleDownload();
    }
  }, [currentMonth, currentYear, handleDownload]);

  if (!hasData) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors"
        style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
      >
        <Share2 size={14} />
        Share month
      </button>

      <AnimatePresence>
        {open && (
          <m.div
            className="fixed inset-0 z-[300] flex items-center justify-center backdrop-blur-sm"
            initial={{ backgroundColor: "rgba(0,0,0,0)" }}
            animate={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            exit={{ backgroundColor: "rgba(0,0,0,0)" }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <m.div
              className="relative mx-4 flex max-h-[85dvh] max-w-sm flex-col overflow-hidden rounded-2xl shadow-xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Monthly Postcard
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Canvas preview */}
              <div className="overflow-y-auto px-4">
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-xl"
                  style={{
                    aspectRatio: "1080 / 1350",
                    border: "1px solid var(--border-subtle)",
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 p-4">
                <m.button
                  onClick={handleShare}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  {shared ? <Check size={16} /> : <Share2 size={16} />}
                  {shared ? "Shared!" : "Share"}
                </m.button>
                <m.button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                  style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download size={16} />
                  Save
                </m.button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Canvas helpers ────────────────────── */

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
