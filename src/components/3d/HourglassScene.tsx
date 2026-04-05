"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { HourglassFallback } from "./HourglassFallback";
import * as THREE from "three";

const GLASS_COLOR = "#e0f2fe";
const FRAME_COLOR = "#64748b";
const SAND_COLOR = "#d97706";

interface HourglassProps {
  /** 0 = month just started (top full), 100 = month ended (bottom full) */
  progress: number;
}

function Hourglass({ progress }: HourglassProps) {
  const groupRef = useRef<THREE.Group>(null);
  const topSandRef = useRef<THREE.Mesh>(null);
  const bottomSandRef = useRef<THREE.Mesh>(null);
  const streamRef = useRef<THREE.Mesh>(null);

  const pct = Math.min(Math.max(progress, 0), 100) / 100;
  const topHeight = (1 - pct) * 0.35;
  const bottomHeight = pct * 0.35;
  const showStream = pct > 0 && pct < 1;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Very subtle idle sway
    groupRef.current.rotation.z = Math.sin(Date.now() * 0.0006) * 0.01;

    // Stream flicker
    if (streamRef.current && showStream) {
      streamRef.current.scale.x = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0.3, 0]}>
      {/* Top frame */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.45, 0.06, 0.2]} />
        <meshStandardMaterial color={FRAME_COLOR} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Bottom frame */}
      <mesh position={[0, -0.6, 0]}>
        <boxGeometry args={[0.45, 0.06, 0.2]} />
        <meshStandardMaterial color={FRAME_COLOR} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Glass bulbs — two cones meeting at center */}
      <mesh position={[0, 0.27, 0]}>
        <coneGeometry args={[0.25, 0.6, 12, 1, true]} />
        <meshStandardMaterial color={GLASS_COLOR} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.27, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.25, 0.6, 12, 1, true]} />
        <meshStandardMaterial color={GLASS_COLOR} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>

      {/* Top sand */}
      {topHeight > 0.01 && (
        <mesh ref={topSandRef} position={[0, 0.6 - 0.06 - topHeight / 2 - 0.02, 0]}>
          <cylinderGeometry args={[
            0.08 + (topHeight / 0.35) * 0.1,
            0.04,
            topHeight,
            10,
          ]} />
          <meshStandardMaterial color={SAND_COLOR} roughness={0.8} />
        </mesh>
      )}

      {/* Bottom sand */}
      {bottomHeight > 0.01 && (
        <mesh ref={bottomSandRef} position={[0, -0.6 + 0.06 + bottomHeight / 2 + 0.02, 0]}>
          <cylinderGeometry args={[
            0.04,
            0.08 + (bottomHeight / 0.35) * 0.1,
            bottomHeight,
            10,
          ]} />
          <meshStandardMaterial color={SAND_COLOR} roughness={0.8} />
        </mesh>
      )}

      {/* Sand stream — thin cylinder in center */}
      {showStream && (
        <mesh ref={streamRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.12, 4]} />
          <meshStandardMaterial color={SAND_COLOR} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

export function HourglassScene({ progress = 50 }: Partial<HourglassProps>) {
  return (
    <ThreeCanvas
      className="h-10 w-10"
      cameraPosition={[0, 0, 2.8]}
      fov={28}
      fallback={<HourglassFallback progress={progress} />}
    >
      <Hourglass progress={progress} />
    </ThreeCanvas>
  );
}
