"use client";
import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { ChapterId } from "@/content/chapters";
import { retainChapterAsset } from "./AssetRegistry";
import assets from "@/content/redesign-assets.json";

/** Critical hero: suspense propagates to the scene, never announces a placeholder as ready.
 * Cached geometry/textures are shared; each instance owns and disposes material clones only. */
export function ChapterModel({
  chapter,
  singlePage = false,
  sealOpen = false,
  still = false,
  onReady,
}: {
  chapter: ChapterId;
  singlePage?: boolean;
  sealOpen?: boolean;
  still?: boolean;
  onReady?: (phase?: "assets") => void;
}) {
  const { invalidate } = useThree();
  const asset = assets.find((a) => a.chapter === chapter)!;
  const gltf = useLoader(GLTFLoader, asset.path);
  useEffect(() => retainChapterAsset(asset.path, gltf), [asset.path, gltf]);
  const grain = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#dfd5c5";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
      ctx.strokeStyle = `rgba(80,53,33,${0.02 + (i % 7) * 0.006})`;
      const y = (i * 17) % 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(70, y + (i % 9), 180, y - (i % 11), 256, y);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const model = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.updateMatrixWorld(true);
    copy.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.userData.restPosition = o.position.clone();
      o.castShadow = true;
      o.receiveShadow = true;
      if (singlePage && chapter === "II") {
        const geometry = o.geometry.clone(),
          positions = geometry.getAttribute("position"),
          index = geometry.getIndex();
        const kept: number[] = [],
          point = new THREE.Vector3();
        const count = index?.count ?? positions.count;
        for (let i = 0; i < count; i += 3) {
          const ids = [0, 1, 2].map((k) => (index ? index.getX(i + k) : i + k));
          const center =
            ids.reduce(
              (sum, id) =>
                sum +
                point
                  .fromBufferAttribute(positions, id)
                  .applyMatrix4(o.matrixWorld).x,
              0,
            ) / 3;
          if (center >= -0.075) kept.push(...ids);
        }
        geometry.setIndex(kept);
        o.geometry = geometry;
        o.userData.singlePageGeometry = true;
      }
      const clone = (original: THREE.MeshStandardMaterial) => {
        const m = original.clone();
        if (/Walnut|Cotton|Leather|linen/i.test(m.name)) {
          m.map = grain;
          m.bumpMap = grain;
          m.bumpScale = /Walnut/.test(m.name) ? 0.018 : 0.003;
        }
        return m;
      };
      o.material = Array.isArray(o.material)
        ? o.material.map(clone)
        : clone(o.material);
    });
    return copy;
  }, [gltf, grain, chapter, singlePage]);
  const announced = useRef(false);
  useEffect(() => {
    announced.current = false;
    onReady?.("assets");
    let mounted = true;
    const restore: (() => void)[] = [];
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = node.onAfterRender;
      node.onAfterRender = (...args) => {
        original.call(node, ...args);
        if (onReady && !announced.current) {
          announced.current = true;
          // The color pass has actually drawn the critical mesh. No extra RAF can race the watchdog.
          queueMicrotask(() => {
            if (mounted) {
              onReady();
              invalidate();
            }
          });
        }
      };
      restore.push(() => {
        node.onAfterRender = original;
      });
    });
    invalidate();
    return () => {
      mounted = false;
      restore.forEach((fn) => fn());
    };
  }, [model, onReady, invalidate]);
  useEffect(() => {
    if (chapter !== "I") return;
    const timeline = gsap.timeline();
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const material = Array.isArray(node.material)
        ? node.material[0]
        : node.material;
      if (!/Burgundy wax|^Aged brass/.test(material.name)) return;
      const rest = node.userData.restPosition as THREE.Vector3;
      timeline.to(
        node.position,
        {
          y: rest.y + (sealOpen ? 0.045 : 0),
          z: rest.z - (sealOpen ? 0.7 : 0),
          duration: still ? 0 : 0.65,
          ease: "power2.out",
          onUpdate: invalidate,
        },
        0,
      );
    });
    return () => {
      timeline.kill();
    };
  }, [chapter, model, sealOpen, still, invalidate]);
  useEffect(
    () => () => {
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
          if (o.userData.singlePageGeometry) o.geometry.dispose();
        }
      });
      grain.dispose();
    },
    [model, grain],
  );
  return (
    <primitive
      object={model}
      dispose={null}
      userData={{ heroId: asset.id, chapter }}
    />
  );
}
