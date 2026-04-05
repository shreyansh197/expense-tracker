"use client";

import dynamic from "next/dynamic";
import { BalanceScaleFallback } from "./BalanceScaleFallback";

const BalanceScaleScene = dynamic(
  () => import("./BalanceScaleScene").then((m) => m.BalanceScaleScene),
  { ssr: false, loading: () => <BalanceScaleFallback /> },
);

interface LazyBalanceScaleProps {
  tilt?: number;
}

export function LazyBalanceScale({ tilt }: LazyBalanceScaleProps) {
  return <BalanceScaleScene tilt={tilt} />;
}
