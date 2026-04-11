import { Skeleton } from "@/components/ui/Skeleton";

export default function ExpensesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
