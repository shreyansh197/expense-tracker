"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ThreeCanvas } from "./ThreeCanvas";
import * as THREE from "three";

const GOLD = "#f59e0b";
const GOLD_EDGE = "#d97706";
const DURATION = 0.65; // seconds

function FallingCoin() {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / DURATION, 1);

    // Gravity fall: y = 2 - 4.9 * t^2 (starts at y=2, falls)
    groupRef.current.position.y = 2 - 6 * t * t;

    // Tumble rotation
    groupRef.current.rotation.x = t * Math.PI * 2.5;
    groupRef.current.rotation.z = t * Math.PI * 0.8;

    // Fade out in last 30%
    if (t > 0.7) {
      const fade = 1 - (t - 0.7) / 0.3;
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = fade;
          child.material.transparent = true;
        }
      });
    }

    // Scale down slightly at end
    const scale = t > 0.8 ? 1 - (t - 0.8) * 2 : 1;
    groupRef.current.scale.setScalar(Math.max(scale, 0));
  });

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {/* Coin disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.08, 24]} />
        <meshStandardMaterial color={GOLD} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Rim ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.44, 0.04, 8, 24]} />
        <meshStandardMaterial color={GOLD_EDGE} metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Dollar sign — simple plane (center indent) */}
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[0.18, 16]} />
        <meshStandardMaterial color={GOLD_EDGE} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

interface CoinDropSceneProps {
  /** Called when the animation finishes */
  onComplete?: () => void;
}

export function CoinDropScene({ onComplete }: CoinDropSceneProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, DURATION * 1000 + 100);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <ThreeCanvas
      className="pointer-events-none h-16 w-16"
      cameraPosition={[0, 0, 4]}
      fov={30}
      fallback={null}
    >
      <FallingCoin />
    </ThreeCanvas>
  );
}
