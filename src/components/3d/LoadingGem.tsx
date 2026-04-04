"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { ThreeCanvas } from "./ThreeCanvas";
import { LoadingGemFallback } from "./LoadingGemFallback";
import type { Mesh } from "three";

function Gem({ spinning = true }: { spinning?: boolean }) {
  const meshRef = useRef<Mesh>(null);
  const reduced = useReducedMotion();
  const clock = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || reduced || !spinning) return;
    clock.current += delta;
    meshRef.current.rotation.x += delta * 1.5;
    meshRef.current.rotation.y += delta * 1.0;
    const s = 1 + Math.sin(clock.current * 3) * 0.05;
    meshRef.current.scale.setScalar(s);
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial
        color="#2ec4b6"
        metalness={0.4}
        roughness={0.3}
        emissive="#2ec4b6"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

interface LoadingGemProps {
  spinning?: boolean;
}

export function LoadingGem({ spinning = true }: LoadingGemProps) {
  return (
    <ThreeCanvas
      className="h-10 w-10"
      fallback={<LoadingGemFallback />}
      cameraPosition={[0, 0, 3]}
      fov={35}
    >
      <Gem spinning={spinning} />
    </ThreeCanvas>
  );
}
