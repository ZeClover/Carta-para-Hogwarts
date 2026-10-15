"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import type { ChapterId } from "@/content/chapters";
import asset from "@/content/hallway-backdrop.json";
import { retainChapterAsset } from "./AssetRegistry";

/** Architectural camera sets; hero placement and reading cameras stay intact. */
const compositions = {
  I: { angle: -2.5, scale: 2.8, at: [0.4, -1.1, 4] },
  II: { angle: -2.85, scale: 2.7, at: [-4.1, -1.1, 3.2] },
  III: { angle: -1.7, scale: 2.7, at: [2, -1.1, 5.6] },
  V: { angle: -2.65, scale: 3, at: [-2, -1.1, 4] },
  VI: { angle: -1.5, scale: 3, at: [1.6, -1.1, 6.8] },
  VII: { angle: -2.15, scale: 3.2, at: [0, -1.1, 5.8] },
} satisfies Partial<
  Record<ChapterId, { angle: number; scale: number; at: number[] }>
>;

export function VictorianBackdrop({
  chapter,
}: {
  chapter: Exclude<ChapterId, "IV">;
}) {
  const { size, gl } = useThree(),
    mobile = size.width <= 700;
  const selected = mobile ? asset.mobile : asset.desktop;
  const gltf = useLoader(GLTFLoader, selected.path);
  useEffect(
    () => retainChapterAsset(selected.path, gltf),
    [selected.path, gltf],
  );
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const material = (node.material as THREE.MeshStandardMaterial).clone();
      material.normalScale.set(0.45, 0.45);
      material.roughness = Math.max(material.roughness, 0.65);
      material.emissiveIntensity = 0.4;
      node.material = material;
      node.castShadow = false;
      node.receiveShadow = !mobile;
      node.raycast = () => {};
      if (material.name === "Window exterior") {
        material.transparent = true;
        material.opacity = 0.08;
        material.depthWrite = false;
        node.receiveShadow = false;
      }
    });
    return clone;
  }, [gltf, mobile]);
  const sky = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, "#687d94");
    gradient.addColorStop(0.75, "#b3bfc1");
    gradient.addColorStop(1, "#667b77");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  const composition = compositions[chapter];
  useEffect(() => {
    gl.domElement.setAttribute("data-backdrop", asset.id);
    gl.domElement.setAttribute("data-backdrop-asset", selected.sha256);
    gl.domElement.setAttribute("data-backdrop-view", chapter);
    gl.domElement.setAttribute(
      "data-backdrop-angle",
      String(composition.angle),
    );
  }, [chapter, composition.angle, selected.sha256, gl]);
  useEffect(
    () => () => {
      model.traverse((node) => {
        if (node instanceof THREE.Mesh)
          (node.material as THREE.Material).dispose();
      });
    },
    [model],
  );
  useEffect(() => () => sky.dispose(), [sky]);
  return (
    <group
      name={`architecture-${chapter}`}
      position={composition.at as [number, number, number]}
      rotation={[0, composition.angle, 0]}
      scale={composition.scale}
    >
      <primitive object={model} dispose={null} />
      <mesh
        position={[-3.64, 1.95, 0.56]}
        rotation={[0, Math.PI / 2, 0]}
        raycast={() => {}}
      >
        <planeGeometry args={[3, 2.5]} />
        <meshBasicMaterial map={sky} />
      </mesh>
    </group>
  );
}
