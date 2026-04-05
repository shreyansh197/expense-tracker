"use client";

import dynamic from "next/dynamic";

const CoinDropScene = dynamic(
  () => import("./CoinDropScene").then((m) => m.CoinDropScene),
  { ssr: false, loading: () => null },
);

interface LazyCoinDropProps {
  onComplete?: () => void;
}

export function LazyCoinDrop({ onComplete }: LazyCoinDropProps) {
  return <CoinDropScene onComplete={onComplete} />;
}
