"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { BudgetJarFallback } from "./BudgetJarFallback";
import type { Mesh } from "three";
import * as THREE from "three";

const STATUS_COLORS: Record<string, string> = {
  safe: "#10b981",    // emerald-500
  caution: "#f59e0b", // amber-500
  danger: "#ef4444",  // red-500
};

const GLASS_COLOR = "#e0f2fe"; // light sky tint
const JAR_RADIUS = 0.55;
const JAR_HEIGHT = 1.4;
const WATER_INSET = 0.04;

interface JarProps {
  level: number; // 0-100
  status: "safe" | "caution" | "danger";
}

/** Inner water mesh with animated wobble */
function Water({ level, status }: JarProps) {
  const meshRef = useRef<Mesh>(null);
  const clock = useRef(0);

  // Water height based on level (0 = empty, 100 = full)
  const waterHeight = (Math.min(Math.max(level, 2), 100) / 100) * (JAR_HEIGHT - 0.15);

  const color = STATUS_COLORS[status] ?? STATUS_COLORS.safe;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    clock.current += delta;
    // Gentle surface wobble
    meshRef.current.rotation.z = Math.sin(clock.current * 1.8) * 0.015;
    meshRef.current.rotation.x = Math.cos(clock.current * 1.4) * 0.01;
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, -JAR_HEIGHT / 2 + waterHeight / 2 + 0.04, 0]}
    >
      <cylinderGeometry
        args={[
          JAR_RADIUS - WATER_INSET,
          JAR_RADIUS - WATER_INSET,
          waterHeight,
          24,
        ]}
      />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.7}
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
}

/** Glass jar body */
function Jar() {
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: GLASS_COLOR,
        transparent: true,
        opacity: 0.18,
        metalness: 0.05,
        roughness: 0.1,
        side: THREE.DoubleSide,
      }),
    [],
  );

  return (
    <group>
      {/* Jar body */}
      <mesh material={glassMaterial}>
        <cylinderGeometry args={[JAR_RADIUS, JAR_RADIUS, JAR_HEIGHT, 24, 1, true]} />
      </mesh>
      {/* Bottom cap */}
      <mesh position={[0, -JAR_HEIGHT / 2, 0]} rotation={[Math.PI / 2, 0, 0]} material={glassMaterial}>
        <circleGeometry args={[JAR_RADIUS, 24]} />
      </mesh>
      {/* Rim / lip at top */}
      <mesh position={[0, JAR_HEIGHT / 2 + 0.04, 0]}>
        <torusGeometry args={[JAR_RADIUS, 0.04, 8, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

function BudgetJar({ level, status }: JarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const clock = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    clock.current += delta;
    // Very slow idle rotation
    groupRef.current.rotation.y += delta * 0.15;
    // Subtle float
    groupRef.current.position.y = Math.sin(clock.current * 0.9) * 0.02;
  });

  return (
    <group ref={groupRef} rotation={[0.1, 0, 0]}>
      <Jar />
      <Water level={level} status={status} />
    </group>
  );
}

export function BudgetJarScene({
  level = 50,
  status = "safe",
}: Partial<JarProps>) {
  return (
    <ThreeCanvas
      className="h-20 w-20"
      cameraPosition={[0, 0, 3.5]}
      fov={30}
      fallback={<BudgetJarFallback level={level} status={status} />}
    >
      <BudgetJar level={level} status={status} />
    </ThreeCanvas>
  );
}
