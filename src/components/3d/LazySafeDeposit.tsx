"use client";

import dynamic from "next/dynamic";

const SafeDepositScene = dynamic(
  () => import("./SafeDepositScene").then((m) => m.SafeDepositScene),
  { ssr: false, loading: () => null },
);

interface LazySafeDepositProps {
  onComplete?: () => void;
}

export function LazySafeDeposit({ onComplete }: LazySafeDepositProps) {
  return <SafeDepositScene onComplete={onComplete} />;
}
