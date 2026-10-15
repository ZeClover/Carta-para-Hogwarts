"use client";
import { useEffect, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/hallway.json";
import { retainChapterAsset } from "./AssetRegistry";
import { useEntranceFirstDraw } from "./useEntranceFirstDraw";
import { ChapterModel } from "./ChapterModel";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
/** Original static corridor, fixed window, real bounded envelope flight. */
export function HallwayDelivery({
  playback,
  onReady,
  onAction,
}: {
  playback: SceneEntrancePlayback;
  onReady?: (phase?: "assets") => void;
  onAction: () => void;
}) {
  const { size, gl, invalidate } = useThree(),
    mobile = size.width <= 700;
  const selected = mobile ? asset.mobile : asset;
  const gltf = useLoader(GLTFLoader, selected.path);
  const letter = useRef<THREE.Group>(null),
    light = useRef<THREE.PointLight>(null);
  useEffect(
    () => retainChapterAsset(selected.path, gltf),
    [gltf, selected.path],
  );
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    model.traverse((n) => {
      if (!(n instanceof THREE.Mesh)) return;
      const m = (n.material as THREE.MeshStandardMaterial).clone();
      m.normalScale.set(0.55, 0.55);
      m.roughness = Math.max(0.45, m.roughness);
      m.emissiveIntensity = 0.45;
      n.material = m;
      n.castShadow = false;
      n.receiveShadow = true;
      if (m.name === "Window exterior") {
        m.transparent = true;
        m.opacity = 0.12;
        m.depthWrite = false;
        n.receiveShadow = false;
      }
    });
    return model;
  }, [gltf]);
  const sky = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d")!;
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#536a85");
    g.addColorStop(0.65, "#9bacb5");
    g.addColorStop(1, "#657573");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    x.fillStyle = "#4a5b64";
    x.beginPath();
    x.moveTo(0, 212);
    for (let i = 0; i <= 256; i += 16)
      x.lineTo(i, 195 + Math.sin(i * 0.037) * 12);
    x.lineTo(256, 256);
    x.lineTo(0, 256);
    x.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => {
    const start = new THREE.Vector3(-3.4, 1.85, 0.35),
      control = new THREE.Vector3(-2.65, 2.0, 1.05),
      end = new THREE.Vector3(-3.255, 0.688, 2.13);
    const sample = (t: number) => {
      const p = THREE.MathUtils.clamp(t / 3.6, 0, 1),
        f = THREE.MathUtils.clamp((p - 0.08) / 0.66, 0, 1),
        e = -(Math.cos(Math.PI * f) - 1) / 2;
      if (letter.current) {
        letter.current.position
          .copy(start)
          .multiplyScalar((1 - e) ** 2)
          .addScaledVector(control, 2 * (1 - e) * e)
          .addScaledVector(end, e * e);
        letter.current.rotation.set(
          -0.5 * Math.sin(Math.PI * e),
          0.08 + 0.24 * Math.sin(Math.PI * e),
          0.35 * Math.sin(Math.PI * e),
        );
        gl.domElement.setAttribute(
          "data-delivery-position",
          letter.current.position
            .toArray()
            .map((v) => v.toFixed(4))
            .join(","),
        );
      }
      if (light.current)
        light.current.intensity = 4 + 4 * Math.sin(Math.PI * p) ** 2;
      gl.domElement.setAttribute("data-hallway-progress", p.toFixed(3));
      gl.domElement.setAttribute("data-hallway-asset", selected.sha256);
      gl.domElement.setAttribute(
        "data-hallway-variant",
        mobile ? "mobile" : "desktop",
      );
      invalidate();
    };
    const disconnect = playback.connect(sample);
    sample(onReady ? 0 : 3.6);
    return disconnect;
  }, [playback, onReady, gl, invalidate, mobile, selected.sha256]);
  useEntranceFirstDraw(instance, playback, onReady);
  useEffect(
    () => () => {
      instance.traverse((n) => {
        if (n instanceof THREE.Mesh)
          (Array.isArray(n.material) ? n.material : [n.material]).forEach((m) =>
            m.dispose(),
          );
      });
      sky.dispose();
    },
    [instance, sky],
  );
  return (
    <group>
      <primitive object={instance} dispose={null} />
      <mesh position={[-3.64, 1.95, 0.56]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3, 2.5]} />
        <meshBasicMaterial map={sky} />
      </mesh>
      <pointLight
        ref={light}
        position={[-3.1, 2.2, 0.65]}
        color="#bfcfdf"
        intensity={4}
        distance={7}
      />
      <pointLight
        position={[-2.1, 2.1, 1.4]}
        color="#ffe3bf"
        intensity={12}
        distance={7}
      />
      <group
        ref={letter}
        name="hallway-letter"
        position={[-3.255, 0.688, 2.13]}
        scale={0.17}
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
      >
        <ChapterModel chapter="I" still sealOpen={false} />
      </group>
    </group>
  );
}
