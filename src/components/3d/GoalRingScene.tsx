"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { GoalRingFallback } from "./GoalRingFallback";
import * as THREE from "three";

const RING_RADIUS = 0.6;
const TUBE_RADIUS = 0.1;
const SEGMENTS = 48;

interface RingProps {
  progress: number; // 0-100
  color?: string;
}

/** Animated progress arc on a torus */
function ProgressRing({ progress, color = "#10b981" }: RingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const animatedArc = useRef(0);
  const prevArc = useRef(-1);

  // Target arc in radians (0-100 → 0-2π)
  const targetArc = (Math.min(Math.max(progress, 0), 100) / 100) * Math.PI * 2;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // Smooth-lerp toward target
    const diff = targetArc - animatedArc.current;
    if (Math.abs(diff) > 0.001) {
      animatedArc.current += diff * Math.min(delta * 3, 1);
    } else {
      animatedArc.current = targetArc;
    }

    // Rebuild geometry only when arc changes meaningfully (>0.5° ≈ 0.009 rad)
    const currentArc = Math.max(animatedArc.current, 0.01);
    if (Math.abs(currentArc - prevArc.current) > 0.009) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = new THREE.TorusGeometry(
        RING_RADIUS, TUBE_RADIUS, 12, SEGMENTS, currentArc,
      );
      prevArc.current = currentArc;
    }

    // Very slow idle rotation
    meshRef.current.rotation.z += delta * 0.08;
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
      <torusGeometry args={[RING_RADIUS, TUBE_RADIUS, 12, SEGMENTS, 0.01]} />
      <meshStandardMaterial color={color} metalness={0.25} roughness={0.45} />
    </mesh>
  );
}

/** Background track ring */
function TrackRing() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[RING_RADIUS, TUBE_RADIUS * 0.6, 12, SEGMENTS]} />
      <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} roughness={0.8} />
    </mesh>
  );
}

export function GoalRingScene({ progress = 0, color = "#10b981" }: Partial<RingProps>) {
  return (
    <ThreeCanvas
      className="h-16 w-16"
      cameraPosition={[0, 0, 2.5]}
      fov={30}
      fallback={<GoalRingFallback progress={progress} color={color} />}
    >
      <TrackRing />
      <ProgressRing progress={progress} color={color} />
    </ThreeCanvas>
  );
}
