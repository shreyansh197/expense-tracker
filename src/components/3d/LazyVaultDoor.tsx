"use client";

import dynamic from "next/dynamic";
import { VaultDoorFallback } from "./VaultDoorFallback";

const VaultDoorScene = dynamic(
  () => import("./VaultDoorScene").then((m) => m.VaultDoorScene),
  { ssr: false, loading: () => <VaultDoorFallback /> },
);

export function LazyVaultDoor() {
  return <VaultDoorScene />;
}
