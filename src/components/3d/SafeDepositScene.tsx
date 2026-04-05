"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import * as THREE from "three";

const SAFE_COLOR = "#475569";
const SAFE_LIGHT = "#64748b";
const BOLT_COLOR = "#94a3b8";
const DOOR_DURATION = 0.5;
const BOLT_DELAY = 0.5;
const BOLT_DURATION = 0.2;

function SafeBox() {
  const doorRef = useRef<THREE.Mesh>(null);
  const boltRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;

    // Door swings shut: rotateY from 90° to 0°
    if (doorRef.current) {
      const doorT = Math.min(elapsed.current / DOOR_DURATION, 1);
      const eased = 1 - Math.pow(1 - doorT, 3);
      doorRef.current.rotation.y = (1 - eased) * Math.PI / 2;
    }

    // Bolt slides after door closes
    if (boltRef.current) {
      const boltElapsed = Math.max(elapsed.current - BOLT_DELAY, 0);
      const boltT = Math.min(boltElapsed / BOLT_DURATION, 1);
      const boltEased = 1 - Math.pow(1 - boltT, 2);
      boltRef.current.position.x = -0.15 + boltEased * 0.15;
    }
  });

  return (
    <group rotation={[0.1, -0.2, 0]}>
      {/* Safe body */}
      <mesh>
        <boxGeometry args={[0.8, 0.7, 0.6]} />
        <meshStandardMaterial color={SAFE_COLOR} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Door — pivots from left edge */}
      <group position={[-0.4, 0, 0.3]}>
        <mesh ref={doorRef} position={[0.4, 0, 0]}>
          <boxGeometry args={[0.78, 0.68, 0.04]} />
          <meshStandardMaterial color={SAFE_LIGHT} metalness={0.35} roughness={0.55} />
        </mesh>
      </group>

      {/* Door handle */}
      <mesh position={[0.2, 0, 0.34]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
        <meshStandardMaterial color={BOLT_COLOR} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Lock bolt — slides right */}
      <mesh ref={boltRef} position={[-0.15, 0, 0.33]}>
        <boxGeometry args={[0.12, 0.04, 0.03]} />
        <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

interface SafeDepositSceneProps {
  onComplete?: () => void;
}

export function SafeDepositScene({ onComplete }: SafeDepositSceneProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, (DOOR_DURATION + BOLT_DELAY + BOLT_DURATION + 0.3) * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <ThreeCanvas
      className="h-12 w-12"
      cameraPosition={[0, 0, 2.5]}
      fov={30}
      fallback={null}
    >
      <SafeBox />
    </ThreeCanvas>
  );
}
