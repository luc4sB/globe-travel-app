"use client";

import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { Billboard, Text } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { setCountryVector } from "../lib/countryVectors";

function latLongToVector3(lat: number, lon: number, radius = 1.275) {
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
  visibleFrames?: number;
  invisibleFrames?: number;
  region?: string;
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

  useEffect(() => {
    const url = `${window.location.origin}/data/countries.geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
const blacklist = new Set([
  // Europe / microstates / dependencies
  "Isle of Man", "Guernsey", "Jersey", "Gibraltar", "Svalbard", "Åland",
  "Liechtenstein", "San Marino", "Andorra", "Monaco", "Vatican",
  "Kosovo", "Northern Cyprus", "Faroe Islands", "Azores", "Madeira",
  "Canary Islands", "Jan Mayen", "Saint Pierre and Miquelon", "Greenland",

  // Disputed / unrecognized / non-sovereign
  "Western Sahara", "Somaliland", "Palestine", "Taiwan", "Bir Tawil",
  "Spratly Islands", "Paracel Islands", "Scarborough Shoal",
  "Aksai Chin", "Arunachal Pradesh", "Kashmir", "Ashmore and Cartier Islands",
  "Coral Sea Islands", "Heard Island and McDonald Islands",
  "South Georgia and the South Sandwich Islands", "Bouvet Island",
  "Tristan da Cunha", "British Indian Ocean Territory", "Diego Garcia",

  // Asia / special admin regions
  "Hong Kong", "Macau",

  // Americas / Caribbean territories
  "Bermuda", "Puerto Rico", "Falkland Islands", "French Guiana",
  "Reunion", "Mayotte", "Guadeloupe", "Martinique", "Cayman Islands",
  "Aruba", "Curaçao", "Guam", "American Samoa", "Northern Mariana Islands",
  "New Caledonia", "French Polynesia", "Wallis and Futuna", "Pitcairn Islands",
  "Saint Helena", "Saint Kitts and Nevis", "Antigua and Barbuda", "Dominica",
  "Saint Lucia", "Grenada", "Barbados", "Comoros", "Seychelles", "Mauritius",
  "Maldives", "Micronesia", "Palau", "Nauru", "Tuvalu", "Kiribati",
  "Marshall Islands", "Vanuatu", "Samoa", "Tonga", "Niue", "Cook Islands",
  "Tokelau", "Cape Verde", "Anguilla", "British Virgin Islands",
  "U.S. Virgin Islands", "Saint Barthélemy", "Saint Martin", "Sint Maarten",
  "Turks and Caicos Islands", "Montserrat", "Bonaire", "Norfolk Island",
  "Christmas Island", "Cocos (Keeling) Islands", "Easter Island"
]);


        const alwaysKeep = new Set([
          "Russia", "China", "United States", "Canada", "Brazil",
          "Australia", "India", "Mexico", "Indonesia", "Argentina",
          "Saudi Arabia", "South Africa", "United Kingdom", "France",
          "Germany", "Italy", "Spain", "Egypt", "Turkey"
        ]);

        const list: Label[] = [];

        for (const f of data.features ?? []) {
          const { label_x, label_y, name } = f.properties || {};
          if (typeof label_x !== "number" || typeof label_y !== "number") continue;
          if (!name || blacklist.has(name)) continue;

          const pos = latLongToVector3(label_y, label_x, 1.225);
          let extent = 0;
          setCountryVector(name, pos);
          try {
            const geom = f.geometry;
            const polygons =
              geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
            const lonAll: number[] = [];
            const latAll: number[] = [];
            polygons.forEach((poly: any) => {
              if (!Array.isArray(poly[0])) return;
              const ring = poly[0];
              for (const [lon, lat] of ring) {
                lonAll.push(lon);
                latAll.push(lat);
              }
            });
            if (lonAll.length && latAll.length) {
              const lonSpan = Math.max(...lonAll) - Math.min(...lonAll);
              const latSpan = Math.max(...latAll) - Math.min(...latAll);
              extent = Math.max(0.001, lonSpan * Math.cos((label_y * Math.PI) / 180) * latSpan);
            }
          } catch (e) {}

          if (alwaysKeep.has(name)) extent = Math.max(extent, 5.0);

          list.push({ name, position: pos, extent, opacity: 0, font: 0.017, score: 0 });
        }

        // De-dupe near positions
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
    const dist = camera.position.length();
    const moved = camera.position.distanceTo(lastCamPos.current) > moveThreshold;
    const zoomChanged = Math.abs(dist - lastCamPos.current.length()) > 0.005;
    const rotatedCam =
      Math.abs(camera.rotation.y - lastCamRot.current.y) > rotThreshold ||
      Math.abs(camera.rotation.x - lastCamRot.current.x) > rotThreshold;

    const group = groupRef.current;
    const rotatedGroup = group && lastGroupQuat.current.angleTo(group.quaternion) > 0.0005;
    const shouldRecompute =
      moved || rotatedCam || rotatedGroup || zoomChanged || timeSinceLastUpdate.current > 2.0;

    const camPos = camera.position.clone();

if (!shouldRecompute) return;
    if (shouldRecompute) {
      lastCamPos.current.copy(camera.position);
      lastCamRot.current.copy(camera.rotation);
      if (group) lastGroupQuat.current.copy(group.quaternion);
      timeSinceLastUpdate.current = 0;
    }

    // --- ZOOM LEVEL CONTROL ---
    const baseFont = THREE.MathUtils.mapLinear(dist, 1.8, 3.8, 0.012, 0.04);
    const baseGap = THREE.MathUtils.mapLinear(dist, 1.8, 3.8, 10, 65);
    const zoomTier =
      dist < 2.3 ? "local" :
      dist < 2.9 ? "regional" :
      "global";

    const fontShrink =
      zoomTier === "global" ? 0.75 :
      zoomTier === "regional" ? 0.9 :
      1.0;


    const labelBudget =
      zoomTier === "global" ? 20 :
      zoomTier === "regional" ? 55 :
      120;

    const minExtent =
      zoomTier === "global" ? 6.0 :
      zoomTier === "regional" ? 1.8 :
      0.2;

    if (shouldRecompute) {
      const candidates: Label[] = [];
      const wp = new THREE.Vector3();

      for (const label of labels) {
        wp.copy(label.position);
        if (group) wp.applyMatrix4(group.matrixWorld);

        const n = wp.clone().normalize();
        const v = camPos.clone().sub(wp).normalize();
        const facing = n.dot(v);
        if (facing < -0.15) continue;
        const fade = THREE.MathUtils.clamp((facing - 0.1) / (1 - 0.1), 0, 1);
        if (fade <= 0.05) continue;
        if (label.extent < minExtent) continue;
        if (zoomTier === "global" && label.extent < 8.0) continue; 
        const proj = wp.clone().project(camera);
        if (proj.z < -1 || proj.z > 1) continue;

        const lat = Math.asin(n.y) * THREE.MathUtils.RAD2DEG;
        const centerBias = 1.0 - Math.min(1.0, proj.length() * 0.5);
        const extentNorm = THREE.MathUtils.clamp(
          THREE.MathUtils.mapLinear(Math.log10(label.extent + 1e-6), -3, 3, 0, 1),
          0, 1
        );

        const font = baseFont * (1.0 + extentNorm * 0.3) * fontShrink;

        const globalBias =
          zoomTier === "global"
            ? label.extent * 0.5
            : zoomTier === "regional"
            ? label.extent * 0.3
            : 1.0;

        const latPenalty = 1.0 - 0.25 * Math.abs(lat / 90);
        const prev = visibleMap.get(label.name);
        const persistenceBoost = prev ? 1.3 : 1.0;

        const score =
          fade *
          (0.6 + 0.4 * centerBias) *
          (0.8 + extentNorm * 0.6) *
          latPenalty *
          globalBias *
          persistenceBoost;

        candidates.push({ ...label, font, opacity: fade, score });
      }

      candidates.sort((a, b) => b.score - a.score || b.extent - a.extent);

      const accepted: Label[] = [];
      const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
      const tmp = new THREE.Vector3();

      for (const c of candidates) {
        tmp.copy(c.position);
        if (group) tmp.applyMatrix4(group.matrixWorld);
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * size.width;
        const y = (1 - (tmp.y * 0.5 + 0.5)) * size.height;

        const { widthPx, heightPx } = estimateTextRectPx(camera, tmp, c.font, c.name, size);
        const w = widthPx + baseGap * 0.6;
        const h = heightPx + baseGap * 0.6;

        let overlaps = false;
        for (const r of rects) {
          const dx = Math.abs(x - r.x);
          const dy = Math.abs(y - r.y);
          if (dx < (w + r.w) * 0.5 && dy < (h + r.h) * 0.5) {
            overlaps = true;
            break;
          }
        }
        if (overlaps && !visibleMap.has(c.name)) continue;

        rects.push({ x, y, w, h });
        accepted.push(c);
        if (accepted.length >= labelBudget) break;
      }

      // Fade & persistence logic
      setVisibleMap((prev) => {
        const newMap = new Map(prev);
        for (const [k, v] of newMap) {
          if (!accepted.find((a) => a.name === k)) {
            const inv = (v.invisibleFrames ?? 0) + 1;
            if (inv > 10) {
              newMap.set(k, { ...v, opacity: Math.max(0, v.opacity - delta * 2.0), invisibleFrames: inv });
              if (v.opacity <= 0.02) newMap.delete(k);
            } else {
              newMap.set(k, { ...v, invisibleFrames: inv });
            }
          }
        }
        for (const a of accepted) {
          const old = newMap.get(a.name);
          const newOpacity = old
            ? THREE.MathUtils.lerp(old.opacity, a.opacity, delta * 3)
            : a.opacity * 0.5;
          const visibleFrames = (old?.visibleFrames ?? 0) + 1;
          newMap.set(a.name, { ...a, opacity: newOpacity, visibleFrames, invisibleFrames: 0 });
        }
        return newMap;
      });
    }
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
            outlineWidth={label.font * 0.08}
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

