"use client";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import type { ChapterId } from "@/content/chapters";
import { chapterDirection, chapterPose } from "./chapterDirection";
export function CameraDirector({
  chapter,
  still,
  turning,
  onJourney,
}: {
  chapter: ChapterId;
  still: boolean;
  turning?: boolean;
  onJourney?: (moving: boolean) => void;
}) {
  const { camera, size, gl, invalidate } = useThree();
  const previous = useRef<ChapterId | null>(null);
  const first = useRef(true),
    target = useRef(new THREE.Vector3());
  useEffect(() => {
    const changing = previous.current !== null && previous.current !== chapter;
    previous.current = chapter;
    const moving = changing && !still;
    onJourney?.(moving);
    gl.domElement.setAttribute(
      "data-camera-state",
      moving ? "travelling" : "arrived",
    );
    const pose = chapterPose(chapter, size.width < size.height);
    if (first.current) {
      camera.position.set(
        pose.camera[0] + 0.8,
        pose.camera[1] + 0.6,
        pose.camera[2] + 1.4,
      );
      target.current.set(...pose.target);
      first.current = false;
    }
    const update = () => {
      camera.lookAt(target.current);
      gl.domElement.setAttribute(
        "data-camera",
        camera.position
          .toArray()
          .map((n) => n.toFixed(3))
          .join(","),
      );
      gl.domElement.setAttribute(
        "data-camera-target",
        target.current
          .toArray()
          .map((n) => n.toFixed(3))
          .join(","),
      );
      gl.domElement.setAttribute(
        "data-protagonist",
        chapterDirection[chapter].object,
      );
      invalidate();
    };
    const start = camera.position.clone(),
      startTarget = target.current.clone();
    const end = new THREE.Vector3(...pose.camera),
      endTarget = new THREE.Vector3(...pose.target);
    const began = performance.now(),
      duration = still ? 0 : 2200;
    let frame = 0;
    // Real elapsed time prevents GSAP's lag smoothing from extending a journey on slow GPUs.
    const tick = (now: number) => {
      const p = duration
        ? Math.min(1, Math.max(0, (now - began) / duration))
        : 1;
      const eased = p * p * (3 - 2 * p);
      camera.position.lerpVectors(start, end, eased);
      target.current.lerpVectors(startTarget, endTarget, eased);
      update();
      if (p < 1) frame = requestAnimationFrame(tick);
      else {
        gl.domElement.setAttribute("data-camera-state", "arrived");
        onJourney?.(false);
      }
    };
    update();
    if (still) tick(began);
    else frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      onJourney?.(false);
    };
  }, [
    chapter,
    still,
    camera,
    size.width,
    size.height,
    gl,
    invalidate,
    onJourney,
  ]);
  useEffect(() => {
    if (still || !turning) return;
    const pose = chapterPose(chapter, size.width < size.height);
    const t = gsap.to(camera.position, {
      z: pose.camera[2] - 0.32,
      duration: 0.7,
      repeat: 1,
      yoyo: true,
      ease: "sine.inOut",
      onUpdate: () => {
        camera.lookAt(target.current);
        invalidate();
      },
    });
    return () => {
      t.kill();
      camera.position.z = pose.camera[2];
      invalidate();
    };
  }, [turning, still, chapter, camera, size.width, size.height, invalidate]);
  return null;
}
