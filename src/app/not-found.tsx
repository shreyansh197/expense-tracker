import Link from "next/link";
import { OffTrailMap } from "@/components/ui/illustrations/terrain/OffTrailMap";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ background: "var(--es-chalk, #FAF7F2)" }}
    >
      <OffTrailMap className="w-32 h-32 opacity-70" />

      <div className="space-y-2">
        <h1
          className="font-display italic text-2xl"
          style={{ color: "var(--text-primary)" }}
        >
          You&apos;ve wandered off the trail.
        </h1>
        <p
          className="text-sm font-body-terrain"
          style={{ color: "var(--text-secondary)" }}
        >
          This page doesn&apos;t exist in ExpenStream.
        </p>
      </div>

      <Link
        href="/"
        className="rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-95 hover:opacity-90"
        style={{ background: "var(--accent)" }}
      >
        Head back
      </Link>
    </div>
  );
}
