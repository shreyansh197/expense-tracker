"use client";

import dynamic from "next/dynamic";

const CoinStackScene = dynamic(
  () => import("./CoinStackScene").then((m) => m.CoinStackScene),
  { ssr: false, loading: () => null },
);

interface LazyCoinStackProps {
  onComplete?: () => void;
}

export function LazyCoinStack({ onComplete }: LazyCoinStackProps) {
  return <CoinStackScene onComplete={onComplete} />;
}
