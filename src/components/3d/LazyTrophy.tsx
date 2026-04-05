"use client";

import dynamic from "next/dynamic";
import { TrophyFallback } from "./TrophyFallback";

const TrophyScene = dynamic(
  () => import("./TrophyScene").then((m) => m.TrophyScene),
  { ssr: false, loading: () => <TrophyFallback /> },
);

export function LazyTrophy() {
  return <TrophyScene />;
}
