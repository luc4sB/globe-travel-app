"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ShootingStars() {
  const groupRef = useRef<THREE.Group>(null);
  const shootingStars = Array.from({ length: 6 }).map(() => ({
    position: new THREE.Vector3(
      Math.random() * 20 - 10,
      Math.random() * 10 - 5,
      -10,
    ),
    velocity: new THREE.Vector3(
      -0.1 - Math.random() * 0.1,
      -0.03 - Math.random() * 0.02,
      0,
    ),
    life: Math.random() * 300 + 300,
    size: 0.01 + Math.random() * 0.01,
  }));

  useFrame(() => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((star: any, i) => {
      const data = shootingStars[i];
      star.position.add(data.velocity);
      data.life -= 1;

      if (data.life < 0 || star.position.x < -12 || star.position.y < -6) {
        // reset to top right
        data.position.set(Math.random() * 15 + 5, Math.random() * 8 + 2, -10);
        data.life = Math.random() * 300 + 300;
        star.position.copy(data.position);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {shootingStars.map((data, i) => (
        <mesh
          key={i}
          position={data.position}
          scale={[data.size, data.size, data.size]}
        >
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={4.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
