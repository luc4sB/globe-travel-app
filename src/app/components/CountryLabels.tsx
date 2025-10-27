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
  opacity?: number;
};

const EDGE_FADE = 0.25;
const THROTTLE_FRAMES = 3;

function estimateTextRectPx(
  camera: THREE.Camera,
  labelPos: THREE.Vector3,
  fontSizeWorld: number,
  name: string,
  viewport: { width: number; height: number }
) {
  const right = labelPos.clone().normalize().cross(new THREE.Vector3(0, 1, 0)).normalize();
  if (!isFinite(right.x)) right.set(1, 0, 0);
  const p0 = labelPos.clone();
  const p1 = labelPos.clone().addScaledVector(right, fontSizeWorld);

  const proj0 = p0.clone().project(camera);
  const proj1 = p1.clone().project(camera);

  const x0 = (proj0.x * 0.5 + 0.5) * viewport.width;
  const x1 = (proj1.x * 0.5 + 0.5) * viewport.width;
  const pxPerWorld = Math.abs(x1 - x0);

  const avgChar = 0.6;
  const widthPx = Math.max(1, name.length * fontSizeWorld * pxPerWorld * avgChar);
  const heightPx = Math.max(1, fontSizeWorld * pxPerWorld * 1.8);

  return { widthPx, heightPx };
}

export default function CountryLabels({ isDark = false }: { isDark?: boolean }) {
  const { camera, size } = useThree();
  const [labels, setLabels] = useState<Label[]>([]);
  const [visible, setVisible] = useState<Label[]>([]);
  const frameSkip = useRef(0);

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list: Label[] = [];
        for (const f of data.features ?? []) {
          const { label_x, label_y, name } = f.properties || {};
          if (typeof label_x !== "number" || typeof label_y !== "number") continue;

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

          list.push({ name, position: pos, extent });
        }
        setLabels(list);
      });
  }, []);

useFrame(() => {
  if (++frameSkip.current % THROTTLE_FRAMES !== 0) return;

  const camPos = camera.position.clone();
  const dist = camPos.length();
  const baseFont = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(dist, 1.8, 3.2, 0.013, 0.023),
    0.013,
    0.023
  );
  const baseGap = THREE.MathUtils.clamp(
    THREE.MathUtils.mapLinear(dist, 1.8, 3.2, 10, 45),
    8,
    50
  );
  const labelBudget = Math.round(
    THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(dist, 1.8, 3.2, 200, 80),
      60,
      250
    )
  );

  const candidates: Array<Label & { font: number; score: number }> = [];

  for (const label of labels) {
    const n = label.position.clone().normalize();
    const v = camPos.clone().sub(label.position).normalize();
    const facing = n.dot(v);
    if (facing < -0.15) continue;

    const fade = THREE.MathUtils.clamp((facing - 0.1) / (1 - 0.1), 0, 1);
    if (fade <= 0.05) continue;

    const visMax =
      label.extent > 80 ? 3.35 :
      label.extent > 20 ? 3.0  :
      label.extent > 5  ? 2.65 :
                          2.45;
    if (dist > visMax) continue;

    const extentNorm = THREE.MathUtils.clamp(
      THREE.MathUtils.mapLinear(Math.log10(label.extent + 1e-6), -3, 3, 0, 1),
      0, 1
    );

    const font = baseFont * (0.95 + extentNorm * 0.15);
    const score = fade * (1 + extentNorm * 0.4);
    candidates.push({ ...label, opacity: fade, font, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  const accepted: Label[] = [];
  const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
  const tmp = new THREE.Vector3();

  for (const c of candidates) {
    tmp.copy(c.position).project(camera);
    const x = (tmp.x * 0.5 + 0.5) * size.width;
    const y = (1 - (tmp.y * 0.5 + 0.5)) * size.height;
    const lengthFactor = Math.sqrt(c.name.length / 10);
    const gap = baseGap * lengthFactor * 0.7;

    const { widthPx, heightPx } = estimateTextRectPx(
      camera,
      c.position,
      c.font,
      c.name,
      size
    );

    const w = widthPx + gap;
    const h = heightPx + gap;

    let overlaps = false;
    for (const r of rects) {
      const dx = Math.abs(x - r.x);
      const dy = Math.abs(y - r.y);
      if (dx < (w + r.w) * 0.5 && dy < (h + r.h) * 0.5) {
        overlaps = true;
        break;
      }
    }
    if (overlaps) continue;

    rects.push({ x, y, w, h });
    accepted.push(c);
    if (accepted.length >= labelBudget) break;
  }

  setVisible(accepted);
});

  return (
    <>
      {visible.map((label, i) => (
        <Billboard key={i} position={label.position}>
          <Text
            fontSize={(label as any).font ?? 0.017}
            color={isDark ? "#ffffff" : "#222222"}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.0012}
            outlineColor={isDark ? "#000000" : "#ffffff"}
            material-transparent
            material-opacity={label.opacity ?? 1}
            material-depthWrite={false}
            renderOrder={10}
          >
            {label.name}
          </Text>
        </Billboard>
      ))}
    </>
  );
}
