"use client";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import photoBox from "@/content/photo-box.json";
import type { PhotoBoxPlayback } from "./photoBoxMotion";
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
  archivePlayback,
}: {
  chapter: ChapterId;
  still: boolean;
  opening?: boolean;
  turning?: boolean;
  onJourney?: (moving: boolean) => void;
  archivePlayback?: PhotoBoxPlayback;
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
    const archiveEntrance =
      chapter === "VII" && (!prior || prior.chapter !== "VII") && !still;
    const arrivalDuration = prior && prior.chapter !== "VII" ? 1.1 : 0;
    const archiveDuration = arrivalDuration + 2.2;
    const moving = (changing || archiveEntrance) && !still;
    const report = changing || !prior || still || animating.current;
    animating.current = moving;
    if (report) onJourney?.(moving);
    const pose = chapterPose(chapter, portrait);
    const end = new THREE.Vector3(...pose.camera);
    const endTarget = new THREE.Vector3(...pose.target);
    const stageX = chapterOrder.indexOf(chapter) * 18;
    const archiveStart = new THREE.Vector3(
      ...(portrait
        ? ([stageX - 0.1, 5.6, 8.4] as const)
        : ([stageX - 1.1, 4.8, 6.5] as const)),
    );
    const archiveTarget = new THREE.Vector3(stageX, portrait ? -1.15 : 0.3, 0);
    const lens = chapterDirection[chapter].fov;
    if (!prior) {
      camera.position.copy(end);
      target.current.copy(endTarget);
      if (archiveEntrance) {
        camera.position.copy(archiveStart);
        target.current.copy(archiveTarget);
      }
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
      if (chapter === "VII") {
        let openingProgress = 1;
        if (archiveEntrance) {
          const elapsed = state.p * archiveDuration;
          if (elapsed < arrivalDuration) {
            const progress =
              -(Math.cos((Math.PI * elapsed) / arrivalDuration) - 1) / 2;
            camera.position.lerpVectors(start, archiveStart, progress);
            target.current.lerpVectors(startTarget, archiveTarget, progress);
            openingProgress = 0;
          } else {
            openingProgress = THREE.MathUtils.clamp(
              (elapsed - arrivalDuration) / 2.2,
              0,
              1,
            );
            const progress = -(Math.cos(Math.PI * openingProgress) - 1) / 2;
            camera.position.lerpVectors(archiveStart, end, progress);
            target.current.lerpVectors(archiveTarget, endTarget, progress);
          }
        }
        archivePlayback?.seek(openingProgress * photoBox.animation.openingEnd);
        gl.domElement.setAttribute(
          "data-photo-box-state",
          openingProgress < 1 ? "opening" : "open",
        );
      }
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
    if (still || (!changing && !opening && !archiveEntrance)) {
      state.p = 1;
      update();
      complete();
      return;
    }
    const duration = archiveEntrance
      ? archiveDuration
      : opening
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
    // Shader compilation must not consume the opening: show a closed, actually
    // drawn box before starting the shared clock on direct chapter entry.
    let waitingForDraw = archiveEntrance && !prior && !!archivePlayback;
    if (waitingForDraw) update();
    const timeline = gsap.timeline({
      paused: waitingForDraw,
      onComplete: () => {
        clearTimeout(deadline);
        complete();
      },
    });
    timeline.to(state, {
      p: 1,
      duration,
      ease: archiveEntrance ? "none" : "sine.inOut",
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
    const stopWaiting = waitingForDraw
      ? archivePlayback!.whenDrawn(() => {
          waitingForDraw = false;
          if (!document.hidden && !finished) {
            timeline.play();
            arm();
          }
        })
      : () => {};
    if (!waitingForDraw && !deadline && !finished) arm();
    // Bounded completion also protects input when RAF/ticker stalls; hidden time is excluded.
    const pause = () => {
      if (document.hidden) {
        timeline.pause();
        clearTimeout(deadline);
        if (waitingForDraw) return;
        remaining = Math.max(0, remaining - (performance.now() - started));
      } else if (!finished && !waitingForDraw) {
        timeline.resume();
        arm();
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      clearTimeout(deadline);
      timeline.kill();
      stopWaiting();
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
    archivePlayback,
  ]);
  return null;
}
