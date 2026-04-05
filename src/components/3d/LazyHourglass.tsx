"use client";

import dynamic from "next/dynamic";
import { HourglassFallback } from "./HourglassFallback";

const HourglassScene = dynamic(
  () => import("./HourglassScene").then((m) => m.HourglassScene),
  { ssr: false, loading: () => <HourglassFallback /> },
);

interface LazyHourglassProps {
  progress?: number;
}

export function LazyHourglass({ progress }: LazyHourglassProps) {
  return <HourglassScene progress={progress} />;
}
