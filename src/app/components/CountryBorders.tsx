"use client";

import { useEffect, useState, useMemo, forwardRef } from "react";
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

const CountryBorders = forwardRef<THREE.Group, { isDark?: boolean }>(function CountryBorders(
  { isDark = false },
  ref
) {
  const [borders, setBorders] = useState<LineData[]>([]);
  const [countryMeshes, setCountryMeshes] = useState<CountryMesh[]>([]);
  const [countryCenters, setCountryCenters] = useState<Record<string, THREE.Vector3>>({});

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const lines: LineData[] = [];
        const meshes: CountryMesh[] = [];
        const centers: Record<string, THREE.Vector3> = {};

        for (const feature of data.features ?? []) {
          const name = feature.properties?.name || "Unknown";
          const geom = feature.geometry;
          if (!geom || !geom.coordinates) continue;

          const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;

          for (const poly of polygons) {
            const outer = poly[0];
            if (!Array.isArray(outer)) continue;
            const simplified = outer.filter((_: any, i: number) => i % 12 === 0);
            const points = simplified.map(([lon, lat]: [number, number]) =>
              latLongToVector3(lat, lon, 1.202)
            );
            lines.push({ points });
          }

          let bestRing: [number, number][] | null = null;
          let bestLen = -1;

          for (const poly of polygons) {
            const outer = poly[0];
            if (!Array.isArray(outer)) continue;
            if (outer.length > bestLen) {
              bestLen = outer.length;
              bestRing = outer as [number, number][];
            }
          }

          if (bestRing && bestRing.length > 0) {
            const sum = new THREE.Vector3(0, 0, 0);
            for (const [lon, lat] of bestRing) {
              sum.add(latLongToVector3(lat, lon, 1).normalize());
            }
            if (sum.lengthSq() > 0) centers[name] = sum.normalize();
          }

          const verts: number[] = [];
          const idx: number[] = [];

          for (const poly of polygons) {
            const outer = poly[0];
            if (!outer || outer.length < 3) continue;

            const shapePts: THREE.Vector2[] = outer.map(
              ([lon, lat]: [number, number]) => new THREE.Vector2(lon, lat)
            );

            const triangles = THREE.ShapeUtils.triangulateShape(shapePts, []);

            triangles.forEach(([a, b, c]) => {
              const pts = [shapePts[a], shapePts[b], shapePts[c]];
              for (const p of pts) {
                const v3 = latLongToVector3(p.y, p.x, 1.23);
                verts.push(v3.x, v3.y, v3.z);
              }
              const base = verts.length / 3 - 3;
              idx.push(base, base + 1, base + 2);
            });
          }

          if (verts.length > 0) {
            let g = new THREE.BufferGeometry();
            g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
            g.setIndex(idx);
            g = BufferGeometryUtils.mergeVertices(g, 1e-6);
            g.computeVertexNormals();
            meshes.push({ name, geometry: g });
          }
        }

        setBorders(lines);
        setCountryMeshes(meshes);
        setCountryCenters(centers);
      })
      .catch((err) => console.error("Error loading countries.geojson:", err));
  }, []);

  const borderGeometry = useMemo(() => {
    if (!borders.length) return new THREE.BufferGeometry();

    const geometries: THREE.BufferGeometry[] = [];
    borders.forEach(({ points }) => {
      const pos: number[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        pos.push(...points[i].toArray(), ...points[i + 1].toArray());
      }
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
    <group ref={ref} userData={{ countryCenters }}>
      <lineSegments geometry={borderGeometry} material={borderMaterial} />
      {countryMeshes.map((c, i) => (
        <mesh key={i} geometry={c.geometry} material={invisibleMat} userData={{ countryName: c.name }} />
      ))}
    </group>
  );
});

export default CountryBorders;
