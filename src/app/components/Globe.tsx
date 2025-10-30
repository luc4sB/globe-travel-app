"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  TextureLoader,
  SRGBColorSpace,
  Group,
} from "three";
import { useEffect, useRef, useState, Suspense } from "react";
import CountryBorders from "./CountryBorders";
import CountryLabels from "./CountryLabels";
import { useCountryClick } from "../hooks/CountryClick";
import CountryInfoPanel from "./CountryInfoPanel";
import * as THREE from "three";

/** ---------- Earth ---------- */
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
  focusName,
  controlsRef,
}: {
  isDark: boolean;
  isRotationEnabled: boolean;
  onCountrySelect: (name: string) => void;
  focusName: string | null;
  controlsRef: React.RefObject<any>;
}) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();

  // cache: country name -> unit vector (from label_x/label_y)
  const vectorsCache = useRef(new Map<string, THREE.Vector3>());

  // tween state
  const fromDir = useRef(new THREE.Vector3(0, 0, -1));
  const toDir   = useRef(new THREE.Vector3(0, 0, -1));
  const t       = useRef(1);

  useCountryClick(onCountrySelect);

  function latLongToVector3(lat: number, lon: number, radius = 1): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon - 180) * (Math.PI / 180);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = -radius * Math.cos(phi);
  const z = -radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}
  async function getVector(name: string): Promise<THREE.Vector3 | null> {
    if (vectorsCache.current.has(name)) return vectorsCache.current.get(name)!;


    // @ts-ignore
    if (!window.__countriesGeo) {
      const res = await fetch(`${window.location.origin}/data/countries.geojson`);
      // @ts-ignore
      window.__countriesGeo = await res.json();
    }
    // @ts-ignore
    const data = window.__countriesGeo as any;

    const f = (data.features || []).find((x: any) => x?.properties?.name === name);
    if (!f) return null;

    const { label_x: lon, label_y: lat } = f.properties || {};
    if (typeof lat !== "number" || typeof lon !== "number") return null;

    const v = latLongToVector3(lat, lon, 1).normalize();
    vectorsCache.current.set(name, v);
    return v;
  }

useEffect(() => {
  (async () => {
    if (!focusName) return;

    const v = await getVector(focusName);
    if (!v) return;

    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }

    camera.updateMatrixWorld(true);

    const dirNow = camera.position.clone().normalize();
    const dirNext = v.clone().negate().normalize();

    fromDir.current.copy(dirNow);
    toDir.current.copy(dirNext);

    t.current = 0.0001;
  })();
}, [focusName, controlsRef, camera]);



  // animate: spherical slerp along the orbit; optional idle Y-spin
// animate: spherical slerp along the orbit; optional idle Y-spin
useFrame((_, delta) => {
  const radius = camera.position.length();

  // Smooth ease — slower, more natural
  if (t.current < 1) {
    t.current = Math.min(1, t.current + delta * 0.8);
    const k = 1 - Math.exp(-3.5 * t.current);

    // Spherical interpolation helper (avoids pole flip)
    const dot = Math.min(Math.max(fromDir.current.dot(toDir.current), -1), 1);
    const theta = Math.acos(dot) * k;
    const rel = toDir.current
      .clone()
      .sub(fromDir.current.clone().multiplyScalar(dot))
      .normalize();

    const dir = fromDir.current
      .clone()
      .multiplyScalar(Math.cos(theta))
      .add(rel.multiplyScalar(Math.sin(theta)))
      .normalize();

    // Move camera along spherical arc
    camera.position.copy(dir.multiplyScalar(radius));
    controlsRef.current?.update();
  } else if (isRotationEnabled) {
    groupRef.current?.rotateY(delta * 0.02); // idle spin
  }
});



  return (
    <group ref={groupRef}>
      <Earth isDark={isDark} />
      <CountryBorders isDark={isDark} />
      <CountryLabels isDark={isDark} />
    </group>
  );
}



/** ---------- Globe (parent) ---------- */
export default function Globe() {
  const [isDark, setIsDark] = useState(false);
  const [isRotationEnabled, setIsRotationEnabled] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [focusName, setFocusName] = useState<string | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const controlsRef = useRef<any>(null);

  // Detect dark mode changes
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

  // External "focus-country" event: detail = { name }
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.name) return;

      setSelectedCountry(detail.name);
      setFocusName(detail.name);
      setIsRotationEnabled(false);
    };
    window.addEventListener("focus-country", handleFocus);
    return () => window.removeEventListener("focus-country", handleFocus);
  }, []);

  // Interaction timers (resume idle rotation after 60s)
  const handleUserInteractionEnd = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setIsRotationEnabled(true);
      setFocusName(null);
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
            onCountrySelect={(name) => {
              setSelectedCountry(name);
              setFocusName(name);
              setIsRotationEnabled(false);
            }}
            focusName={focusName}
            controlsRef={controlsRef}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom
          minDistance={1.8}
          maxDistance={3.2}
          zoomSpeed={0.4}
          rotateSpeed={0.6}
          // keep world Y as up -> poles fixed
          onStart={handleUserInteractionStart}
          onEnd={handleUserInteractionEnd}
        />
      </Canvas>

      <CountryInfoPanel
        selected={selectedCountry}
        onClose={() => setSelectedCountry(null)}
      />
    </div>
  );
}
