"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader, SRGBColorSpace, Group } from "three";
import { useEffect, useRef, useState } from "react";
import CountryBorders from "./CountryBorders";
import CountryLabels from "./CountryLabels";
import { useCountryClick } from "../hooks/CountryClick";
import CountryInfoPanel from "./CountryInfoPanel";

function Earth({ isDark }: { isDark: boolean }) {
  const [dayTexture, nightTexture] = useLoader(TextureLoader, [
    "/textures/earth.jpg",
    "/textures/earth_night.jpg",
  ]);
  dayTexture.colorSpace = SRGBColorSpace;
  nightTexture.colorSpace = SRGBColorSpace;

  return (
    <mesh visible>
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

function RotatingGroup({
  isDark,
  isRotationEnabled,
  onCountrySelect,
}: {
  isDark: boolean;
  isRotationEnabled: boolean;
  onCountrySelect: (name: string) => void;
}) {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (isRotationEnabled && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  // hook to handle click detection
  useCountryClick(onCountrySelect);

  return (
    <group ref={groupRef}>
      <Earth isDark={isDark} />
      <CountryBorders isDark={isDark} />
      <CountryLabels isDark={isDark} />
    </group>
  );
}

export default function Globe() {
  const [isDark, setIsDark] = useState(false);
  const [isRotationEnabled, setIsRotationEnabled] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

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

  const handleUserInteractionEnd = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setIsRotationEnabled(true);
    }, 60000);
  };

  const handleUserInteractionStart = () => {
    if (isRotationEnabled) setIsRotationEnabled(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-[520px]">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={isDark ? 8.4 : 4.5} />
        <RotatingGroup
          isDark={isDark}
          isRotationEnabled={isRotationEnabled}
          onCountrySelect={setSelectedCountry}
        />
        
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={1.8}
          maxDistance={3.2}
          zoomSpeed={0.4}
          rotateSpeed={0.6}
          onStart={handleUserInteractionStart}
          onEnd={handleUserInteractionEnd}
        />
      </Canvas>

      {/* Info panel on right */}
      <CountryInfoPanel
        selected={selectedCountry}
        onClose={() => setSelectedCountry(null)}
      />
    </div>
  );
}
