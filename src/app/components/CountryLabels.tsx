"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { Text, Billboard } from "@react-three/drei";

function latLongToVector3(lat: number, lon: number, radius = 1.23) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface Label {
  name: string;
  position: THREE.Vector3;
}

export default function CountryLabels({ isDark = false }: { isDark?: boolean }) {
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const newLabels: Label[] = [];

        data.features.forEach((feature: any) => {
          const { label_x, label_y, name } = feature.properties || {};
          if (typeof label_x !== "number" || typeof label_y !== "number") return;

          const pos = latLongToVector3(label_y, label_x, 1.23);
          newLabels.push({ name, position: pos });
        });

        console.log(`🧭 Loaded ${newLabels.length} country labels`);
        setLabels(newLabels);
      })
      .catch((err) => console.error("Error loading labels:", err));
  }, []);

  return (
    <>
      {labels.map((label, i) => (
        <Billboard
          key={i}
          position={label.position}
          follow
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <Text
  fontSize={0.035}
  color={isDark ? "#ffffff" : "#222222"}
  anchorX="center"
  anchorY="middle"
  outlineWidth={0.005}
  outlineColor={isDark ? "#000000" : "#ffffff"}
  renderOrder={10}
  material-transparent={true as any}
  material-opacity={
    Math.max(0, label.position.dot(new THREE.Vector3(0, 0, 1))) * 0.9 as any
  }
  material-depthWrite={false as any}
  material-blending={THREE.AdditiveBlending as any}
>
  {label.name}
</Text>

        </Billboard>
      ))}
    </>
  );
}
