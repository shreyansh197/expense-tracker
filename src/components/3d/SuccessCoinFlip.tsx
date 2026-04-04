"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { ThreeCanvas } from "./ThreeCanvas";
import { SuccessCoinFlipFallback } from "./SuccessCoinFlipFallback";
import type { Group } from "three";

const FLIP_DURATION = 0.8; // seconds
const FLIP_ROTATION = Math.PI * 2; // full 360° flip on X axis

function FlippingCoin() {
  const groupRef = useRef<Group>(null);
  const elapsed = useRef(0);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    if (!groupRef.current || reduced) return;
    if (elapsed.current >= FLIP_DURATION) return; // animation done

    elapsed.current = Math.min(elapsed.current + delta, FLIP_DURATION);
    const t = elapsed.current / FLIP_DURATION;
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    groupRef.current.rotation.x = eased * FLIP_ROTATION;
    // slight upward arc during flip
    groupRef.current.position.y = Math.sin(t * Math.PI) * 0.3;
  });

  return (
    <group ref={groupRef}>
      {/* Coin body */}
      <mesh>
        <cylinderGeometry args={[0.9, 0.9, 0.12, 24]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Rim */}
      <mesh>
        <torusGeometry args={[0.9, 0.03, 8, 32]} />
        <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function SuccessCoinFlip() {
  return (
    <ThreeCanvas
      className="h-10 w-10"
      fallback={<SuccessCoinFlipFallback />}
      cameraPosition={[0, 0, 3]}
      fov={35}
    >
      <FlippingCoin />
    </ThreeCanvas>
  );
}
