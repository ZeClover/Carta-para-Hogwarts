"use client";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ChapterId } from "@/content/chapters";
/** Demand-loop diagnostics and conservative quality reduction only during movement. */
export function SceneDiagnostics({ chapter }: { chapter: ChapterId }) {
  const { gl, scene, camera, size, get, setDpr } = useThree();
  const sampling = useRef({ prior: 0, times: [] as number[], slow: 0 });
  useFrame(() => {
    const canvas = gl.domElement;
    canvas.setAttribute("data-draw-calls", String(gl.info.render.calls));
    canvas.setAttribute("data-triangles", String(gl.info.render.triangles));
    canvas.setAttribute("data-geometries", String(gl.info.memory.geometries));
    canvas.setAttribute("data-textures", String(gl.info.memory.textures));
    for (const [name, attribute] of [
      [`hero-${chapter}`, "data-hero-bounds"],
      ["secondary-hourglass", "data-secondary-bounds"],
      ["mirror-surface", "data-mirror-bounds"],
      ["deskpolySurface13", "data-desk-drawer-bounds"],
    ]) {
      const hero = scene.getObjectByName(name);
      if (!hero) continue;
      const bounds = new THREE.Box3().setFromObject(hero);
      if (name === "deskpolySurface13") {
        const center = bounds.getCenter(new THREE.Vector3());
        center.z = bounds.max.z;
        center.project(camera);
        canvas.setAttribute(
          "data-desk-drawer-anchor",
          JSON.stringify({
            x: Math.round(((center.x + 1) * size.width) / 2),
            y: Math.round(((1 - center.y) * size.height) / 2),
          }),
        );
      }
      const points: THREE.Vector3[] = [];
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z])
            points.push(new THREE.Vector3(x, y, z).project(camera));
      const xs = points.map((p) => ((p.x + 1) * size.width) / 2),
        ys = points.map((p) => ((1 - p.y) * size.height) / 2);
      canvas.setAttribute(
        attribute,
        JSON.stringify({
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        }),
      );
    }
    const sample = sampling.current,
      now = performance.now();
    if (
      document.hidden ||
      canvas.getAttribute("data-camera-state") !== "travelling"
    ) {
      sample.prior = 0;
      return;
    }
    if (sample.prior) sample.times.push(now - sample.prior);
    sample.prior = now;
    if (sample.times.length >= 24) {
      const ordered = sample.times.slice().sort((a, b) => a - b),
        p95 = ordered[Math.floor(ordered.length * 0.95)];
      canvas.setAttribute("data-moving-frame-p95", p95.toFixed(2));
      if (p95 > 50) sample.slow++;
      else sample.slow = Math.max(0, sample.slow - 1);
      if (sample.slow >= 2 && get().viewport.dpr > 1) {
        setDpr(1);
        canvas.setAttribute("data-quality", "limited");
      }
      sample.times = [];
    }
  });
  return null;
}
