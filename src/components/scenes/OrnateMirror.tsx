"use client";
import { useEffect, useMemo } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import asset from "@/content/mirror.json";
import { retainChapterAsset } from "./AssetRegistry";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
import { useEntranceFirstDraw } from "./useEntranceFirstDraw";

/** Planar architectural reflection proxy, without a camera feed or generated character. */
export function OrnateMirror({
  playback,
  onReady,
}: {
  playback: SceneEntrancePlayback;
  onReady?: (phase?: "assets") => void;
}) {
  const gltf = useLoader(GLTFLoader, asset.path);
  const { size, gl, invalidate } = useThree();
  const mobile = size.width <= 700;
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    let glass!: THREE.Mesh;
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const m = node.material as THREE.MeshStandardMaterial;
      if (m.name === "Glass_material") {
        glass = node;
        return;
      }
      const copy = m.clone();
      copy.aoMapIntensity = 0.7;
      copy.normalScale.set(0.75, 0.75);
      copy.envMapIntensity = 1.1;
      node.material = copy;
      node.castShadow = true;
      node.receiveShadow = true;
    });
    if (!glass)
      throw new Error("Ornate Mirror: separate original glass is missing");
    const original = glass.material as THREE.MeshStandardMaterial;
    const geometry = glass.geometry.clone();
    geometry.computeBoundingBox();
    const z = geometry.boundingBox!.getCenter(new THREE.Vector3()).z;
    geometry.translate(0, 0, -z);
    const mirror = new Reflector(geometry, {
      color: 0xe0dfd2,
      clipBias: 0.003,
      textureWidth: mobile ? 256 : 512,
      textureHeight: mobile ? 256 : 512,
      multisample: 0,
    });
    mirror.name = "mirror-surface";
    const reflectionScene = createReflectionRoom(mobile);
    mirror.position.copy(glass.position);
    mirror.position.z += z;
    mirror.quaternion.copy(glass.quaternion);
    mirror.scale.copy(glass.scale);
    // Original glass atlas contributes gentle wear; the room remains clearly reflected.
    const shader = mirror.material as THREE.ShaderMaterial;
    shader.uniforms.patina = { value: original.map };
    shader.vertexShader = shader.vertexShader
      .replace("varying vec4 vUv;", "varying vec4 vUv; varying vec2 vPatina;")
      .replace("vUv = textureMatrix", "vPatina = uv; vUv = textureMatrix");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "varying vec4 vUv;",
        "varying vec4 vUv; varying vec2 vPatina; uniform sampler2D patina;",
      )
      .replace(
        "#include <tonemapping_fragment>",
        "gl_FragColor.rgb *= mix(0.92, 1.0, texture2D(patina, vPatina).r);\n#include <tonemapping_fragment>",
      );
    glass.parent!.add(mirror);
    glass.removeFromParent();
    const drawReflection = mirror.onBeforeRender;
    let signature = "",
      frames = 0;
    mirror.onBeforeRender = (...args) => {
      const [, , camera] = args;
      const next = [
        ...camera.matrixWorld.elements,
        ...camera.projectionMatrix.elements,
        ...mirror.matrixWorld.elements,
      ].join(",");
      if (next === signature) return;
      signature = next;
      // An architectural proxy avoids reflecting DOM surrogates, distant bays or
      // unlit floor backfaces. Same planar camera/projection, bounded room-only pass.
      const reflectionArgs = [...args] as Parameters<typeof drawReflection>;
      reflectionArgs[1] = reflectionScene;
      drawReflection.apply(mirror, reflectionArgs);
      gl.domElement.setAttribute("data-mirror-reflections", String(++frames));
      gl.domElement.setAttribute("data-mirror-reflection", "planar-room");
      gl.domElement.setAttribute(
        "data-mirror-resolution",
        mobile ? "256" : "512",
      );
    };
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model),
      center = bounds.getCenter(new THREE.Vector3());
    return {
      model,
      reflectionScene,
      mirror,
      geometry,
      offset: new THREE.Vector3(-center.x, -bounds.min.y, -center.z),
      height: bounds.max.y - bounds.min.y,
    };
  }, [gltf, mobile, gl]);
  useEntranceFirstDraw(instance.model, playback, onReady);
  useEffect(() => {
    const sample = (time: number) => {
      gl.domElement.setAttribute(
        "data-mirror-progress",
        THREE.MathUtils.clamp(time / 1.6, 0, 1).toFixed(3),
      );
      gl.domElement.setAttribute("data-mirror-asset", asset.sha256);
      invalidate();
    };
    const disconnect = playback.connect(sample);
    sample(onReady ? 0 : 1.6);
    return disconnect;
  }, [playback, onReady, gl, invalidate]);
  useEffect(
    () => () => {
      instance.model.traverse((node) => {
        if (node instanceof THREE.Mesh && node !== instance.mirror)
          (Array.isArray(node.material)
            ? node.material
            : [node.material]
          ).forEach((m) => m.dispose());
      });
      instance.reflectionScene.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.geometry.dispose();
          (Array.isArray(node.material)
            ? node.material
            : [node.material]
          ).forEach((m) => m.dispose());
        }
      });
      instance.mirror.dispose();
      instance.geometry.dispose();
    },
    [instance],
  );
  const height = mobile
    ? 1.1 * Math.min(1, size.width / 390)
    : 3.2 * Math.min(1, size.width / 1440);
  const ratio = Math.min(1, size.width / (mobile ? 390 : 1440));
  return (
    <group
      position={[mobile ? 0 : -0.8 * ratio + 1.0 * (1 - ratio), 0.025, 0]}
      scale={height / instance.height}
      userData={{ heroId: asset.id, chapter: "V" }}
    >
      <group position={instance.offset}>
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}

/** A small 3D room used only for the mirror's planar pass, with complete lit
 * surfaces even outside the main set. No character imagery or personal symbols. */
function createReflectionRoom(mobile: boolean) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#96826b");
  const room = new THREE.Group();
  room.position.x = 72;
  scene.add(room);
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(30, 24, 26),
    new THREE.MeshBasicMaterial({ color: "#967e65", side: THREE.BackSide }),
  );
  wall.position.set(0, 0, 4);
  room.add(wall);
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 4),
    new THREE.MeshBasicMaterial({ color: "#adc8d5" }),
  );
  const paneX = mobile ? 0 : -0.6;
  pane.position.set(paneX, mobile ? -0.7 : 1.0, 7.8);
  pane.rotation.y = Math.PI;
  room.add(pane);
  for (const x of [-1.4, 0, 1.4]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 4.15, 0.08),
      new THREE.MeshBasicMaterial({ color: "#584131" }),
    );
    frame.position.set(x + paneX, pane.position.y, 7.72);
    room.add(frame);
  }
  for (const y of [-2, 0, 2]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.95, 0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: "#584131" }),
    );
    frame.position.set(paneX, y + pane.position.y, 7.72);
    room.add(frame);
  }
  const candle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 0.85, 12),
    new THREE.MeshBasicMaterial({ color: "#b59b62" }),
  );
  candle.position.set(1.8, mobile ? -1.2 : 0.3, 7.5);
  room.add(candle);
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 8),
    new THREE.MeshBasicMaterial({ color: "#ffe2a5" }),
  );
  flame.position.copy(candle.position).add(new THREE.Vector3(0, 0.53, 0));
  flame.scale.y = 1.7;
  room.add(flame);
  return scene;
}
