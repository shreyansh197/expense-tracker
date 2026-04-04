"use client";

import dynamic from "next/dynamic";
import { SuccessCoinFlipFallback } from "./SuccessCoinFlipFallback";

const SuccessCoinFlip = dynamic(
  () => import("./SuccessCoinFlip").then((m) => m.SuccessCoinFlip),
  { ssr: false, loading: () => <SuccessCoinFlipFallback /> },
);

export function LazySuccessCoinFlip() {
  return <SuccessCoinFlip />;
}
