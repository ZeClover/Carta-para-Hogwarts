"use client";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import type { ChapterId } from "@/content/chapters";
import {
  chapterDirection,
  chapterPose,
  chapterOrder,
} from "./chapterDirection";

/** Sole camera writer. Reading and keyboard resizes never start a camera tween. */
export function CameraDirector({
  chapter,
  still,
  opening = false,
  onJourney,
}: {
  chapter: ChapterId;
  still: boolean;
  opening?: boolean;
  turning?: boolean;
  onJourney?: (moving: boolean) => void;
}) {
  const { camera, size, gl, invalidate } = useThree();
  const previous = useRef<{ chapter: ChapterId; opening: boolean } | null>(
    null,
  );
  const target = useRef(new THREE.Vector3());
  const animating = useRef(false);
  const portrait = size.width <= 700;
  useEffect(() => {
    gsap.ticker.lagSmoothing(0);
    const prior = previous.current;
    previous.current = { chapter, opening };
    const changing =
      !!prior && (prior.chapter !== chapter || prior.opening !== opening);
    const moving = changing && !still;
    const report = changing || !prior || still || animating.current;
    animating.current = moving;
    if (report) onJourney?.(moving);
    const pose = chapterPose(chapter, portrait);
    const end = new THREE.Vector3(...pose.camera);
    const endTarget = new THREE.Vector3(...pose.target);
    const lens = chapterDirection[chapter].fov;
    if (!prior) {
      camera.position.copy(end);
      target.current.copy(endTarget);
      if (opening && !still)
        camera.position.add(new THREE.Vector3(0.6, 0.5, 1.0));
    }
    if (opening) end.add(new THREE.Vector3(0.25, 0.18, 0.45));
    const start = camera.position.clone(),
      startTarget = target.current.clone();
    const perspective = camera as THREE.PerspectiveCamera;
    const startFov = perspective.fov;
    const state = { p: 0 };
    const update = () => {
      camera.position.lerpVectors(start, end, state.p);
      target.current.lerpVectors(startTarget, endTarget, state.p);
      camera.lookAt(target.current);
      gsap.set(perspective, {
        fov: THREE.MathUtils.lerp(startFov, lens, state.p),
      });
      perspective.updateProjectionMatrix();
      camera.updateMatrixWorld();
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
      const root = gl.domElement.closest<HTMLElement>(".cinema");
      if (root && !portrait) {
        const anchor = new THREE.Vector3(
          ...chapterDirection[chapter].documentAnchor,
        );
        anchor.x += chapterOrder.indexOf(chapter) * 18;
        anchor.project(camera);
        const width = Math.min(540, gl.domElement.clientWidth * 0.43);
        const left = THREE.MathUtils.clamp(
          ((anchor.x + 1) * gl.domElement.clientWidth) / 2 - width / 2,
          56,
          gl.domElement.clientWidth - width - 56,
        );
        root.style.setProperty("--document-left", `${left}px`);
        gl.domElement.setAttribute(
          "data-document-anchor",
          JSON.stringify({
            x: left + width / 2,
            y: ((1 - anchor.y) * gl.domElement.clientHeight) / 2,
          }),
        );
      }
      invalidate();
    };
    let finished = false;
    const complete = () => {
      if (finished) return;
      finished = true;
      gl.domElement.setAttribute("data-camera-state", "arrived");
      animating.current = false;
      if (report) onJourney?.(false);
    };
    gl.domElement.setAttribute(
      "data-camera-state",
      moving ? "travelling" : "arrived",
    );
    if (still || (!changing && !opening)) {
      state.p = 1;
      update();
      complete();
      return;
    }
    const duration = opening
      ? portrait
        ? 1
        : 1.6
      : prior?.opening
        ? portrait
          ? 0.55
          : 0.9
        : 1.1;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let remaining = duration * 1000 + 250;
    let started = performance.now();
    const timeline = gsap.timeline({
      onComplete: () => {
        clearTimeout(deadline);
        complete();
      },
    });
    timeline.to(state, {
      p: 1,
      duration,
      ease: "sine.inOut",
      onUpdate: update,
    });
    const settle = () => {
      timeline.kill();
      state.p = 1;
      update();
      complete();
    };
    const arm = () => {
      started = performance.now();
      deadline = setTimeout(settle, Math.max(0, remaining));
    };
    arm();
    // Bounded completion also protects input when RAF/ticker stalls; hidden time is excluded.
    const pause = () => {
      if (document.hidden) {
        timeline.pause();
        clearTimeout(deadline);
        remaining = Math.max(0, remaining - (performance.now() - started));
      } else if (!finished) {
        timeline.resume();
        arm();
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      clearTimeout(deadline);
      timeline.kill();
      document.removeEventListener("visibilitychange", pause);
    };
  }, [
    chapter,
    opening,
    still,
    portrait,
    size.width,
    camera,
    gl,
    invalidate,
    onJourney,
  ]);
  return null;
}
