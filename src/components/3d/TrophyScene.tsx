"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { TrophyFallback } from "./TrophyFallback";
import * as THREE from "three";

const GOLD = "#f59e0b";
const GOLD_DARK = "#b45309";
const PEDESTAL = "#64748b";
const RISE_DURATION = 0.5;

function Trophy() {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const gleamRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / RISE_DURATION, 1);
    // ease-out cubic rise
    const eased = 1 - Math.pow(1 - t, 3);

    // Rise from y=-1 to y=0
    groupRef.current.position.y = -1 + eased;

    // Gleam sweep after rise
    if (gleamRef.current && t >= 1) {
      const gleamT = elapsed.current - RISE_DURATION;
      if (gleamT < 0.3) {
        gleamRef.current.intensity = Math.sin((gleamT / 0.3) * Math.PI) * 1.5;
        gleamRef.current.position.x = -0.5 + (gleamT / 0.3) * 1.0;
      } else {
        gleamRef.current.intensity = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Pedestal base */}
      <mesh position={[0, -0.35, 0]}>
        <boxGeometry args={[0.4, 0.12, 0.25]} />
        <meshStandardMaterial color={PEDESTAL} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Trophy stem */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 0.3, 8]} />
        <meshStandardMaterial color={GOLD_DARK} metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Trophy cup — hemisphere-like */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.22, 0.1, 0.3, 12]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Cup rim */}
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.22, 0.02, 6, 16]} />
        <meshStandardMaterial color={GOLD_DARK} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Handles */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.28, 0.15, 0]} rotation={[0, 0, side * 0.2]}>
          <torusGeometry args={[0.06, 0.015, 6, 8, Math.PI]} />
          <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Gleam light */}
      <pointLight ref={gleamRef} position={[-0.5, 0.2, 0.5]} color="#fffbeb" intensity={0} distance={2} />
    </group>
  );
}

export function TrophyScene() {
  return (
    <ThreeCanvas
      className="h-16 w-16"
      cameraPosition={[0, 0, 2.2]}
      fov={30}
      fallback={<TrophyFallback />}
    >
      <Trophy />
    </ThreeCanvas>
  );
}
