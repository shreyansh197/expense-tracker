"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { BalanceScaleFallback } from "./BalanceScaleFallback";
import * as THREE from "three";

const METAL = "#94a3b8";
const METAL_DARK = "#475569";
const GOLD_ACCENT = "#d97706";

interface ScaleProps {
  /** 0 = balanced, 100 = fully tilted (over budget) */
  tilt: number;
}

function Scale({ tilt }: ScaleProps) {
  const beamRef = useRef<THREE.Group>(null);
  const currentTilt = useRef(0);

  // Map tilt 0-100 → rotation -0.25 to 0.25 rad (~14°)
  const targetRotation = (Math.min(Math.max(tilt, 0), 100) / 100) * 0.25;

  useFrame((_, delta) => {
    if (!beamRef.current) return;

    // Smooth lerp to target
    const diff = targetRotation - currentTilt.current;
    if (Math.abs(diff) > 0.0005) {
      currentTilt.current += diff * Math.min(delta * 2.5, 1);
    } else {
      currentTilt.current = targetRotation;
    }

    beamRef.current.rotation.z = -currentTilt.current;

    // Very subtle idle sway
    beamRef.current.rotation.z += Math.sin(Date.now() * 0.0008) * 0.003;
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Fulcrum / pedestal */}
      <mesh position={[0, -0.4, 0]}>
        <coneGeometry args={[0.15, 0.35, 6]} />
        <meshStandardMaterial color={METAL_DARK} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.2]} />
        <meshStandardMaterial color={METAL} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Beam — rotates based on tilt */}
      <group ref={beamRef} position={[0, -0.15, 0]}>
        {/* Horizontal beam */}
        <mesh>
          <boxGeometry args={[1.4, 0.04, 0.04]} />
          <meshStandardMaterial color={METAL} metalness={0.45} roughness={0.4} />
        </mesh>

        {/* Left pan (income side) */}
        <group position={[-0.6, 0, 0]}>
          {/* Chain */}
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
            <meshStandardMaterial color={METAL_DARK} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Pan */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.2, 0.18, 0.04, 16]} />
            <meshStandardMaterial color={GOLD_ACCENT} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>

        {/* Right pan (spending side) */}
        <group position={[0.6, 0, 0]}>
          {/* Chain */}
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.2, 6]} />
            <meshStandardMaterial color={METAL_DARK} metalness={0.5} roughness={0.3} />
          </mesh>
          {/* Pan */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.2, 0.18, 0.04, 16]} />
            <meshStandardMaterial color={METAL} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function BalanceScaleScene({ tilt = 50 }: Partial<ScaleProps>) {
  return (
    <ThreeCanvas
      className="h-16 w-20"
      cameraPosition={[0, 0, 2.8]}
      fov={30}
      fallback={<BalanceScaleFallback tilt={tilt} />}
    >
      <Scale tilt={tilt} />
    </ThreeCanvas>
  );
}
