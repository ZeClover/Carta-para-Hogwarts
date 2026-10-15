"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/desk.json";
import { retainChapterAsset } from "./AssetRegistry";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
/** Original separate center drawer. Other drawers and door keep the supplied open poses.
 * No original animation clip exists: this opening is an explicitly procedural translation. */
export function VictorianDesk({
  playback,
  onSelect,
}: {
  playback: SceneEntrancePlayback;
  onSelect?: (id: string) => void;
}) {
  const gltf = useLoader(GLTFLoader, asset.path),
    { size, gl, invalidate } = useThree();
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    model.rotation.y = -Math.PI / 2;
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const m = (node.material as THREE.MeshStandardMaterial).clone();
      m.transparent = false;
      m.depthWrite = true;
      m.alphaTest = 0.1;
      m.emissiveIntensity = 0.03;
      m.metalness = 0.12;
      m.roughness = 0.9;
      m.normalScale.set(0.7, 0.7);
      m.aoMapIntensity = 0.6;
      node.material = m;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    const drawer = model.getObjectByName("deskpolySurface13");
    if (!drawer)
      throw new Error(
        "Victorian Desk: separate original center drawer missing",
      );
    drawer.userData.deskQuestion = "VII10";
    const rest = drawer.position.clone();
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model),
      center = bounds.getCenter(new THREE.Vector3());
    return {
      model,
      drawer,
      rest,
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      width: bounds.max.x - bounds.min.x,
    };
  }, [gltf]);
  useEffect(() => {
    const axis = new THREE.Vector3(1, 0, 0);
    const sample = (time: number) => {
      const p = THREE.MathUtils.clamp(time / 2.2, 0, 1),
        eased = -(Math.cos(Math.PI * p) - 1) / 2;
      instance.drawer.position
        .copy(instance.rest)
        .addScaledVector(axis, -23.633079528808594 * (1 - eased));
      instance.model.updateMatrixWorld(true);
      gl.domElement.setAttribute("data-desk-progress", p.toFixed(3));
      gl.domElement.setAttribute(
        "data-desk-drawer",
        instance.drawer.position.x.toFixed(4),
      );
      gl.domElement.setAttribute("data-desk-asset", asset.sha256);
      invalidate();
    };
    const disconnect = playback.connect(sample);
    sample(2.2);
    return disconnect;
  }, [instance, playback, gl, invalidate]);
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
    width =
      (mobile ? 2.8 : 5) * Math.min(1, size.width / (mobile ? 390 : 1440));
  const ratio = Math.min(1, size.width / (mobile ? 390 : 1440));
  return (
    <group
      position={[
        mobile ? 0 : -0.7 * ratio + 0.6 * (1 - ratio),
        mobile ? -0.7 : -1.1,
        0,
      ]}
      scale={width / instance.width}
      userData={{ heroId: asset.id, chapter: "VII" }}
    >
      <group
        position={instance.offset}
        onClick={(event) => {
          let node: THREE.Object3D | null = event.object;
          while (node && !node.userData.deskQuestion) node = node.parent;
          if (node?.userData.deskQuestion && onSelect) {
            event.stopPropagation();
            onSelect(node.userData.deskQuestion);
          }
        }}
      >
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}
