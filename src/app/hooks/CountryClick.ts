"use client";

import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

export function useCountryClick(onSelect: (name: string, hitPoint: THREE.Vector3) => void) {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster()).current;
  const mouse = new THREE.Vector2();
  const hovered = useRef<THREE.Mesh | null>(null);

  const highlightMat = new THREE.MeshBasicMaterial({
    color: "#3b82f6",
    opacity: 0,
    transparent: true,
    depthWrite: false,
  });

  const mouseDownTime = useRef<number | null>(null);

  function clearHover() {
    if (hovered.current && hovered.current.userData.originalMaterial) {
      hovered.current.material = hovered.current.userData.originalMaterial;
      hovered.current = null;
      gl.domElement.style.cursor = "grab";
    }
  }

  useEffect(() => {
    function getIntersects(event: MouseEvent) {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const all = raycaster.intersectObjects(scene.children, true);
      return all.filter((i) => i.object.userData?.countryName);
    }

    function handleMouseDown() {
      mouseDownTime.current = performance.now();
    }

    function handleClick(event: MouseEvent) {
      const now = performance.now();
      const heldFor = mouseDownTime.current ? now - mouseDownTime.current : 0;
      if (heldFor > 250) return; // drag/hold

      const intersects = getIntersects(event);
      if (!intersects.length) return;

      const hit = intersects[0];
      const name = hit.object.userData?.countryName as string | undefined;
      if (!name) return;

      clearHover();
      onSelect(name, hit.point.clone());
    }

    function handleMove(event: MouseEvent) {
      const intersects = getIntersects(event);
      const hit = intersects[0];

      if (hovered.current) clearHover();

      if (hit && hit.object) {
        const mesh = hit.object as THREE.Mesh;
        if (mesh.userData.countryName && mesh.material) {
          mesh.userData.originalMaterial = mesh.material;
          mesh.material = highlightMat;
          hovered.current = mesh;
          gl.domElement.style.cursor = "pointer";
        }
      }
    }

    gl.domElement.addEventListener("mousedown", handleMouseDown);
    gl.domElement.addEventListener("click", handleClick);
    gl.domElement.addEventListener("mousemove", handleMove);

    return () => {
      gl.domElement.removeEventListener("mousedown", handleMouseDown);
      gl.domElement.removeEventListener("click", handleClick);
      gl.domElement.removeEventListener("mousemove", handleMove);
    };
  }, [gl, camera, scene, onSelect, raycaster]);
}
