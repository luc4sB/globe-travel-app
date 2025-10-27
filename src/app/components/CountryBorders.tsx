"use client";

import { useEffect, useState, useMemo } from "react";
import * as THREE from "three";

function latLongToVector3(lat: number, lon: number, radius = 1.2005) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface LineData {
  points: THREE.Vector3[];
}

export default function CountryBorders({ isDark = false }: { isDark?: boolean }) {
  const [borders, setBorders] = useState<LineData[]>([]);

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const lines: LineData[] = [];
        data.features.forEach((feature: any) => {
          const geometry = feature.geometry;
          if (!geometry || !geometry.coordinates) return;

          const polygons =
            geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

          polygons.forEach((polygon: any) => {
            const outer = polygon[0];
            if (!Array.isArray(outer)) return;

            const simplified = outer.filter((_: any, i: number) => i % 8 === 0);
            const points = simplified.map(([lon, lat]: [number, number]) =>
              latLongToVector3(lat, lon)
            );

            lines.push({ points });
          });
        });
        setBorders(lines);
      })
      .catch((err) => console.error("Error loading countries.geojson:", err));
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];

    borders.forEach(({ points }) => {
      for (let i = 0; i < points.length - 1; i++) {
        positions.push(...points[i].toArray(), ...points[i + 1].toArray());
      }
    });

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [borders]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: isDark ? "#d7d7d7" : "#e1e1e1ff",
        transparent: true,
        opacity: 0.6,
      }),
    [isDark]
  );

  return <lineSegments geometry={geometry} material={material} />;
}
