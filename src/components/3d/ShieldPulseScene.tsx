"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { ShieldPulseFallback } from "./ShieldPulseFallback";
import * as THREE from "three";

const STATUS_COLORS: Record<string, string> = {
  caution: "#f59e0b",
  danger: "#ef4444",
};

interface ShieldProps {
  status: "caution" | "danger";
}

function Shield({ status }: ShieldProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const elapsed = useRef(0);
  const color = STATUS_COLORS[status] ?? STATUS_COLORS.caution;

  useFrame((_, delta) => {
    elapsed.current += delta;

    if (meshRef.current) {
      // Single entrance pulse then gentle breathing
      const t = Math.min(elapsed.current, 0.3) / 0.3;
      const entranceScale = 0.85 + 0.15 * (1 - Math.pow(1 - t, 3));
      const breath = 1 + Math.sin(elapsed.current * 1.8) * 0.02;
      meshRef.current.scale.setScalar(entranceScale * breath);
    }

    if (glowRef.current) {
      // Slow pulsing glow 0.4-0.8 intensity
      glowRef.current.intensity = 0.4 + Math.sin(elapsed.current * 1.8) * 0.2;
    }
  });

  // Shield shape via extrude
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.6);
  shape.quadraticCurveTo(0.5, 0.5, 0.5, 0.1);
  shape.quadraticCurveTo(0.5, -0.3, 0, -0.6);
  shape.quadraticCurveTo(-0.5, -0.3, -0.5, 0.1);
  shape.quadraticCurveTo(-0.5, 0.5, 0, 0.6);

  return (
    <group>
      <mesh ref={meshRef}>
        <extrudeGeometry args={[shape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.45} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 0, 0.5]} color={color} intensity={0.5} distance={2} />
    </group>
  );
}

export function ShieldPulseScene({ status = "caution" }: Partial<ShieldProps>) {
  return (
    <ThreeCanvas
      className="h-12 w-12"
      cameraPosition={[0, 0, 2.5]}
      fov={30}
      fallback={<ShieldPulseFallback status={status} />}
    >
      <Shield status={status} />
    </ThreeCanvas>
  );
}
