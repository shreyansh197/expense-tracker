"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import type { Group } from "three";

function Coin() {
  const groupRef = useRef<Group>(null);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    if (reduced || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.6;
  });

  return (
    <group ref={groupRef} rotation={[0.15, 0, 0.1]}>
      {/* Coin body */}
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 0.15, 32]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Rim ring */}
      <mesh>
        <torusGeometry args={[1.2, 0.04, 8, 48]} />
        <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Dollar sign — front */}
      <Text
        position={[0, 0, 0.09]}
        fontSize={0.9}
        color="#92400e"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
      >
        $
      </Text>
      {/* Dollar sign — back */}
      <Text
        position={[0, 0, -0.09]}
        fontSize={0.9}
        color="#92400e"
        anchorX="center"
        anchorY="middle"
        rotation={[0, Math.PI, 0]}
        font="/fonts/inter-bold.woff"
      >
        $
      </Text>
    </group>
  );
}

export function CoinScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Pause rendering when off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-24 w-24">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
        frameloop={visible ? "always" : "never"}
        camera={{ position: [0, 0, 4], fov: 35 }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 5]} intensity={0.8} />
        <Coin />
      </Canvas>
    </div>
  );
}
