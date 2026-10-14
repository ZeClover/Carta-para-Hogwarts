"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import asset from "@/content/photo-box.json";
import { retainChapterAsset } from "./AssetRegistry";
import {
  PHOTO_ANCHORS_EVENT,
  type PhotoAnchor,
  type PhotoBoxPlayback,
} from "./photoBoxMotion";

/** The camera director owns the clock: the lid and camera cannot drift apart.
 * Original UVs, artwork and rotation keys are used without procedural replacement. */
export function PhotoBox({
  playback,
  onReady,
  onSelect,
  selected,
}: {
  playback: PhotoBoxPlayback;
  onReady?: (phase?: "assets") => void;
  onSelect?: (id: string) => void;
  selected?: string;
}) {
  const gltf = useLoader(GLTFLoader, asset.path);
  const { gl, invalidate, camera, size } = useThree();
  useEffect(() => retainChapterAsset(asset.path, gltf), [gltf]);
  const instance = useMemo(() => {
    const model = gltf.scene.clone(true);
    const root = model.getObjectByName("GLTF_SceneRootNode")!;
    model.updateMatrixWorld(true);
    const photos: THREE.Object3D[] = [];
    for (let i = 1; i <= 8; i++) {
      const node = root.children.find((o) => o.name.startsWith(`Photo_${i}_`))!;
      photos.push(node);
    }
    // Two additional prints reuse original paper geometry/UVs. They are navigation
    // points for the last two EXISTING questions, never invented character memories.
    for (let i = 0; i < 2; i++) {
      const copy = photos[i].clone(true);
      copy.name = `Photo_navigation_${i + 9}`;
      root.add(copy);
      photos.push(copy);
    }
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const clone = (m: THREE.Material) => {
        const copy = m.clone() as THREE.MeshStandardMaterial;
        copy.userData.restColor = copy.color.clone();
        if (copy.normalMap) copy.normalScale.set(0.6, 0.6);
        return copy;
      };
      o.material = Array.isArray(o.material)
        ? o.material.map(clone)
        : clone(o.material);
    });
    for (const [i, photo] of photos.entries()) {
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(photo);
      const center = bounds.getCenter(new THREE.Vector3());
      const inBox = i >= 8;
      const x = inBox ? 0.33 + (i - 8) * 0.53 : -1.85 + (i % 2) * 0.7;
      const z = inBox
        ? i === 8
          ? -0.29
          : 0.29
        : -0.9 + Math.floor(i / 2) * 0.6;
      photo.position.add(
        new THREE.Vector3(
          (x - 0.6) / 4.8 - 0.108382 - center.x,
          (inBox ? 0.029 : 0.001) - bounds.min.y,
          z / 4.8 + 0.016031 - center.z,
        ),
      );
      photo.userData.photoQuestion = `VII${String(i + 1).padStart(2, "0")}`;
    }
    model.updateMatrixWorld(true);
    const mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(
      gltf.animations.find((c) => c.name === asset.animation.name)!,
    );
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.play();
    mixer.setTime(0);
    return { model, photos, mixer };
  }, [gltf]);
  const group = useRef<THREE.Group>(null);
  const lastAnchors = useRef("");
  useEffect(() => {
    const sample = (time: number) => {
      instance.mixer.setTime(
        Math.min(asset.animation.openingEnd, Math.max(0, time)),
      );
      instance.model.updateMatrixWorld(true);
      gl.domElement.setAttribute("data-photo-box-time", time.toFixed(3));
      gl.domElement.setAttribute("data-photo-box-clip", asset.animation.name);
      gl.domElement.setAttribute(
        "data-photo-box-lid",
        instance.model
          .getObjectByName("Cover_2")!
          .quaternion.toArray()
          .map((v) => v.toFixed(4))
          .join(","),
      );
      invalidate();
    };
    const disconnect = playback.connect(sample);
    // Departing bay remains open and still while the next chapter arrives.
    sample(onReady ? 0 : asset.animation.openingEnd);
    return disconnect;
  }, [instance, playback, gl, invalidate, onReady]);
  useEffect(() => {
    let mounted = true,
      announced = false;
    onReady?.("assets");
    const restore: (() => void)[] = [];
    instance.model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const original = o.onAfterRender;
      o.onAfterRender = (...args) => {
        original.call(o, ...args);
        if (!announced && onReady) {
          announced = true;
          queueMicrotask(() => {
            if (mounted) {
              playback.markDrawn();
              onReady();
              invalidate();
            }
          });
        }
      };
      restore.push(() => {
        o.onAfterRender = original;
      });
    });
    invalidate();
    return () => {
      mounted = false;
      restore.forEach((fn) => fn());
    };
  }, [instance, onReady, invalidate, playback]);
  useEffect(() => {
    for (const photo of instance.photos)
      photo.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          const material = m as THREE.MeshStandardMaterial;
          material.color.copy(material.userData.restColor);
          if (photo.userData.photoQuestion === selected)
            material.color.multiply(new THREE.Color("#fff0d1"));
        }
      });
    invalidate();
  }, [instance, selected, invalidate]);
  useFrame(() => {
    if (!group.current || !onReady) return;
    group.current.updateWorldMatrix(true, true);
    const points: PhotoAnchor[] = instance.photos.map((o) => {
      const p = new THREE.Box3()
        .setFromObject(o)
        .getCenter(new THREE.Vector3())
        .project(camera);
      return {
        id: o.userData.photoQuestion,
        x: Math.round(((p.x + 1) * size.width) / 2),
        y: Math.round(((1 - p.y) * size.height) / 2),
        visible: p.z > -1 && p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1,
      };
    });
    const value = JSON.stringify(points);
    if (value === lastAnchors.current) return;
    lastAnchors.current = value;
    gl.domElement.setAttribute("data-photo-anchors", value);
    window.dispatchEvent(
      new CustomEvent(PHOTO_ANCHORS_EVENT, { detail: points }),
    );
  });
  useEffect(
    () => () => {
      instance.mixer.stopAllAction();
      instance.mixer.uncacheRoot(instance.model);
      instance.model.traverse((o) => {
        if (o instanceof THREE.Mesh)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
      });
    },
    [instance],
  );
  return (
    <group
      ref={group}
      position={[size.width <= 700 ? 0.05 : 0, 0.025, 0]}
      scale={
        size.width <= 700
          ? 2.3 * Math.min(1, size.width / 390)
          : 4.8 * Math.min(1, size.width / 1440)
      }
      userData={{ heroId: asset.id, chapter: "VII" }}
    >
      <group
        position={[0.108382, 0, -0.016031]}
        onClick={(event) => {
          let node: THREE.Object3D | null = event.object;
          while (node && !node.userData.photoQuestion) node = node.parent;
          if (node?.userData.photoQuestion && onSelect) {
            event.stopPropagation();
            onSelect(node.userData.photoQuestion);
          }
        }}
      >
        <primitive object={instance.model} dispose={null} />
      </group>
    </group>
  );
}
