"use client";

import dynamic from "next/dynamic";
import { ShieldPulseFallback } from "./ShieldPulseFallback";

const ShieldPulseScene = dynamic(
  () => import("./ShieldPulseScene").then((m) => m.ShieldPulseScene),
  { ssr: false, loading: () => <ShieldPulseFallback /> },
);

interface LazyShieldPulseProps {
  status?: "caution" | "danger";
}

export function LazyShieldPulse({ status }: LazyShieldPulseProps) {
  return <ShieldPulseScene status={status} />;
}
