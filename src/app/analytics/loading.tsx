import { Skeleton, SkeletonChart } from "@/components/ui/Skeleton";

/** Mirrors the Analytics layout (header → month hero → comparison → ridge) to avoid layout shift. */
export default function AnalyticsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6 lg:p-8 xl:max-w-6xl" role="status" aria-busy="true" aria-label="Loading analytics">
      {/* Header: month switcher + period selector */}
      <Skeleton className="h-28 rounded-3xl md:h-20" />
      {/* This-month hero: amount, context, projection */}
      <Skeleton className="h-64 rounded-3xl" />
      {/* Month vs Month */}
      <Skeleton className="h-56 rounded-3xl" />
      {/* Month Ridge */}
      <SkeletonChart />
    </div>
  );
}
