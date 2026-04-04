"use client";

import dynamic from "next/dynamic";
import { LoadingGemFallback } from "./LoadingGemFallback";

const LoadingGem = dynamic(
  () => import("./LoadingGem").then((m) => m.LoadingGem),
  { ssr: false, loading: () => <LoadingGemFallback /> },
);

export function LazyLoadingGem({ spinning = true }: { spinning?: boolean }) {
  return <LoadingGem spinning={spinning} />;
}
