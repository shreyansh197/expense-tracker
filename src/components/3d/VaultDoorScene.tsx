"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import { VaultDoorFallback } from "./VaultDoorFallback";
import * as THREE from "three";

const DURATION = 0.6;
const DOOR_COLOR = "#64748b";
const HANDLE_COLOR = "#334155";
const FRAME_COLOR = "#94a3b8";

function VaultDoor() {
  const groupRef = useRef<THREE.Group>(null);
  const handleRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current || !handleRef.current) return;
    elapsed.current = Math.min(elapsed.current + delta, DURATION);
    const t = elapsed.current / DURATION;
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);

    // Handle turns 90° (quarter turn)
    handleRef.current.rotation.z = eased * -Math.PI / 2;

    // Subtle scale pulse at end
    if (t > 0.7) {
      const pulse = 1 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.03;
      groupRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Door face — circular */}
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color={DOOR_COLOR} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Outer frame ring */}
      <mesh>
        <torusGeometry args={[0.82, 0.06, 8, 32]} />
        <meshStandardMaterial color={FRAME_COLOR} metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Handle cross — rotates */}
      <group ref={handleRef} position={[0, 0, 0.08]}>
        {/* Horizontal bar */}
        <mesh>
          <boxGeometry args={[0.7, 0.06, 0.06]} />
          <meshStandardMaterial color={HANDLE_COLOR} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Vertical bar */}
        <mesh>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color={HANDLE_COLOR} metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Center hub */}
        <mesh position={[0, 0, 0.03]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
          <meshStandardMaterial color={HANDLE_COLOR} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Bolt indicators (4 dots around edge) */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.6, Math.sin(angle) * 0.6, 0.06]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={FRAME_COLOR} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function VaultDoorScene() {
  return (
    <ThreeCanvas
      className="h-16 w-16"
      cameraPosition={[0, 0, 3]}
      fov={30}
      fallback={<VaultDoorFallback />}
    >
      <VaultDoor />
    </ThreeCanvas>
  );
}
