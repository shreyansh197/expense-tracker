"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import * as THREE from "three";

const GOLD = "#f59e0b";
const GOLD_EDGE = "#d97706";
const DURATION = 0.5;
const COIN_THICKNESS = 0.06;
const COIN_RADIUS = 0.35;

function CoinStack() {
  const droppedRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!droppedRef.current) return;
    elapsed.current = Math.min(elapsed.current + delta, DURATION);
    const t = elapsed.current / DURATION;
    // ease-out bounce
    const eased = t < 0.7
      ? (t / 0.7) * (t / 0.7)
      : 1 - Math.pow(1 - t, 3);

    // Fall from y=1.5 to y=0.21 (on top of stack)
    const targetY = 0.21;
    droppedRef.current.position.y = 1.5 - (1.5 - targetY) * eased;

    // Slight tumble while falling
    if (t < 0.7) {
      droppedRef.current.rotation.z = Math.sin(t * Math.PI * 4) * 0.08 * (1 - t);
    } else {
      droppedRef.current.rotation.z *= 0.85;
    }
  });

  return (
    <group position={[0, -0.3, 0]} rotation={[0.15, 0.3, 0]}>
      {/* Existing stack — 3 coins */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, i * COIN_THICKNESS, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 20]} />
          <meshStandardMaterial
            color={i === 1 ? GOLD_EDGE : GOLD}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Dropped coin — animated */}
      <mesh ref={droppedRef} position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[COIN_RADIUS, COIN_RADIUS, COIN_THICKNESS, 20]} />
        <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.25} />
      </mesh>
    </group>
  );
}

interface CoinStackSceneProps {
  onComplete?: () => void;
}

export function CoinStackScene({ onComplete }: CoinStackSceneProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, (DURATION + 0.3) * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <ThreeCanvas
      className="h-10 w-10"
      cameraPosition={[0, 0, 3]}
      fov={30}
      fallback={null}
    >
      <CoinStack />
    </ThreeCanvas>
  );
}
