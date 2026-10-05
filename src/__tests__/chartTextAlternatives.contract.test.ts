/// <reference types="jest" />
/**
 * M4 · T-4.2.1 — every core chart exposes a keyboard-reachable `DataTableView`
 * text alternative whose rows come from the same model as the chart, and the
 * visual SVG/bars are hidden from assistive technology in favour of it.
 */
import { readSource, expectBaselineContract, stripComments } from "./helpers/contractAssertions";

interface ChartContract {
  path: string;
  /** Model/row source shared by the chart and its table. */
  sharedModel: string;
}

const CHARTS: ChartContract[] = [
  { path: "components/analytics/RollingAverageChart.tsx", sharedModel: "rows={points}" },
  { path: "components/ui/RidgeLine.tsx", sharedModel: "rows={rows}" },
  { path: "components/business/CollectionChart.tsx", sharedModel: "rows={data}" },
  { path: "components/business/LedgerProgressRing.tsx", sharedModel: "rows={[{ received, expected, percent }]}" },
  { path: "components/analytics/MerchantBreakdown.tsx", sharedModel: "rows={rows}" },
  { path: "components/analytics/CategoryVelocity.tsx", sharedModel: "rows={rows}" },
  { path: "components/analytics/CategorySeasons.tsx", sharedModel: "rows={stackedData}" },
  { path: "components/analytics/MonthRidge.tsx", sharedModel: "rows={model.rows}" },
  { path: "components/analytics/SpendingVelocity.tsx", sharedModel: "rows={model.rows}" },
];

describe("chart text alternatives (DataTableView)", () => {
  test.each(CHARTS.map((c) => [c.path, c] as const))("%s exposes a DataTableView built from the chart's own rows", (_path, chart) => {
    const src = readSource(chart.path);
    expectBaselineContract(src);
    expect(src).toMatch(/import \{ DataTableView(, type DataTableColumn)? \} from "@\/components\/ui\/DataTableView"/);
    expect(src).toContain("<DataTableView");
    expect(src).toContain(chart.sharedModel);
    expect(src).toMatch(/<DataTableView[\s\S]*?title=/);
  });

  test.each(CHARTS.map((c) => [c.path]))("%s hides decorative SVG from assistive technology", (path) => {
    const code = stripComments(readSource(path));
    for (const [, attrs] of code.matchAll(/<svg\b([^>]*)>/g)) expect(attrs).toContain('aria-hidden="true"');
  });
});

describe("chart-specific accessibility", () => {
  test("RollingAverageChart period buttons expose state and meet 44px", () => {
    const src = readSource("components/analytics/RollingAverageChart.tsx");
    expect(src).toContain('aria-label="Rolling average period"');
    expect(src).toContain("aria-pressed={period === p}");
    expect(src).toContain("min-h-[44px] min-w-[44px]");
  });

  test("RollingAverageChart recomputes from the selected period (regression: 30/60/90 did nothing)", () => {
    const src = readSource("components/analytics/RollingAverageChart.tsx");
    expect(src).toContain("buildRollingSeries(expenses, new Date(anchorKey), period)");
    expect(src).toMatch(/\[expenses, anchorKey, period\]/);
    expect(src).not.toMatch(/useState<WindowDays>/);
  });

  test("LedgerProgressRing exposes its value as text on the progressbar", () => {
    const src = readSource("components/business/LedgerProgressRing.tsx");
    expect(src).toContain('role="progressbar"');
    expect(src).toContain("aria-valuetext={valueText}");
    expect(src).toContain('aria-label="Collected"');
  });

  test("the ledger detail page opts into the ring's data table", () => {
    const src = readSource("app/business/[ledgerId]/page.tsx");
    expect(src).toMatch(/<LedgerProgressRing[^>]*withDataTable/);
  });

  test("the category page gives its RidgeLine a labelled table", () => {
    const src = readSource("app/category/[slug]/page.tsx");
    expect(src).toContain("table={{");
    expect(src).toContain("labels: trendData.map((d) => d.label)");
  });

  test("CategoryVelocity signals direction with sign/icon, not colour alone", () => {
    expect(readSource("components/analytics/CategoryVelocity.tsx")).toContain("formatSignedPercent(r.deltaPct)");
  });
});
