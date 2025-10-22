"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader, SRGBColorSpace } from "three";
import { useEffect, useRef, useState } from "react";

function Earth({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<any>(null);

  const [dayTexture, nightTexture] = useLoader(TextureLoader, [
    "/textures/day.png",
    "/textures/earth_night.jpg",
  ]);

  dayTexture.colorSpace = SRGBColorSpace;
  nightTexture.colorSpace = SRGBColorSpace;

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.0006;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.2, 96, 96]} />
      <meshStandardMaterial
      map={isDark ? nightTexture : dayTexture}
      roughness={1}
      metalness={0}
      emissive={isDark ? "#000000" : "#a3b3ff"} // deep ocean glow for light mode
      emissiveIntensity={isDark ? 0 : 0.045} // subtle blue enhancement in day mode
/>

    </mesh>
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
    // Remove any background color here — let global Background.tsx handle it
    <div className="relative flex items-center justify-center w-full h-[520px]">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={isDark ? 8.4 : 4.5} />

        {/* The globe itself */}
        <Earth isDark={isDark} />

        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
