"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/scroll.json";
import { retainChapterAsset } from "./AssetRegistry";
import { useEntranceFirstDraw } from "./useEntranceFirstDraw";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
export function AncientScroll({
  playback,
  onReady,
}: {
  playback: SceneEntrancePlayback;
  onReady?: (phase?: "assets") => void;
}) {
  const gltf = useLoader(GLTFLoader, asset.path),
    { size, gl, invalidate } = useThree();
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const m = (node.material as THREE.MeshStandardMaterial).clone();
        m.roughness = Math.max(
          m.roughness,
          m.name.includes("scroll") ? 0.78 : 0.4,
        );
        m.normalScale.set(0.65, 0.65);
        node.material = m;
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    const b = new THREE.Box3().setFromObject(model),
      c = b.getCenter(new THREE.Vector3());
    return {
      model,
      width: b.max.x - b.min.x,
      offset: new THREE.Vector3(-c.x, -b.min.y, -c.z),
    };
  }, [gltf]);
  useEffect(() => {
    const sample = (t: number) => {
      gl.domElement.setAttribute(
        "data-scroll-progress",
        THREE.MathUtils.clamp(t / 1.6, 0, 1).toFixed(3),
      );
      gl.domElement.setAttribute("data-scroll-asset", asset.sha256);
      invalidate();
    };
    const disconnect = playback.connect(sample);
    sample(onReady ? 0 : 1.6);
    return disconnect;
  }, [playback, onReady, gl, invalidate]);
  useEntranceFirstDraw(instance.model, playback, onReady);
  useEffect(
    () => () =>
      instance.model.traverse((n) => {
        if (n instanceof THREE.Mesh)
          (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) =>
            m.dispose(),
          );
      }),
    [instance],
  );
  const mobile = size.width <= 700,
    width =
      (mobile ? 1.85 : 3.2) * Math.min(1, size.width / (mobile ? 390 : 1440));
  return (
    <group
      position={[mobile ? 0 : -0.8, 0.025, 0]}
      scale={width / instance.width}
      userData={{ heroId: asset.id, chapter: "II" }}
    >
      <group position={instance.offset}>
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}
