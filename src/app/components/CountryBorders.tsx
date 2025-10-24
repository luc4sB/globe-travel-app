"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

function latLongToVector3(lat: number, lon: number, radius = 1.2005) {
  //Slightly Earth’s 1.2 sphere radius
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface CountryBordersProps {
  isDark?: boolean;
}

export default function CountryBorders({ isDark = false }: CountryBordersProps) {
  const [borders, setBorders] = useState<{ points: THREE.Vector3[]; id: string }[]>([]);

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const lines: { points: THREE.Vector3[]; id: string }[] = [];

        data.features.forEach((feature: any, index: number) => {
          const geometry = feature.geometry;
          if (!geometry || !geometry.coordinates) return;

          const polygons =
            geometry.type === "Polygon"
              ? [geometry.coordinates]
              : geometry.coordinates;

          polygons.forEach((polygon: any, polyIndex: number) => {
            const outer = polygon[0];
            if (!Array.isArray(outer)) return;

            // Downsample border points to improve FPS (skiping every 6th)
            const simplified = outer.filter((_: any, i: number) => i % 6 === 0);

            const points = simplified.map(([lon, lat]: [number, number]) =>
              latLongToVector3(lat, lon)
            );

            lines.push({
              points,
              id: `${feature.properties?.name || "country"}-${index}-${polyIndex}`,
            });
          });
        });

        console.log(`🌍 Loaded ${lines.length} country borders`);
        setBorders(lines);
      })
      .catch((err) => console.error("Error loading countries.geojson:", err));
  }, []);

  const borderColor = isDark ? "#d7d7d7ff" : "#cfcfcfff";

  return (
    <>
      {borders.map(({ points, id }) => (
        <Line
          key={id}
          points={points}
          color={borderColor}
          lineWidth={0.5}
          opacity={0.7}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}
    </>
  );
}
