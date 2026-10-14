"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/ink-quill.json";
import { retainChapterAsset } from "./AssetRegistry";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";

/** Original 1K maps and UVs. Only the separate quill moves, once on entry.
 * This atmospheric gesture writes no text and implies no character biography. */
export function InkQuill({
  playback,
  onReady,
}: {
  playback: SceneEntrancePlayback;
  onReady?: (phase?: "assets") => void;
}) {
  const gltf = useLoader(GLTFLoader, asset.path);
  const { gl, size, invalidate } = useThree();
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = !node.name.startsWith("Victorian_Ink_Bottle_");
      const clone = (material: THREE.Material) => {
        const copy = material.clone() as THREE.MeshStandardMaterial;
        // Depth-tested alpha avoids unsorted inner/outer glass triangles. Keep
        // the original alpha channel and all PBR maps; no painted replacement.
        copy.transparent = false;
        copy.depthWrite = true;
        if (node.name.startsWith("Feather_Quill")) copy.alphaTest = 0.25;
        else if (node.name.startsWith("Victorian_Ink_Bottle_"))
          copy.alphaHash = true;
        return copy;
      };
      node.material = Array.isArray(node.material)
        ? node.material.map(clone)
        : clone(node.material);
    });
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const quill = model.getObjectByName(asset.animation.target)!;
    return {
      model,
      quill,
      restPosition: quill.position.clone(),
      restQuaternion: quill.quaternion.clone(),
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      height: bounds.max.y - bounds.min.y,
      up: new THREE.Vector3(0, 1, 0).transformDirection(
        quill.parent!.matrixWorld.clone().invert(),
      ),
    };
  }, [gltf]);
  useEffect(() => {
    const tilt = new THREE.Quaternion(),
      axis = new THREE.Vector3(0, 0, 1);
    const sample = (time: number) => {
      const p = THREE.MathUtils.clamp(time / asset.animation.duration, 0, 1);
      // Zero displacement at both ends; the feather settles into its exact source pose.
      const lift = Math.sin(Math.PI * p) ** 2;
      const sway = lift * Math.sin(2 * Math.PI * p);
      instance.quill.position.copy(instance.restPosition);
      instance.quill.position.addScaledVector(instance.up, 0.008 * lift);
      instance.quill.quaternion
        .copy(instance.restQuaternion)
        .multiply(tilt.setFromAxisAngle(axis, 0.14 * sway));
      instance.model.updateMatrixWorld(true);
      gl.domElement.setAttribute("data-ink-progress", p.toFixed(3));
      gl.domElement.setAttribute(
        "data-ink-quill-pose",
        [
          ...instance.quill.position.toArray(),
          ...instance.quill.quaternion.toArray(),
        ]
          .map((n) => n.toFixed(5))
          .join(","),
      );
      gl.domElement.setAttribute("data-ink-asset", asset.sha256);
      invalidate();
    };
    const disconnect = playback.connect(sample);
    sample(onReady ? 0 : asset.animation.duration);
    return disconnect;
  }, [instance, playback, gl, invalidate, onReady]);
  useEffect(() => {
    let mounted = true,
      announced = false;
    onReady?.("assets");
    const restore: (() => void)[] = [];
    instance.model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = node.onAfterRender;
      node.onAfterRender = (...args) => {
        original.call(node, ...args);
        if (announced || !onReady) return;
        announced = true;
        queueMicrotask(() => {
          if (!mounted) return;
          playback.markDrawn();
          onReady();
          invalidate();
        });
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
  }, [instance, onReady, playback, invalidate]);
  useEffect(
    () => () => {
      instance.model.traverse((node) => {
        if (node instanceof THREE.Mesh)
          (Array.isArray(node.material)
            ? node.material
            : [node.material]
          ).forEach((m) => m.dispose());
      });
    },
    [instance],
  );
  const mobile = size.width <= 700;
  const height = mobile
    ? 1.2 * Math.min(1, size.width / 390)
    : 2.35 * Math.min(1, size.width / 1440);
  return (
    <group
      position={[mobile ? 0 : -0.35, 0.025, 0]}
      scale={height / instance.height}
      userData={{ heroId: asset.id, chapter: "III" }}
    >
      <group position={instance.offset}>
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}
