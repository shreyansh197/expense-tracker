export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="h-8 w-36 animate-pulse rounded-lg" style={{ background: "var(--surface-secondary)" }} />
      <div className="h-48 animate-pulse rounded-xl" style={{ background: "var(--surface-secondary)" }} />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-xl"
            style={{ background: "var(--surface-secondary)" }}
          />
        ))}
      </div>
    </div>
  );
}
