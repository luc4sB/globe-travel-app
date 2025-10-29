"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  TextureLoader,
  SRGBColorSpace,
  Group,
  Vector3,
  Quaternion,
} from "three";
import { useEffect, useRef, useState, Suspense } from "react";
import CountryBorders from "./CountryBorders";
import CountryLabels from "./CountryLabels";
import { useCountryClick } from "../hooks/CountryClick";
import CountryInfoPanel from "./CountryInfoPanel";
import * as THREE from "three";

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
  focusTarget,
}: {
  isDark: boolean;
  isRotationEnabled: boolean;
  onCountrySelect: (name: string) => void;
  focusTarget: { lat: number; lon: number } | null;
}) {
  const groupRef = useRef<Group>(null);
  const targetQuat = useRef(new THREE.Quaternion());

  const FRONT = new THREE.Vector3(0, 0, 1); 
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  const LON_OFFSET = Math.PI / 2; 

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;

    if (focusTarget) {
      g.quaternion.slerp(targetQuat.current, Math.min(1, delta * 2.2));
    } else if (isRotationEnabled) {
      g.rotateY(delta * 0.03);
    }
  });

  useCountryClick(onCountrySelect);

useEffect(() => {
  if (!focusTarget) return;

  const φ = THREE.MathUtils.degToRad(focusTarget.lat);
  const λ = THREE.MathUtils.degToRad(focusTarget.lon);

  const LON_OFFSET = Math.PI / 2;


  const s = new THREE.Vector3(
    Math.cos(φ) * Math.sin(λ + LON_OFFSET),
    Math.sin(φ),
    Math.cos(φ) * Math.cos(λ + LON_OFFSET)
  ).normalize();


  const qBase = new THREE.Quaternion().setFromUnitVectors(s, new THREE.Vector3(0, 0, 1));


  const northAfter = new THREE.Vector3(0, 1, 0).applyQuaternion(qBase);


  const flatNorth = new THREE.Vector3(northAfter.x, 0, northAfter.z).normalize();
  const dot = THREE.MathUtils.clamp(flatNorth.dot(new THREE.Vector3(0, 0, 1)), -1, 1);
  const cross = flatNorth.cross(new THREE.Vector3(0, 0, 1));
  const rollAngle = cross.y < 0 ? -Math.acos(dot) : Math.acos(dot);


  const qRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle);
  qBase.premultiply(qRoll);

  targetQuat.current.copy(qBase);
}, [focusTarget]);



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
  const [focusTarget, setFocusTarget] = useState<{
    lat: number;
    lon: number;
  } | null>(null);

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


  useEffect(() => {
    const handleFocus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      setSelectedCountry(detail.name);
      setFocusTarget({ lat: detail.lat, lon: detail.lon });
      setIsRotationEnabled(false);
    };
    window.addEventListener("focus-country", handleFocus);
    return () => window.removeEventListener("focus-country", handleFocus);
  }, []);

  const handleUserInteractionEnd = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setIsRotationEnabled(true);
      setFocusTarget(null);
    }, 60000);
  };

  const handleUserInteractionStart = () => {
    if (isRotationEnabled) setIsRotationEnabled(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  return (
    <div className="relative flex items-center justify-center w-full h-[520px] overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        performance={{ min: 0.3 }}
      >
        <ambientLight intensity={isDark ? 8.4 : 4.5} />
        <Suspense fallback={null}>
          <RotatingGroup
            isDark={isDark}
            isRotationEnabled={isRotationEnabled}
            onCountrySelect={setSelectedCountry}
            focusTarget={focusTarget}
          />
        </Suspense>

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
