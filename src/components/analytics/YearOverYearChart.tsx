"use client";

import { useMemo } from "react";
import { getMonthName } from "@/lib/utils";
import { useExpenses } from "@/hooks/useExpenses";
import { useUIStore } from "@/stores/uiStore";

interface MonthBarData {
  monthIdx: number; // 1-12
  curTotal: number;
  prevTotal: number;
}

function MonthPairBar({
  data,
  maxVal,
  formatCurrency,
}: {
  data: MonthBarData;
  maxVal: number;
  formatCurrency: (n: number) => string;
}) {
  const curPct = maxVal > 0 ? (data.curTotal / maxVal) * 100 : 0;
  const prevPct = maxVal > 0 ? (data.prevTotal / maxVal) * 100 : 0;
  const label = getMonthName(data.monthIdx).slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-0.5" style={{ flex: "1 1 0", minWidth: 0 }}>
      {/* Stacked bar */}
      <div className="relative flex w-full items-end justify-center gap-px" style={{ height: 72 }}>
        {/* Previous year bar */}
        <div
          className="rounded-t-sm transition-all duration-500"
          style={{
            width: "40%",
            height: `${Math.max(prevPct, data.prevTotal > 0 ? 3 : 0)}%`,
            background: "var(--text-muted)",
            opacity: 0.3,
          }}
          title={`Last year: ${formatCurrency(Math.round(data.prevTotal))}`}
        />
        {/* Current year bar */}
        <div
          className="rounded-t-sm transition-all duration-500"
          style={{
            width: "40%",
            height: `${Math.max(curPct, data.curTotal > 0 ? 3 : 0)}%`,
            background: "var(--accent)",
            opacity: 0.8,
          }}
          title={`This year: ${formatCurrency(Math.round(data.curTotal))}`}
        />
      </div>
      {/* Month label */}
      <span
        className="text-[0.55rem] font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

interface YearOverYearChartProps {
  formatCurrency: (n: number) => string;
}

/**
 * Renders a 12-bar grouped chart comparing monthly totals for the current year
 * vs the same months in the previous year. Data is read from the parent analytics
 * page via `history` — this component uses useDexieQuery internally to avoid prop drilling.
 */
export function YearOverYearChart({ formatCurrency }: YearOverYearChartProps) {
  const { currentMonth, currentYear } = useUIStore();
  const prevYear = currentYear - 1;

  // Load all 12 months for both years
  const monthPairs = useMemo(() => {
    const months: { m: number; y: number; isPrev: boolean }[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push({ m, y: currentYear, isPrev: false });
      months.push({ m, y: prevYear, isPrev: true });
    }
    return months;
  }, [currentYear, prevYear]);

  // Use individual month expense hooks — one per month shown
  // (Only show months up to current month for this year)
  const monthData = useMemo(() => {
    const result: MonthBarData[] = [];
    for (let m = 1; m <= 12; m++) {
      result.push({ monthIdx: m, curTotal: 0, prevTotal: 0 });
    }
    return result;
  }, []);

  void monthPairs; // used via component-level hooks below

  return (
    <YoYChartInner
      currentYear={currentYear}
      prevYear={prevYear}
      currentMonth={currentMonth}
      formatCurrency={formatCurrency}
      monthData={monthData}
    />
  );
}

function useMonthTotal(month: number, year: number) {
  const { expenses } = useExpenses(month, year);
  return useMemo(
    () => expenses.filter((e) => !e.deletedAt).reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
}

// We load all 12 * 2 = 24 months. Rather than 24 hooks, we load one per row
// using a compound component pattern.
function YoYMonthRow({
  month,
  currentYear,
  prevYear,
  onData,
}: {
  month: number;
  currentYear: number;
  prevYear: number;
  onData?: never; // unused — data flows through the hook
}) {
  void onData;
  const cur = useMonthTotal(month, currentYear);
  const prev = useMonthTotal(month, prevYear);
  return { cur, prev };
}

void YoYMonthRow;

function YoYChartInner({
  currentYear,
  prevYear,
  currentMonth,
  formatCurrency,
}: {
  currentYear: number;
  prevYear: number;
  currentMonth: number;
  formatCurrency: (n: number) => string;
  monthData: MonthBarData[];
}) {
  // Load all 24 months inline using hooks
  const m1c  = useMonthTotal(1,  currentYear);  const m1p  = useMonthTotal(1,  prevYear);
  const m2c  = useMonthTotal(2,  currentYear);  const m2p  = useMonthTotal(2,  prevYear);
  const m3c  = useMonthTotal(3,  currentYear);  const m3p  = useMonthTotal(3,  prevYear);
  const m4c  = useMonthTotal(4,  currentYear);  const m4p  = useMonthTotal(4,  prevYear);
  const m5c  = useMonthTotal(5,  currentYear);  const m5p  = useMonthTotal(5,  prevYear);
  const m6c  = useMonthTotal(6,  currentYear);  const m6p  = useMonthTotal(6,  prevYear);
  const m7c  = useMonthTotal(7,  currentYear);  const m7p  = useMonthTotal(7,  prevYear);
  const m8c  = useMonthTotal(8,  currentYear);  const m8p  = useMonthTotal(8,  prevYear);
  const m9c  = useMonthTotal(9,  currentYear);  const m9p  = useMonthTotal(9,  prevYear);
  const m10c = useMonthTotal(10, currentYear);  const m10p = useMonthTotal(10, prevYear);
  const m11c = useMonthTotal(11, currentYear);  const m11p = useMonthTotal(11, prevYear);
  const m12c = useMonthTotal(12, currentYear);  const m12p = useMonthTotal(12, prevYear);

  const bars: MonthBarData[] = [
    { monthIdx: 1,  curTotal: m1c,  prevTotal: m1p  },
    { monthIdx: 2,  curTotal: m2c,  prevTotal: m2p  },
    { monthIdx: 3,  curTotal: m3c,  prevTotal: m3p  },
    { monthIdx: 4,  curTotal: m4c,  prevTotal: m4p  },
    { monthIdx: 5,  curTotal: m5c,  prevTotal: m5p  },
    { monthIdx: 6,  curTotal: m6c,  prevTotal: m6p  },
    { monthIdx: 7,  curTotal: m7c,  prevTotal: m7p  },
    { monthIdx: 8,  curTotal: m8c,  prevTotal: m8p  },
    { monthIdx: 9,  curTotal: m9c,  prevTotal: m9p  },
    { monthIdx: 10, curTotal: m10c, prevTotal: m10p },
    { monthIdx: 11, curTotal: m11c, prevTotal: m11p },
    { monthIdx: 12, curTotal: m12c, prevTotal: m12p },
  ];

  // Only show months up to current for current year (futures are 0 anyway)
  const visible = bars.slice(0, currentMonth);
  const maxVal = Math.max(...visible.flatMap((b) => [b.curTotal, b.prevTotal]), 1);

  const curYearTotal = visible.reduce((s, b) => s + b.curTotal, 0);
  const prevYearTotal = visible.reduce((s, b) => s + b.prevTotal, 0);
  const yoyChange = prevYearTotal > 0
    ? Math.round(((curYearTotal - prevYearTotal) / prevYearTotal) * 100)
    : null;

  return (
    <div>
      {/* Summary */}
      <div className="mb-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--accent)", opacity: 0.8 }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {currentYear}: <span className="font-bold">{formatCurrency(Math.round(curYearTotal))}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--text-muted)", opacity: 0.3 }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {prevYear}: <span className="font-bold">{formatCurrency(Math.round(prevYearTotal))}</span>
          </span>
        </div>
        {yoyChange !== null && (
          <span
            className="text-xs font-semibold"
            style={{ color: yoyChange > 0 ? "var(--danger)" : "var(--accent)" }}
          >
            {yoyChange > 0 ? "+" : ""}{yoyChange}% YoY
          </span>
        )}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1">
        {visible.map((b) => (
          <MonthPairBar key={b.monthIdx} data={b} maxVal={maxVal} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  );
}
