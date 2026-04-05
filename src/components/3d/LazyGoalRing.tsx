"use client";

import dynamic from "next/dynamic";
import { GoalRingFallback } from "./GoalRingFallback";

const GoalRingScene = dynamic(
  () => import("./GoalRingScene").then((m) => m.GoalRingScene),
  { ssr: false, loading: () => <GoalRingFallback /> },
);

interface LazyGoalRingProps {
  progress?: number;
  color?: string;
}

export function LazyGoalRing({ progress, color }: LazyGoalRingProps) {
  return <GoalRingScene progress={progress} color={color} />;
}
