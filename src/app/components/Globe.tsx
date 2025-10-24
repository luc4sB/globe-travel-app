"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader, SRGBColorSpace, Group } from "three";
import { useEffect, useRef, useState } from "react";
import CountryPoints from "./CountryBorders";

function Earth({ isDark }: { isDark: boolean }) {
  const [dayTexture, nightTexture] = useLoader(TextureLoader, [
    "/textures/earth.jpg",
    "/textures/earth_night.jpg",
  ]);

  dayTexture.colorSpace = SRGBColorSpace;
  nightTexture.colorSpace = SRGBColorSpace;

  return (
    <mesh>
      <sphereGeometry args={[1.2, 96, 96]} />
      <meshStandardMaterial
        map={isDark ? nightTexture : dayTexture}
        roughness={1}
        metalness={0}
        emissive={isDark ? "#000000" : "#a3b3ff"}
        emissiveIntensity={isDark ? 0 : 0.045}
      />
    </mesh>
  );
}

function RotatingGroup({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0006;
  });

  return (
    <group ref={groupRef}>
      <Earth isDark={isDark} />
      <CountryPoints />
    </group>
  );
}

export default function Globe() {
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
    <div className="relative flex items-center justify-center w-full h-[520px]">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={isDark ? 8.4 : 4.5} />
        <RotatingGroup isDark={isDark} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
