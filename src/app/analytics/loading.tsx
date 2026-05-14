import { Skeleton, SkeletonKpiCards, SkeletonChart } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4" role="status" aria-busy="true" aria-label="Loading analytics">
      {/* Month switcher placeholder */}
      <Skeleton className="h-8 w-40 rounded-lg" />
      {/* Headline card */}
      <Skeleton className="h-10 rounded-xl" />
      {/* Trend intelligence card */}
      <Skeleton className="h-48 rounded-xl" />
      {/* Ridge + sparkline charts */}
      <SkeletonChart />
      {/* KPI insight grid */}
      <SkeletonKpiCards />
    </div>
  );
}
