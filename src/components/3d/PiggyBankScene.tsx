"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { ThreeCanvas } from "./ThreeCanvas";
import { PiggyBankFallback } from "./PiggyBankFallback";
import type { Group } from "three";

const PINK = "#f9a8d4";
const PINK_DARK = "#ec4899";
const SNOUT_PINK = "#fbb6ce";

function PiggyBank() {
  const groupRef = useRef<Group>(null);
  const reduced = useReducedMotion();
  const clock = useRef(0);
  const speedBoost = useRef(1);
  const boostTimer = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || reduced) return;
    clock.current += delta;

    // Decay speed boost over time
    if (boostTimer.current > 0) {
      boostTimer.current -= delta;
      if (boostTimer.current <= 0) speedBoost.current = 1;
    }

    // Gentle Y rotation + subtle float
    groupRef.current.rotation.y += delta * 0.3 * speedBoost.current;
    groupRef.current.position.y = Math.sin(clock.current * 1.2) * 0.04;
  });

  const handlePointer = () => {
    speedBoost.current = 2.5;
    boostTimer.current = 1.0;
  };

  return (
    <group
      ref={groupRef}
      rotation={[0.1, -0.3, 0]}
      onPointerDown={handlePointer}
    >
      {/* Body — squashed sphere */}
      <mesh scale={[1, 0.85, 0.9]}>
        <sphereGeometry args={[0.7, 16, 12]} />
        <meshStandardMaterial color={PINK} metalness={0.15} roughness={0.6} />
      </mesh>

      {/* Snout */}
      <mesh position={[0, -0.05, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.15, 12]} />
        <meshStandardMaterial color={SNOUT_PINK} metalness={0.1} roughness={0.7} />
      </mesh>
      {/* Nostrils */}
      <mesh position={[-0.07, -0.05, 0.77]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={PINK_DARK} />
      </mesh>
      <mesh position={[0.07, -0.05, 0.77]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={PINK_DARK} />
      </mesh>

      {/* Left ear */}
      <mesh position={[-0.25, 0.55, 0.15]} rotation={[0.3, 0, -0.3]}>
        <coneGeometry args={[0.12, 0.22, 4]} />
        <meshStandardMaterial color={PINK} metalness={0.15} roughness={0.6} />
      </mesh>
      {/* Right ear */}
      <mesh position={[0.25, 0.55, 0.15]} rotation={[0.3, 0, 0.3]}>
        <coneGeometry args={[0.12, 0.22, 4]} />
        <meshStandardMaterial color={PINK} metalness={0.15} roughness={0.6} />
      </mesh>

      {/* Legs — four tiny boxes */}
      {[
        [-0.3, -0.6, 0.25],
        [0.3, -0.6, 0.25],
        [-0.3, -0.6, -0.25],
        [0.3, -0.6, -0.25],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.14, 0.2, 0.14]} />
          <meshStandardMaterial color={PINK} metalness={0.15} roughness={0.6} />
        </mesh>
      ))}

      {/* Coin slot on top */}
      <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.04, 0.35, 0.06]} />
        <meshStandardMaterial color={PINK_DARK} metalness={0.3} roughness={0.4} />
      </mesh>

      {/* Tail — tiny curl */}
      <mesh position={[0, 0.1, -0.7]} rotation={[0.5, 0, 0]}>
        <torusGeometry args={[0.08, 0.025, 6, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color={PINK} metalness={0.15} roughness={0.6} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.2, 0.15, 0.58]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.2, 0.15, 0.58]}>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

export function PiggyBankScene() {
  return (
    <ThreeCanvas
      className="h-14 w-14"
      fallback={<PiggyBankFallback />}
      cameraPosition={[0, 0, 3.2]}
      fov={35}
    >
      <PiggyBank />
    </ThreeCanvas>
  );
}
