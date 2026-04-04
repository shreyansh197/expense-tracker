"use client";

import dynamic from "next/dynamic";
import { CoinFallback } from "./CoinFallback";

const CoinScene = dynamic(
  () => import("./CoinScene").then((m) => m.CoinScene),
  { ssr: false, loading: () => <CoinFallback /> },
);

export function LazyCoinScene() {
  return <CoinScene />;
}
