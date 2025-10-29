"use client";

import { useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
function latLongToVector3(lat: number, lon: number, radius = 1.205) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

interface CountryMesh {
  name: string;
  geometry: THREE.BufferGeometry;
}

interface LineData {
  points: THREE.Vector3[];
}

export default function CountryBorders({ isDark = false }: { isDark?: boolean }) {
  const [borders, setBorders] = useState<LineData[]>([]);
  const [countryMeshes, setCountryMeshes] = useState<CountryMesh[]>([]);

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const lines: LineData[] = [];
        const meshes: CountryMesh[] = [];

        for (const feature of data.features ?? []) {
          const name = feature.properties?.name || "Unknown";
          const geom = feature.geometry;
          if (!geom || !geom.coordinates) continue;

          const polygons =
            geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

          // --- Borders (visible lines) ---
          for (const poly of polygons) {
            const outer = poly[0];
            if (!Array.isArray(outer)) continue;
            const simplified = outer.filter((_: any, i: number) => i % 12 === 0);
            const points = simplified.map(([lon, lat]: [number, number]) =>
              // Slightly increase the radius for country surface (so it floats above Earth)
            latLongToVector3(lat, lon, 1.202)

            );
            lines.push({ points });
          }

          // --- Triangulated mesh for raycasting ---
          const verts: number[] = [];
          const idx: number[] = [];

          for (const poly of polygons) {
            const outer = poly[0];
            if (outer.length < 3) continue;

            // Project to 2D plane (equirectangular)
const shapePts: THREE.Vector2[] = outer.map(
  ([lon, lat]: [number, number]) => new THREE.Vector2(lon, lat)
);

            const triangles = THREE.ShapeUtils.triangulateShape(shapePts, []);

            // Build geometry from 2D triangles and reproject to sphere
            triangles.forEach(([a, b, c]) => {
              const pts = [shapePts[a], shapePts[b], shapePts[c]];
              for (const p of pts) {
                const v3 = latLongToVector3(p.y, p.x, 1.23);
                verts.push(v3.x, v3.y, v3.z);
              }
              const base = idx.length;
              idx.push(base, base + 1, base + 2);
            });
          }

          if (verts.length > 0) {
            const geom = new THREE.BufferGeometry();
            geom.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
            geom.setIndex(idx);
            geom.computeVertexNormals();
            meshes.push({ name, geometry: geom });
          }
        }

        setBorders(lines);
        setCountryMeshes(meshes);
      })
      .catch((err) => console.error("Error loading countries.geojson:", err));
  }, []);

  const borderGeometry = useMemo(() => {
  if (!borders.length) return new THREE.BufferGeometry();
  const geometries: THREE.BufferGeometry[] = [];
  borders.forEach(({ points }) => {
    const pos: number[] = [];
    for (let i = 0; i < points.length - 1; i++)
      pos.push(...points[i].toArray(), ...points[i + 1].toArray());
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geometries.push(geo);
  });
  return BufferGeometryUtils.mergeGeometries(geometries, false);
}, [borders]);

  const borderMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: isDark ? "#d7d7d7" : "#e1e1e1",
        transparent: true,
        opacity: 0.6,
      }),
    [isDark]
  );

  const invisibleMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        visible: false,
      }),
    []
  );

  return (
    <group>
      <lineSegments geometry={borderGeometry} material={borderMaterial} />
      {countryMeshes.map((c, i) => (
        <mesh
          key={i}
          geometry={c.geometry}
          material={invisibleMat}
          userData={{ countryName: c.name }}
        />
      ))}
    </group>
  );
}
