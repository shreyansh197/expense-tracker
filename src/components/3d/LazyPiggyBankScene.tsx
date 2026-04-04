"use client";

import dynamic from "next/dynamic";
import { PiggyBankFallback } from "./PiggyBankFallback";

const PiggyBankScene = dynamic(
  () => import("./PiggyBankScene").then((m) => m.PiggyBankScene),
  { ssr: false, loading: () => <PiggyBankFallback /> },
);

export function LazyPiggyBankScene() {
  return <PiggyBankScene />;
}
