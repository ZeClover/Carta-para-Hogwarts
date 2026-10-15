"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/armillary.json";
import { retainChapterAsset } from "./AssetRegistry";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
import { useEntranceFirstDraw } from "./useEntranceFirstDraw";
/** One real separate ring turns a few degrees. The base, planets and other pivots stay fixed. */
export function ArmillarySphere({
  playback,
  onReady,
}: {
  playback: SceneEntrancePlayback;
  onReady?: (phase?: "assets") => void;
}) {
  const gltf = useLoader(GLTFLoader, asset.path);
  const { size, gl, invalidate } = useThree();
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const source = node.material as THREE.MeshStandardMaterial;
      const copy = source.clone();
      copy.normalScale.set(0.65, 0.65);
      copy.aoMapIntensity = 0.65;
      node.material = copy;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model),
      center = bounds.getCenter(new THREE.Vector3());
    const ring = model.getObjectByName("ecliptic_high");
    if (!ring)
      throw new Error("Armillary sphere: separate ecliptic ring missing");
    return {
      model,
      ring,
      rest: ring.quaternion.clone(),
      base: model.getObjectByName("base_wood_high")!,
      axis: new THREE.Vector3(0, 1, 0).transformDirection(
        ring.parent!.matrixWorld.clone().invert(),
      ),
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      height: bounds.max.y - bounds.min.y,
    };
  }, [gltf]);
  useEffect(() => {
    const rotation = new THREE.Quaternion();
    const sample = (time: number) => {
      const p = THREE.MathUtils.clamp(time / 2.1, 0, 1),
        angle = 0.075 * Math.sin(Math.PI * p) ** 2;
      instance.ring.quaternion
        .copy(instance.rest)
        .premultiply(rotation.setFromAxisAngle(instance.axis, angle));
      instance.model.updateMatrixWorld(true);
      gl.domElement.setAttribute("data-armillary-progress", p.toFixed(3));
      gl.domElement.setAttribute(
        "data-armillary-base",
        [
          ...instance.base.position.toArray(),
          ...instance.base.quaternion.toArray(),
        ]
          .map((n) => n.toFixed(5))
          .join(","),
      );
      gl.domElement.setAttribute(
        "data-armillary-ring",
        instance.ring.quaternion
          .toArray()
          .map((n) => n.toFixed(5))
          .join(","),
      );
      gl.domElement.setAttribute("data-armillary-asset", asset.sha256);
      invalidate();
    };
    const disconnect = playback.connect(sample);
    sample(onReady ? 0 : 2.1);
    return disconnect;
  }, [instance, playback, onReady, gl, invalidate]);
  useEntranceFirstDraw(instance.model, playback, onReady);
  useEffect(
    () => () =>
      instance.model.traverse((node) => {
        if (node instanceof THREE.Mesh)
          (Array.isArray(node.material)
            ? node.material
            : [node.material]
          ).forEach((m) => m.dispose());
      }),
    [instance],
  );
  const mobile = size.width <= 700,
    height = mobile
      ? 1.18 * Math.min(1, size.width / 390)
      : 2.6 * Math.min(1, size.width / 1440);
  const ratio = Math.min(1, size.width / (mobile ? 390 : 1440));
  return (
    <group
      position={[mobile ? -0.22 * ratio : ratio, 0.025, 0]}
      scale={height / instance.height}
      userData={{ heroId: asset.id, chapter: "VI" }}
    >
      <group position={instance.offset}>
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}
