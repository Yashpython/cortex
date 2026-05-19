"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleSwarm({ count = 600 }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribute points softly in a spherical shell
      const r = 2.0 + Math.random() * 1.5;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    // Smooth, slow multi-axis rotation
    pointsRef.current.rotation.y = time * 0.08;
    pointsRef.current.rotation.z = time * 0.05;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#6366f1"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// Inner smooth wireframe core
function InnerCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.12;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.6, 2]} />
      <meshBasicMaterial 
        color="#6366f1" 
        wireframe 
        transparent 
        opacity={0.12} 
      />
    </mesh>
  );
}

// Mouse tracking camera rig
function CameraRig({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    // Smoothly interpolate group rotation based on mouse
    const targetX = (state.pointer.x * Math.PI) / 8;
    const targetY = (state.pointer.y * Math.PI) / 8;
    
    groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.05;
    groupRef.current.rotation.x += (-targetY - groupRef.current.rotation.x) * 0.05;
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function Hero3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none opacity-90 mix-blend-screen">
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45 }}
        dpr={[1, 2]}
        eventSource={document.body}
        eventPrefix="client"
      >
        <CameraRig>
          <ParticleSwarm count={500} />
          <InnerCore />
        </CameraRig>
      </Canvas>
    </div>
  );
}
