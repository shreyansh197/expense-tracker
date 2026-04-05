"use client";

import dynamic from "next/dynamic";
import { BudgetJarFallback } from "./BudgetJarFallback";

const BudgetJarScene = dynamic(
  () => import("./BudgetJarScene").then((m) => m.BudgetJarScene),
  { ssr: false, loading: () => <BudgetJarFallback /> },
);

interface LazyBudgetJarProps {
  level?: number;
  status?: "safe" | "caution" | "danger";
}

export function LazyBudgetJar({ level, status }: LazyBudgetJarProps) {
  return <BudgetJarScene level={level} status={status} />;
}
