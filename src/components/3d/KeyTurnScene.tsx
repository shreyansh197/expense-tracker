"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import * as THREE from "three";

const KEY_COLOR = "#d97706";
const LOCK_COLOR = "#64748b";
const DURATION = 0.4;

function KeyInLock() {
  const keyRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!keyRef.current) return;
    elapsed.current = Math.min(elapsed.current + delta, DURATION);
    const t = elapsed.current / DURATION;
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);

    // Key rotates 90° clockwise
    keyRef.current.rotation.z = eased * -Math.PI / 2;
  });

  return (
    <group>
      {/* Lock plate */}
      <mesh>
        <boxGeometry args={[0.6, 0.6, 0.08]} />
        <meshStandardMaterial color={LOCK_COLOR} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Keyhole surround */}
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Key — rotates */}
      <group ref={keyRef} position={[0, 0, 0.1]}>
        {/* Key shaft */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.04, 0.4, 0.03]} />
          <meshStandardMaterial color={KEY_COLOR} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Key bow (top ring) */}
        <mesh position={[0, -0.55, 0]}>
          <torusGeometry args={[0.08, 0.025, 8, 12]} />
          <meshStandardMaterial color={KEY_COLOR} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Key teeth */}
        <mesh position={[0.04, -0.15, 0]}>
          <boxGeometry args={[0.06, 0.04, 0.025]} />
          <meshStandardMaterial color={KEY_COLOR} metalness={0.5} roughness={0.35} />
        </mesh>
        <mesh position={[0.04, -0.08, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.025]} />
          <meshStandardMaterial color={KEY_COLOR} metalness={0.5} roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

interface KeyTurnSceneProps {
  onComplete?: () => void;
}

export function KeyTurnScene({ onComplete }: KeyTurnSceneProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, (DURATION + 0.2) * 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <ThreeCanvas
      className="h-8 w-8"
      cameraPosition={[0, 0, 2]}
      fov={30}
      fallback={null}
    >
      <KeyInLock />
    </ThreeCanvas>
  );
}
