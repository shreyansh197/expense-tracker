/// <reference types="jest" />
/**
 * Analytics page contracts (M4 · Sprint 4.2): information hierarchy, responsive
 * header, period state synchronisation, and the regressions reported against
 * Analytics (mobile header, ridge period, velocity overlap, hierarchy).
 */
import { readSource, expectBaselineContract, expectTouchTargets, expectSemanticClickTargets } from "./helpers/contractAssertions";

const page = readSource("app/analytics/page.tsx");

describe("AnalyticsPeriodSelector contract", () => {
  const src = readSource("components/analytics/AnalyticsPeriodSelector.tsx");

  test("is a labelled group of toggle buttons with 44px targets", () => {
    expectBaselineContract(src);
    expect(src).toContain('role="group"');
    expect(src).toContain('aria-label="History period"');
    expect(src).toContain("aria-pressed={active}");
    expect(src).toContain("aria-label={`Last ${n} months`}");
    expectTouchTargets(src);
  });

  test("segments can fill the row on mobile instead of squeezing neighbours", () => {
    expect(src).toContain("flex-1");
  });
});

describe("AnalyticsHeader contract (regression: squeezed 3M/6M/12M hid the month controls)", () => {
  const src = readSource("components/analytics/AnalyticsHeader.tsx");

  test("stacks on mobile and joins into one row from md", () => {
    expectBaselineContract(src);
    expect(src).toContain("<header");
    expect(src).toContain("flex flex-col gap-3 md:flex-row md:items-center md:justify-between");
    expect(src).toContain('className="flex-1 md:flex-none"');
  });

  test("keeps the month switcher on its own row and never shrinks it away", () => {
    expect(src).toMatch(/<div className="flex min-w-0 justify-center md:justify-start">\s*<MonthSwitcher \/>/);
    expect(src).not.toMatch(/shrink-0 items-center gap-2">\s*\{\/\* Lookback/);
  });

  test("share is a named 44px button", () => {
    expect(src).toContain('aria-label="Share analytics summary"');
    expect(src).toContain("h-11 min-w-[44px]");
  });
});

describe("AnalyticsSection contract", () => {
  const src = readSource("components/analytics/AnalyticsSection.tsx");

  test("is a section labelled by its h2 and uses tokenised motion", () => {
    expectBaselineContract(src);
    expect(src).toContain("aria-labelledby={headingId}");
    expect(src).toContain("<h2 id={headingId}");
    expect(src).toContain("variants={fadeUp}");
  });
});

describe("ThisMonthOverview contract (hero is a number)", () => {
  const src = readSource("components/analytics/ThisMonthOverview.tsx");

  test("leads with the month's total and plain-language context", () => {
    expectBaselineContract(src);
    expect(src).toContain("aria-labelledby={headingId}");
    expect(src).toContain("text-hero-amount");
    expect(src).toContain('sentences.join(" ")');
  });

  test("keeps projection and anomalies upfront", () => {
    expect(src).toContain("<PredictiveBurnBar");
    expect(src).toContain("<AnomalyCallout");
  });
});

describe("PredictiveBurnBar / AnomalyCallout contracts", () => {
  test("projection is labelled as an estimate and summarised for screen readers", () => {
    const src = readSource("components/analytics/PredictiveBurnBar.tsx");
    expect(src).toContain("confidence estimate");
    expect(src).toContain('role="img"');
    expect(src).toMatch(/aria-label=\{`Spent \$\{formatCurrency\(actual\)\}/);
    expect(src).not.toMatch(/\$\{projectedColor\}\d{2}/);
  });

  test("anomalies are amber, listed, and carry a text reason (no decorative ping loop)", () => {
    const src = readSource("components/analytics/AnomalyCallout.tsx");
    expectBaselineContract(src);
    expect(src).toContain("<m.ul");
    expect(src).toContain("var(--warning-soft)");
    expect(src).not.toContain("animate-ping");
    expect(src).not.toMatch(/rgba\(/);
  });
});

describe("BiggestExpenses contract", () => {
  const src = readSource("components/analytics/BiggestExpenses.tsx");

  test("is a ranked ordered list", () => {
    expectBaselineContract(src);
    expect(src).toContain("<ol");
    expect(src).toContain('title="Biggest This Month"');
  });
});

describe("ComparisonView contract", () => {
  const src = readSource("components/analytics/ComparisonView.tsx");

  test("previous-month values are available to screen readers, not only as bars", () => {
    expectBaselineContract(src);
    expect(src).toContain('className="sr-only"');
    expect(src).toContain("${formatCurrency(row.prev)} in ${prevLabel}");
  });
});

describe("AnalyticsDeepDive contract (progressive disclosure)", () => {
  const src = readSource("components/analytics/AnalyticsDeepDive.tsx");

  test("is a real disclosure button inside a heading that exposes its state", () => {
    expectBaselineContract(src);
    expectSemanticClickTargets(src);
    expect(src).toMatch(/<h2 id=\{`\$\{panelId\}-heading`\}>\s*<button/);
    expect(src).toContain("aria-expanded={open}");
    expect(src).toContain("aria-controls={open ? panelId : undefined}");
    expect(src).toContain("min-h-[44px]");
  });

  test("collapsed by default and only loads its charts when opened", () => {
    expect(src).toContain("useState(false)");
    expect(src).toContain("{open && (");
    expect(src).toContain("<DeepDiveContent {...props} />");
    expect(src).toContain("variants={expandCollapse}");
  });

  test("keeps every secondary analysis available", () => {
    for (const name of ["<RollingAverageChart", "<CategoryVelocity", "<MerchantBreakdown", "<CategorySeasons", "<YearOverYearChart", "<TimeMachine"]) {
      expect(src).toContain(name);
    }
  });

  test("feeds day-level charts raw expenses for the full range, anchored on the selected month", () => {
    expect(src).toContain("periodAnchor(month, year, new Date())");
    expect(src).toContain("useExpenseRange(rangeMonths)");
  });
});

describe("Analytics page hierarchy and state (UX-9.6)", () => {
  test("has a page-level h1 and the header drives the URL-synced period", () => {
    expect(page).toContain('<h1 className="sr-only">Analytics</h1>');
    expect(page).toContain("const [period, setPeriod] = useAnalyticsPeriod();");
    expect(page).toContain("<AnalyticsHeader period={period} onPeriodChange={setPeriod}");
  });

  test("history length follows the selected period (regression: ridge stuck at 6 months)", () => {
    expect(page).toContain("useHistoricalData(currentMonth, currentYear, period - 1)");
    expect(page).toContain("period={period}");
    expect(page).toContain("ridgeTitle: `${period}-Month Ridge`");
    expect(page).not.toContain("6-Month Ridge");
    const ridge = readSource("components/analytics/MonthRidge.tsx");
    expect(ridge).toContain("const title = `${period}-Month Ridge`;");
  });

  test("renders the most actionable sections first, secondary analysis last", () => {
    const order = ["<ThisMonthOverview", "<ComparisonView", "<MonthRidge", "<SpendingVelocity", "<BiggestExpenses", "<AnalyticsDeepDive"];
    const positions = order.map((needle) => page.indexOf(needle));
    expect(positions.every((p) => p > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  test("drops the redundant insight-card row but keeps its information", () => {
    expect(page).not.toContain("InsightCard");
    expect(page).toContain("Top category over {period} months:");
    expect(page).toContain("href={`/expenses?category=");
  });

  test("shows the empty state when the whole period has no expenses", () => {
    expect(page).toContain("history.months.some((m) => m.count > 0)");
    expect(page).toContain("<EmptyState");
  });

  test("keeps the page lean: no inline canvas drawing or console logging", () => {
    expect(page).not.toContain("getContext(");
    expect(page).not.toMatch(/console\.(log|error)/);
    expect(page.split("\n").length).toBeLessThanOrEqual(250);
  });
});

describe("useAnalyticsPeriod contract", () => {
  const src = readSource("hooks/useAnalyticsPeriod.ts");

  test("stores the period in the URL and validates it", () => {
    expect(src).toContain('searchParams.get("period")');
    expect(src).toContain('params.set("period", String(next))');
    expect(src).toContain("parseAnalyticsPeriod");
    expect(src).toContain("{ scroll: false }");
  });
});
