"use client";

import { Suspense, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { PageTransition } from "@/components/ui/PageTransition";
import { useUIStore } from "@/stores/uiStore";
import { useMonthUrlSync } from "@/hooks/useMonthUrlSync";
import { usePageTitle } from "@/hooks/usePageTitle";
import { m } from "framer-motion";
import { useCalculationsContext } from "@/contexts/CalculationsContext";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useSettings } from "@/hooks/useSettings";
import { buildCategoryMap } from "@/lib/categories";
import { useCurrency } from "@/hooks/useCurrency";
import { getDaysInMonth, getMonthName } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Repeat,
  Zap,
  BarChart3,
  DollarSign,
  Award,
  ChevronDown,
  Share2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { FogOverlook } from "@/components/ui/illustrations/terrain";
import { EmptyState } from "@/components/ui/EmptyState";
import { InsightCard } from "@/components/analytics/InsightCard";
import { AnimatePresence } from "framer-motion";
const ChronicleView = dynamic(() => import("@/components/dashboard/ChronicleView").then(m => ({ default: m.ChronicleView })), { ssr: false });
const TimeMachine = dynamic(() => import("@/components/analytics/TimeMachine").then(m => ({ default: m.TimeMachine })), { ssr: false });
const CategorySeasons = dynamic(() => import("@/components/analytics/CategorySeasons").then(m => ({ default: m.CategorySeasons })), { ssr: false });

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsShell />
    </Suspense>
  );
}

/** Thin wrapper so AnalyticsContent renders INSIDE AppShell / CalculationsProvider */
function AnalyticsShell() {
  return (
    <AppShell>
      <AnalyticsContent />
    </AppShell>
  );
}

function AnalyticsContent() {
  usePageTitle("Analytics");
  useMonthUrlSync();
  const [deepCoreOpen, setDeepCoreOpen] = useState(false);
  const { currentMonth, currentYear } = useUIStore();
  const { effectiveBudget, anomalies } = useCalculationsContext();
  const { settings } = useSettings();
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const { toast } = useToast();
  const router = useRouter();
  const history = useHistoricalData(currentMonth, currentYear, 6);

  const catMap = useMemo(
    () => buildCategoryMap(settings.customCategories, settings.hiddenDefaults),
    [settings.customCategories, settings.hiddenDefaults],
  );

  const maxMonthTotal = Math.max(...history.months.map((m) => m.total), 1);

  const topCats = useMemo(() => {
    return history.topCategoriesAllTime.slice(0, 6);
  }, [history.topCategoriesAllTime]);

  // Generate the single most notable headline for this month
  const monthHeadline = useMemo(() => {
    const cur = history.currentMonth;
    const mom = history.monthOverMonthChange;
    const topCat = history.topCategoriesAllTime[0];
    if (!cur || cur.total === 0) return null;

    // Over-budget alert takes priority
    if (effectiveBudget > 0 && cur.total > effectiveBudget) {
      const over = cur.total - effectiveBudget;
      return { text: `You're ${formatCurrencyCompact(over)} over budget this month.`, tone: "danger" as const };
    }
    // Month-over-month change
    if (mom !== null && Math.abs(mom) >= 10) {
      const dir = mom > 0 ? "up" : "down";
      const pct = Math.abs(Math.round(mom));
      const tone = mom > 20 ? "warning" as const : mom < -10 ? "success" as const : "neutral" as const;
      return { text: `Spending is ${dir} ${pct}% vs last month.`, tone };
    }
    // Top category dominance
    if (topCat && cur.total > 0) {
      const pct = Math.round((topCat.total / cur.total) * 100);
      if (pct >= 35) {
        const label = catMap[topCat.category]?.label ?? topCat.category;
        return { text: `${label} accounts for ${pct}% of your spend this month.`, tone: "neutral" as const };
      }
    }
    // On-track positive
    if (effectiveBudget > 0) {
      const pct = Math.round((cur.total / effectiveBudget) * 100);
      if (pct <= 75) return { text: `You're ${pct}% through your budget — on track.`, tone: "success" as const };
    }
    return null;
  }, [history, effectiveBudget, catMap, formatCurrencyCompact]);

  // Share analytics summary as branded image (matches dashboard postcard style)
  const handleShareAnalytics = useCallback(async () => {
   try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // ── Background ──
    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, W, H);

    // Subtle terrain gradient at bottom
    const grad = ctx.createLinearGradient(0, H * 0.7, 0, H);
    grad.addColorStop(0, "rgba(200,217,196,0)");
    grad.addColorStop(1, "rgba(200,217,196,0.3)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Terrain ridge waves at bottom
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#2D6B5A";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) {
      const y = H - 80 - Math.sin(x / 60) * 25 - Math.sin(x / 30) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#7BAF9E";
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

    const monthLabel = getMonthName(currentMonth);
    const currentMd = history.currentMonth;
    const total = currentMd ? currentMd.expenses.reduce((s, e) => s + e.amount, 0) : 0;

    // ── Title ──
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "italic 72px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText(`Analytics`, 80, 130);

    // Subtitle — month + year
    ctx.fillStyle = "#4A4E6B";
    ctx.font = "300 36px system-ui, sans-serif";
    ctx.fillText(`${monthLabel} ${currentYear}`, 80, 180);

    // Divider
    ctx.fillStyle = "#2D6B5A";
    ctx.globalAlpha = 0.4;
    ctx.fillRect(80, 200, 80, 2);
    ctx.globalAlpha = 1;

    // ── Total Amount ──
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "bold 80px 'Courier New', monospace";
    ctx.fillText(formatCurrency(total), 80, 300);

    // Budget context
    if (effectiveBudget > 0) {
      const rem = effectiveBudget - total;
      ctx.fillStyle = rem >= 0 ? "#1B5B4A" : "#C0392B";
      ctx.font = "500 30px system-ui, sans-serif";
      ctx.fillText(
        rem >= 0 ? `${formatCurrency(rem)} under budget` : `${formatCurrency(Math.abs(rem))} over budget`,
        80, 350,
      );
    }

    // ── 6-Month Ridge Chart ──
    const ridgeStartY = 410;
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("6-Month Ridge", 80, ridgeStartY);

    const ridgeBarMaxW = W - 300;
    const maxTotal = Math.max(...history.months.map((m) => m.total), 1);
    history.months.forEach((md, i) => {
      const y = ridgeStartY + 45 + i * 56;
      const isCurrent = md.month === currentMonth && md.year === currentYear;
      const barW = Math.max((md.total / maxTotal) * ridgeBarMaxW, 8);

      // Month label
      ctx.fillStyle = isCurrent ? "#1A1B2E" : "#7A7F96";
      ctx.font = "500 22px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(md.label, 160, y + 4);
      ctx.textAlign = "left";

      // Bar
      ctx.fillStyle = isCurrent ? "#2D6B5A" : "#7A7F96";
      ctx.globalAlpha = isCurrent ? 0.9 : 0.3;
      roundRect(ctx, 180, y - 12, barW, 22, 6);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Amount
      ctx.fillStyle = "#1A1B2E";
      ctx.font = "600 20px 'Courier New', monospace";
      ctx.fillText(formatCurrencyCompact(md.total), 180 + barW + 14, y + 4);
    });

    // Budget marker line
    if (effectiveBudget > 0) {
      const budgetX = 180 + (effectiveBudget / maxTotal) * ridgeBarMaxW;
      ctx.strokeStyle = "#C0392B";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(budgetX, ridgeStartY + 30);
      ctx.lineTo(budgetX, ridgeStartY + 45 + history.months.length * 56 - 20);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // ── Weather Metrics Grid ──
    const metricsY = ridgeStartY + 45 + history.months.length * 56 + 40;
    ctx.fillStyle = "#1A1B2E";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText("Key Metrics", 80, metricsY);

    const metrics = [
      { label: "Avg Monthly", value: formatCurrencyCompact(history.avgMonthlySpend) },
      {
        label: "vs Last Month",
        value: history.monthOverMonthChange !== null
          ? `${history.monthOverMonthChange > 0 ? "+" : ""}${history.monthOverMonthChange.toFixed(1)}%`
          : "—",
      },
      { label: "Recurring", value: formatCurrencyCompact(history.recurringVsOneTime.recurring) },
      {
        label: "Top Category",
        value: topCats.length > 0 ? (catMap[topCats[0].category]?.label ?? topCats[0].category) : "—",
      },
    ];

    const gridCols = 2;
    const cellW = (W - 160 - 30) / gridCols;
    const cellH = 90;
    metrics.forEach((m, i) => {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);
      const cx = 80 + col * (cellW + 30);
      const cy = metricsY + 30 + row * cellH;

      // Card background
      ctx.fillStyle = "#EDEBE6";
      ctx.globalAlpha = 0.6;
      roundRect(ctx, cx, cy, cellW, cellH - 10, 12);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label
      ctx.fillStyle = "#7A7F96";
      ctx.font = "600 18px system-ui, sans-serif";
      ctx.fillText(m.label.toUpperCase(), cx + 16, cy + 30);

      // Value
      ctx.fillStyle = "#1A1B2E";
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.fillText(m.value, cx + 16, cy + 64);
    });

    // ── Watermark ──
    ctx.fillStyle = "#2D6B5A";
    ctx.globalAlpha = 0.25;
    ctx.font = "500 22px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("ExpenStream", W - 80, H - 40);
    ctx.globalAlpha = 1;

    // Three dots watermark (terrain signature)
    const dotCx = W - 210;
    const dotCy = H - 44;
    ctx.fillStyle = "#2D6B5A";
    ctx.globalAlpha = 0.25;
    [[0, -6], [-6, 4], [6, 4]].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(dotCx + dx, dotCy + dy, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    // ── Share ──
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) return;

    const fileName = `expenstream-analytics-${monthLabel.toLowerCase()}-${currentYear}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: `Analytics · ${monthLabel} ${currentYear} — ExpenStream`,
            files: [file],
          });
          return;
        }
      } catch { /* user cancelled or not supported */ }
    }

    // Fallback: download via blob URL (more reliable on mobile PWAs than data URL)
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Clean up after a brief delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
   } catch (err) {
    console.error("[analytics:share]", err);
    toast("Failed to generate share image");
   }
  }, [history, currentMonth, currentYear, formatCurrency, formatCurrencyCompact, effectiveBudget, topCats, catMap, toast]);

  // Cumulative daily spend for burn chart
  const cumulativeData = useMemo(() => {
    if (!history.currentMonth) return [];
    const { expenses } = history.currentMonth;
    const byDay: Record<number, number> = {};
    for (const e of expenses) {
      byDay[e.day] = (byDay[e.day] || 0) + e.amount;
    }
    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() + 1 && currentYear === today.getFullYear();
    const lastDay = isCurrentMonth ? today.getDate() : 31;
    const result: { day: number; cumulative: number }[] = [];
    let cum = 0;
    for (let d = 1; d <= lastDay; d++) {
      cum += byDay[d] || 0;
      result.push({ day: d, cumulative: cum });
    }
    return result;
  }, [history.currentMonth, currentMonth, currentYear]);

  const maxCumulative = Math.max(
    cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].cumulative : 0,
    effectiveBudget,
    1,
  );

  const MoMIcon =
    history.monthOverMonthChange === null
      ? Minus
      : history.monthOverMonthChange > 0
        ? TrendingUp
        : history.monthOverMonthChange < 0
          ? TrendingDown
          : Minus;

  const momColor =
    history.monthOverMonthChange === null
      ? "var(--text-muted)"
      : history.monthOverMonthChange > 5
        ? "var(--danger)"
        : history.monthOverMonthChange < -5
          ? "var(--success)"
          : "var(--text-secondary)";

  return (
      <PageTransition className="relative mx-auto min-h-[80vh] max-w-4xl xl:max-w-6xl space-y-5 p-4 sm:p-6 lg:p-8">
        {/* ─── Overlook Header ─── */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display italic text-2xl" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
          <div className="flex items-center gap-2">
            {history.months.length > 0 && (
              <button
                type="button"
                onClick={handleShareAnalytics}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{ color: "var(--text-muted)" }}
                aria-label="Share analytics summary"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <SyncIndicator />
          </div>
        </div>
        <MonthSwitcher />

        {/* Empty state */}
        {history.months.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            illustration={<FogOverlook />}
            title="Clear skies ahead"
            description="Add at least 3 expenses to unlock spending insights — trends, patterns, and month-over-month comparisons will appear here."
          />
        ) : (
        <>

        {/* Sparse data nudge */}
        {history.currentMonth && history.currentMonth.expenses.length > 0 && history.currentMonth.expenses.length < 3 && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
            style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}
          >
            <BarChart3 size={15} style={{ color: "var(--accent)" }} />
            <p style={{ color: "var(--text-secondary)" }}>
              Add <strong>{3 - history.currentMonth.expenses.length} more expense{3 - history.currentMonth.expenses.length > 1 ? "s" : ""}</strong> to unlock full analytics for this month.
            </p>
          </div>
        )}

        {/* ─── 0. Month Headline ─── */}
        {monthHeadline && (
          <m.div
            className="card-terrain px-4 py-3 flex items-center gap-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: monthHeadline.tone === "danger" ? "var(--danger)" :
                  monthHeadline.tone === "warning" ? "var(--warning)" :
                  monthHeadline.tone === "success" ? "var(--success, #22c55e)" :
                  "var(--accent)",
              }}
            />
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {monthHeadline.text}
            </p>
          </m.div>
        )}

        {/* ─── 1. RidgeLine Hero (6-month terrain ridge) ─── */}
        <m.div
          className="card-terrain p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} style={{ color: "var(--accent)" }} />
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              6-Month Ridge
            </h3>
          </div>
          <div className="mt-3 space-y-2">
            {history.months.map((md) => {
              const pct = (md.total / maxMonthTotal) * 100;
              const isCurrent = md.month === currentMonth && md.year === currentYear;
              return (
                <div key={`${md.year}-${md.month}`} className="flex items-center gap-3">
                  <span
                    className="w-14 shrink-0 text-xs font-medium text-right"
                    style={{ color: isCurrent ? "var(--text-primary)" : "var(--text-tertiary)" }}
                  >
                    {md.label}
                  </span>
                  <div className="relative flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 1)}%`,
                        background: isCurrent ? "var(--accent)" : "var(--es-sage, var(--text-muted))",
                        opacity: isCurrent ? 1 : 0.4,
                      }}
                    />
                    {effectiveBudget > 0 && md.total > 0 && (
                      <div
                        className="absolute top-0 h-full w-0.5"
                        style={{
                          left: `${Math.min((effectiveBudget / maxMonthTotal) * 100, 100)}%`,
                          background: "var(--es-clay, var(--danger))",
                          opacity: 0.7,
                        }}
                      />
                    )}
                  </div>
                  <span className="w-20 shrink-0 text-xs font-numeric font-semibold tabular-nums text-right" style={{ color: "var(--text-secondary)" }}>
                    {formatCurrencyCompact(md.total)}
                  </span>
                </div>
              );
            })}
          </div>
          {effectiveBudget > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Marker = budget ({formatCurrencyCompact(effectiveBudget)})
            </p>
          )}
        </m.div>

        {/* ─── 2. Insights Feed ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <InsightCard
            icon={DollarSign}
            title="Avg Monthly"
            value={formatCurrencyCompact(history.avgMonthlySpend)}
            sparkData={history.months.map((m) => m.total)}
            onClick={() => router.push("/expenses")}
          />
          <InsightCard
            icon={MoMIcon}
            title="vs Last Month"
            value={history.monthOverMonthChange !== null
              ? `${history.monthOverMonthChange > 0 ? "+" : ""}${history.monthOverMonthChange.toFixed(1)}%`
              : "—"}
            accentColor={momColor}
            onClick={() => router.push("/expenses")}
          />
          <InsightCard
            icon={Repeat}
            title="Recurring"
            value={formatCurrencyCompact(history.recurringVsOneTime.recurring)}
            subtitle={`vs ${formatCurrencyCompact(history.recurringVsOneTime.oneTime)} one-time`}
            onClick={() => router.push("/expenses?recurring=true")}
          />
          <InsightCard
            icon={Zap}
            title="Top Category"
            value={topCats.length > 0 ? (catMap[topCats[0].category]?.label ?? topCats[0].category) : "—"}
            subtitle={topCats.length > 0 ? `${formatCurrencyCompact(topCats[0].total)} all-time` : "no data"}
            onClick={topCats.length > 0 ? () => router.push(`/expenses?category=${topCats[0].category}`) : undefined}
          />
        </div>

        {/* ─── 3. Strata — Spending Velocity + Biggest Expenses ─── */}
        <div className="grid gap-4 md:grid-cols-2">
          <m.div
            className="card-terrain p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Spending Velocity
              </h3>
            </div>
            {history.spendingByWeek.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Not enough data yet</p>
            ) : (() => {
              const weeks = history.spendingByWeek;
              const maxWeekTotal = Math.max(...weeks.map((w) => w.total), 1);
              const idealWeekly = effectiveBudget > 0 ? effectiveBudget / Math.ceil(getDaysInMonth(currentMonth, currentYear) / 7) : 0;
              return (
                <>
                  <div className="flex items-end gap-3 h-28">
                    {weeks.map((w, i) => {
                      const pct = (w.total / maxWeekTotal) * 100;
                      const overBudget = idealWeekly > 0 && w.total > idealWeekly;
                      const prevTotal = i > 0 ? weeks[i - 1].total : null;
                      const delta = prevTotal !== null && prevTotal > 0 ? ((w.total - prevTotal) / prevTotal) * 100 : null;
                      return (
                        <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full relative" style={{ height: "80px" }}>
                            <div
                              className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                              style={{
                                height: `${Math.max(pct, 4)}%`,
                                background: overBudget ? "var(--es-clay)" : "var(--accent)",
                                opacity: i === weeks.length - 1 ? 0.9 : 0.45,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
                            W{w.week}
                          </span>
                          <span className="text-[10px] font-numeric" style={{ color: "var(--text-muted)" }}>
                            {formatCurrencyCompact(w.total)}
                          </span>
                          {delta !== null && (
                            <span className="text-[9px] font-medium" style={{ color: delta > 10 ? "var(--es-clay)" : delta < -10 ? "var(--success)" : "var(--text-muted)" }}>
                              {delta > 0 ? "+" : ""}{Math.round(delta)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {idealWeekly > 0 && (
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                      Budget pace: {formatCurrencyCompact(idealWeekly)}/week
                    </p>
                  )}
                  {idealWeekly === 0 && weeks.length >= 2 && (
                    <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
                      {weeks[weeks.length - 1].total > weeks[weeks.length - 2].total
                        ? "Pace is rising — spending picked up this week"
                        : weeks[weeks.length - 1].total < weeks[weeks.length - 2].total * 0.7
                          ? "Pace slowed — lighter week"
                          : "Steady pace across weeks"}
                    </p>
                  )}
                </>
              );
            })()}
          </m.div>

          <m.div
            className="card-terrain p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Biggest This Month
              </h3>
            </div>
            {history.biggestExpenses.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                No expenses yet this month
              </p>
            ) : (
              <div className="space-y-2.5">
                {history.biggestExpenses.map((e, i) => {
                  const cat = catMap[e.category];
                  return (
                    <div key={e.id} className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          background: cat?.bgColor || "var(--surface-secondary)",
                          color: cat?.color || "var(--text-muted)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {e.remark || cat?.label || e.category}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {cat?.label || e.category} · Day {e.day}
                        </p>
                      </div>
                      <span className="text-sm font-bold font-numeric shrink-0" style={{ color: cat?.color || "var(--text-primary)" }}>
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </m.div>
        </div>

        {/* ─── 4. Deep Dive (collapsible — Chronicle, TimeMachine, CategorySeasons, Deep Core) ─── */}
        <m.div
          className="card-terrain overflow-hidden"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="button"
            onClick={() => setDeepCoreOpen((v) => !v)}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Deep Dive
            </h3>
            <m.span
              animate={{ rotate: deepCoreOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: "var(--text-muted)", display: "inline-flex" }}
            >
              <ChevronDown size={16} />
            </m.span>
          </button>

          <AnimatePresence initial={false}>
            {deepCoreOpen && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-5">
                  {/* Chronicle */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                      Chronicle
                    </h4>
                    <ChronicleView />
                  </div>

                  {/* Time Machine */}
                  <TimeMachine />

                  {/* Category Seasons */}
                  <CategorySeasons />
              {/* Cumulative Burn Chart */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                  <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Cumulative Spending
                  </h4>
                </div>
                {cumulativeData.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No spending data to chart yet
                  </p>
                ) : (
                  <div className="relative">
                    <svg viewBox="0 0 400 160" className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Monthly spending trend chart">
                      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                        <line
                          key={frac}
                          x1="40" y1={140 - frac * 120} x2="390" y2={140 - frac * 120}
                          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3 3"
                        />
                      ))}
                      {effectiveBudget > 0 && (
                        <line
                          x1="40" y1={140 - (effectiveBudget / maxCumulative) * 120}
                          x2="390" y2={140 - (effectiveBudget / maxCumulative) * 120}
                          stroke="var(--es-clay)" strokeWidth="1" strokeDasharray="5 3" opacity="0.7"
                        />
                      )}
                      <path
                        d={`M40,140 ${cumulativeData
                          .map((d) => {
                            const x = 40 + ((d.day - 1) / Math.max(cumulativeData.length - 1, 1)) * 350;
                            const y = 140 - (d.cumulative / maxCumulative) * 120;
                            return `L${x},${y}`;
                          })
                          .join(" ")} L${40 + ((cumulativeData.length - 1) / Math.max(cumulativeData.length - 1, 1)) * 350},140 Z`}
                        fill="var(--accent)" opacity="0.12"
                      />
                      <path
                        d={cumulativeData
                          .map((d, i) => {
                            const x = 40 + ((d.day - 1) / Math.max(cumulativeData.length - 1, 1)) * 350;
                            const y = 140 - (d.cumulative / maxCumulative) * 120;
                            return `${i === 0 ? "M" : "L"}${x},${y}`;
                          })
                          .join(" ")}
                        fill="none" stroke="var(--accent)" strokeWidth="2"
                      />
                      <text x="36" y="143" textAnchor="end" fill="var(--text-muted)" fontSize="8">0</text>
                      <text x="36" y={143 - 120} textAnchor="end" fill="var(--text-muted)" fontSize="8">
                        {formatCurrencyCompact(maxCumulative)}
                      </text>
                      <text x="40" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="8">1</text>
                      <text x="390" y="155" textAnchor="middle" fill="var(--text-muted)" fontSize="8">
                        {cumulativeData.length}
                      </text>
                    </svg>
                  </div>
                )}
              </div>

              {/* Anomaly Detection */}
              {anomalies.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} style={{ color: "var(--es-clay)" }} />
                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                      Unusual Spending
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {anomalies.slice(0, 5).map((a) => {
                      const e = a.expense;
                      const cat = catMap[e.category];
                      return (
                        <div key={e.id} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "var(--surface-secondary)" }}>
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: a.zScore >= 4 ? "var(--es-clay)" : "var(--warning, #EAB308)" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {e.remark || cat?.label || e.category}
                            </p>
                            <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                              {cat?.label || e.category} · Day {e.day} · {a.zScore.toFixed(1)}σ above avg
                            </p>
                          </div>
                          <span className="text-sm font-bold font-numeric shrink-0" style={{ color: "var(--es-clay)" }}>
                            {formatCurrency(e.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
                    Expenses significantly above your typical pattern
                  </p>
                </div>
              )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>

        </>
        )}
      </PageTransition>
  );
}

/* ── Canvas helper (polyfill for roundRect which isn't in all browsers) ── */
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
