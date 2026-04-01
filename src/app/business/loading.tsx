export default function BusinessLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="h-8 w-40 animate-pulse rounded-lg" style={{ background: "var(--surface-secondary)" }} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-xl"
            style={{ background: "var(--surface-secondary)" }}
          />
        ))}
      </div>
    </div>
  );
}
