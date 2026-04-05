"use client";

import dynamic from "next/dynamic";

const KeyTurnScene = dynamic(
  () => import("./KeyTurnScene").then((m) => m.KeyTurnScene),
  { ssr: false, loading: () => null },
);

interface LazyKeyTurnProps {
  onComplete?: () => void;
}

export function LazyKeyTurn({ onComplete }: LazyKeyTurnProps) {
  return <KeyTurnScene onComplete={onComplete} />;
}
