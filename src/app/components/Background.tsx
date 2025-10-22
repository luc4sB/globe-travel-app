"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ShootingStars } from "./shootingStars";

export default function Background() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 1], fov: 75 }}>
        <color attach="background" args={[isDark ? "#030516" : "#030516"]} />
        <Stars
          radius={140}
          depth={100}
          count={isDark ? 9000 : 6000}
          factor={isDark ? 4.8 : 3.8}
          saturation={0.1}
          fade
          speed={0.05}
        />

        <ShootingStars />

        <ambientLight intensity={1.8} />
      </Canvas>
    </div>
  );
}
