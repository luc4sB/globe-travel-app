"use client";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

export default function BackgroundStars() {
  return (
    <div className="fixed inset-0 -z-10 hidden dark:block">
      <Canvas gl={{ alpha: true }} camera={{ position: [0, 0, 1], fov: 50 }}>
        <color attach="background" args={["#020617"]} />
        <Stars
          radius={200}
          depth={80}
          count={8000}
          factor={3}
          saturation={0}
          fade
        />
      </Canvas>
    </div>
  );
}
