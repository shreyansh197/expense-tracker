import { Skeleton } from "@/components/ui/Skeleton";

export default function BusinessLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
