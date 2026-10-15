"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/hourglass.json";
import { retainChapterAsset } from "./AssetRegistry";
/** Secondary, still object. Clear single-sided glass keeps the original sand visible. */
export function OrnateHourglass() {
  const gltf = useLoader(GLTFLoader, asset.path);
  const { size, gl } = useThree();
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const copy = (node.material as THREE.MeshStandardMaterial).clone();
      if (copy.name === "Material.042") {
        copy.side = THREE.FrontSide;
        copy.transparent = true;
        copy.depthWrite = false;
        node.castShadow = false;
        node.receiveShadow = false;
        gl.domElement.setAttribute(
          "data-hourglass-glass",
          JSON.stringify({
            color: copy.color.toArray(),
            opacity: copy.opacity,
            transmission:
              (copy as THREE.MeshPhysicalMaterial).transmission ?? 0,
            side: "front",
          }),
        );
      } else {
        node.castShadow = true;
        node.receiveShadow = true;
      }
      copy.normalScale.set(0.65, 0.65);
      copy.aoMapIntensity = 0.65;
      node.material = copy;
    });
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model),
      center = bounds.getCenter(new THREE.Vector3());
    return {
      model,
      height: bounds.max.y - bounds.min.y,
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
    };
  }, [gltf, gl]);
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
      ? 0.68 * Math.min(1, size.width / 390)
      : 1.25 * Math.min(1, size.width / 1440);
  const ratio = Math.min(1, size.width / (mobile ? 390 : 1440));
  return (
    <group
      name="secondary-hourglass"
      position={[(mobile ? 0.58 : 1.8) * ratio, 0.025, -0.25]}
      scale={height / instance.height}
      userData={{ secondaryId: asset.id, chapter: "VI" }}
    >
      <group position={instance.offset}>
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}
