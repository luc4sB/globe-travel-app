"use client";

import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";

function latLongToVector3(lat: number, lon: number, radius = 1.23) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

type Label = {
  name: string;
  position: THREE.Vector3;
  extent: number;
  opacity: number;
  font: number;
  score: number;
};

function estimateTextRectPx(
  camera: THREE.Camera,
  labelWorldPos: THREE.Vector3,
  fontSizeWorld: number,
  name: string,
  viewport: { width: number; height: number }
) {
  const normal = labelWorldPos.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  let right = normal.clone().cross(up);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  right.normalize();

  const p0 = labelWorldPos.clone();
  const p1 = labelWorldPos.clone().addScaledVector(right, fontSizeWorld);
  const proj0 = p0.project(camera);
  const proj1 = p1.project(camera);

  const x0 = (proj0.x * 0.5 + 0.5) * viewport.width;
  const x1 = (proj1.x * 0.5 + 0.5) * viewport.width;
  const pxPerWorld = Math.abs(x1 - x0);
  const widthPx = name.length * fontSizeWorld * pxPerWorld * 0.45;
  const heightPx = fontSizeWorld * pxPerWorld * 1.3;
  return { widthPx, heightPx };
}

export default function CountryLabels({ isDark = false }: { isDark?: boolean }) {
  const { camera, size } = useThree();
  const [labels, setLabels] = useState<Label[]>([]);
  const [visibleMap, setVisibleMap] = useState<Map<string, Label>>(new Map());
  const groupRef = useRef<THREE.Group>(null);

  const lastCamPos = useRef(new THREE.Vector3());
  const lastCamRot = useRef(new THREE.Euler());
  const lastGroupQuat = useRef(new THREE.Quaternion());
  const moveThreshold = 0.015;
  const rotThreshold = 0.01;
  const timeSinceLastUpdate = useRef(0);

  // --- Load & filter GeoJSON ---
  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const blacklist = new Set([
          "Isle of Man",
          "Guernsey",
          "Jersey",
          "N. Cyprus",
          "Northern Cyprus",
          "Svalbard",
          "Hong Kong",
          "Macau",
          "Gibraltar",
          "Puerto Rico",
          "Greenland",
          "Falkland Islands",
        ]);

        const list: Label[] = [];

        for (const f of data.features ?? []) {
          const { label_x, label_y, name } = f.properties || {};
          if (typeof label_x !== "number" || typeof label_y !== "number") continue;
          if (!name || blacklist.has(name)) continue;

          const pos = latLongToVector3(label_y, label_x, 1.23);
          let extent = 1;
          try {
            const geom = f.geometry;
            const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
            const first = polys?.[0]?.[0];
            if (Array.isArray(first)) {
              const lons = first.map((c: [number, number]) => c[0]);
              const lats = first.map((c: [number, number]) => c[1]);
              const lonSpan = Math.max(...lons) - Math.min(...lons);
              const latSpan = Math.max(...lats) - Math.min(...lats);
              extent = Math.max(0.001, lonSpan * Math.cos((label_y * Math.PI) / 180) * latSpan);
            }
          } catch {}

          list.push({ name, position: pos, extent, opacity: 0, font: 0.017, score: 0 });
        }

        const filtered: Label[] = [];
        for (const l of list) {
          const tooClose = filtered.some(
            (o) =>
              l.position.angleTo(o.position) < THREE.MathUtils.degToRad(1.2) &&
              l.extent < o.extent
          );
          if (!tooClose) filtered.push(l);
        }

        setLabels(filtered);
      });
  }, []);

  useFrame((_, delta) => {
    timeSinceLastUpdate.current += delta;

    const moved = camera.position.distanceTo(lastCamPos.current) > moveThreshold;
    const rotatedCam =
      Math.abs(camera.rotation.y - lastCamRot.current.y) > rotThreshold ||
      Math.abs(camera.rotation.x - lastCamRot.current.x) > rotThreshold;

    const group = groupRef.current;
    let rotatedGroup = false;
    if (group && lastGroupQuat.current.angleTo(group.quaternion) > 0.0005)
      rotatedGroup = true;

    const shouldRecompute =
      moved || rotatedCam || rotatedGroup || timeSinceLastUpdate.current > 3.0;

    if (!shouldRecompute) {
      setVisibleMap((prev) => {
        const m = new Map(prev);
        for (const [k, v] of m)
          m.set(k, { ...v, opacity: Math.min(1, v.opacity + delta * 0.8) });
        return m;
      });
      return;
    }

    lastCamPos.current.copy(camera.position);
    lastCamRot.current.copy(camera.rotation);
    if (group) lastGroupQuat.current.copy(group.quaternion);
    timeSinceLastUpdate.current = 0;

    const camPos = camera.position.clone();
    const dist = camPos.length();

    // Base scaling
    const baseFont = THREE.MathUtils.mapLinear(dist, 1.8, 3.2, 0.014, 0.027);
    const baseGap = THREE.MathUtils.mapLinear(dist, 1.8, 3.2, 12, 50);
    const labelBudget = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, 1.8, 3.2, 150, 70),
      50,
      200
    );

    const candidates: Label[] = [];
    const wp = new THREE.Vector3();

    for (const label of labels) {
      wp.copy(label.position);
      if (group) wp.applyMatrix4(group.matrixWorld);

      const n = wp.clone().normalize();
      const v = camPos.clone().sub(wp).normalize();
      const facing = n.dot(v);
      if (facing < -0.15) continue;

      // Fade based on distance
      const fade = THREE.MathUtils.clamp((facing - 0.1) / (1 - 0.1), 0, 1);
      if (fade <= 0.05) continue;

      const proj = wp.clone().project(camera);
      if (proj.z < -1 || proj.z > 1) continue;

      const centerBias = 1.0 - Math.min(1.0, proj.length() * 0.5);
      const extentNorm = THREE.MathUtils.clamp(
        THREE.MathUtils.mapLinear(Math.log10(label.extent + 1e-6), -3, 3, 0, 1),
        0,
        1
      );

      // Visibility tiers
      let zoomVisible = true;
      if (label.extent < 1 && dist > 2.5) zoomVisible = false; 
      if (label.extent < 0.2 && dist > 2.2) zoomVisible = false; 

      if (!zoomVisible) continue;

      const font = baseFont * (0.95 + extentNorm * 0.2);
      const score =
        fade *
        (1 + extentNorm * 0.4) *
        (0.6 + 0.4 * centerBias) *
        (0.8 + extentNorm * 0.6);

      candidates.push({ ...label, font, opacity: fade, score });
    }

    candidates.sort((a, b) => b.score - a.score || b.extent - a.extent);

    const accepted: Label[] = [];
    const rects: Array<{ x: number; y: number; w: number; h: number; extent: number }> = [];
    const tmp = new THREE.Vector3();

    for (const c of candidates) {
      tmp.copy(c.position);
      if (group) tmp.applyMatrix4(group.matrixWorld);
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (1 - (tmp.y * 0.5 + 0.5)) * size.height;

      const { widthPx, heightPx } = estimateTextRectPx(camera, tmp, c.font, c.name, size);
      const lengthFactor = Math.sqrt(c.name.length / 10);
      const gap = baseGap * lengthFactor * 0.7;
      const w = widthPx + gap;
      const h = heightPx + gap;

      let overlaps = false;
      for (const r of rects) {
        const dx = Math.abs(x - r.x);
        const dy = Math.abs(y - r.y);

        const allowance =
          c.extent > r.extent ? 0.25 : c.extent < 1 ? -0.1 : 0.0;

        if (dx < (w + r.w) * (0.5 + allowance) && dy < (h + r.h) * (0.5 + allowance)) {
          overlaps = true;
          break;
        }
      }

      if (overlaps) continue;

      rects.push({ x, y, w, h, extent: c.extent });
      accepted.push(c);
      if (accepted.length >= labelBudget) break;
    }

    setVisibleMap((prev) => {
      const newMap = new Map(prev);
      for (const [k, v] of newMap)
        if (!accepted.find((a) => a.name === k))
          newMap.set(k, { ...v, opacity: Math.max(0, v.opacity - delta * 1.2) });

      for (const a of accepted) {
        const old = newMap.get(a.name);
        const targetOpacity = a.opacity;
        const newOpacity = old
          ? THREE.MathUtils.lerp(old.opacity, targetOpacity, delta * 3)
          : targetOpacity * 0.5;
        newMap.set(a.name, { ...a, opacity: newOpacity });
      }

      for (const [k, v] of newMap)
        if (v.opacity <= 0.02) newMap.delete(k);

      return newMap;
    });
  });

  return (
    <group ref={groupRef}>
      {[...visibleMap.values()].map((label) => (
        <Billboard key={label.name} position={label.position}>
          <Text
            fontSize={label.font}
            color={isDark ? "#ffffff" : "#222222"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.0012}
            outlineColor={isDark ? "#000000" : "#ffffff"}
            material-transparent
            material-opacity={label.opacity}
            material-depthWrite={false}
            renderOrder={10}
          >
            {label.name}
          </Text>
        </Billboard>
      ))}
    </group>
  );
}
