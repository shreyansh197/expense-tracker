import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-36 rounded-lg" />
      <Skeleton className="h-48 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
