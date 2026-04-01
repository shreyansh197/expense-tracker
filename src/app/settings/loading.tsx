export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="h-8 w-32 animate-pulse rounded-lg" style={{ background: "var(--surface-secondary)" }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl"
          style={{ background: "var(--surface-secondary)" }}
        />
      ))}
    </div>
  );
}
