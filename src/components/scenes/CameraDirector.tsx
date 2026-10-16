"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import inkQuill from "@/content/ink-quill.json";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
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
  paused = false,
  chapter,
  still,
  opening = false,
  onJourney,
  archivePlayback,
  deskPlayback,
  objectPlayback,
  hallwayPlayback,
  presentationKey,
  hallwaySeenOnResume,
  presentation,
  onPrepared,
  replay = false,
}: {
  paused?: boolean;
  replay?: boolean;
  presentation?: SceneEntrancePlayback;
  onPrepared?: () => void;
  hallwayPlayback?: SceneEntrancePlayback;
  presentationKey?: string;
  hallwaySeenOnResume?: boolean;
  chapter: ChapterId;
  still: boolean;
  opening?: boolean;
  turning?: boolean;
  onJourney?: (moving: boolean) => void;
  archivePlayback?: PhotoBoxPlayback;
  deskPlayback?: SceneEntrancePlayback;
  objectPlayback?: SceneEntrancePlayback;
}) {
  const { camera, size, gl, invalidate } = useThree();
  const previous = useRef<{ chapter: ChapterId; opening: boolean } | null>(
    null,
  );
  const target = useRef(new THREE.Vector3());
  const animating = useRef(false);
  const advanceFrame = useRef<((delta: number) => void) | null>(null);
  useFrame((_, delta) => advanceFrame.current?.(delta));
  const portrait = size.width <= 700;
  useEffect(() => {
    const prior = previous.current;
    if (!paused) previous.current = { chapter, opening };
    const changing =
      !!prior && (prior.chapter !== chapter || prior.opening !== opening);
    const archiveEntrance =
      chapter === "VII" && (!prior || prior.chapter !== "VII") && !still;
    const objectEntrance =
      ["II", "III", "V", "VI"].includes(chapter) &&
      (!prior || prior.chapter !== chapter) &&
      !still;
    const hallwayKey = presentationKey
      ? `hogwarts-hallway-entry:${presentationKey}`
      : null;
    const manualReplay = replay && !prior;
    let hallwaySeen = !manualReplay && Boolean(hallwaySeenOnResume);
    try {
      hallwaySeen ||=
        !manualReplay &&
        Boolean(hallwayKey && localStorage.getItem(hallwayKey) === "seen");
    } catch {}
    const hallwayEntrance =
      chapter === "IV" &&
      (!prior || prior.chapter !== "IV") &&
      !still &&
      !hallwaySeen;
    const entrance = archiveEntrance || objectEntrance || hallwayEntrance;
    // The archive entrance also starts in its own bay so its original lid clip
    // cannot be consumed while the new model compiles out of view.
    const archiveDuration = 2.2;
    const moving = (changing || entrance || opening) && !still;
    const report = changing || !prior || still || animating.current;
    animating.current = moving;
    if (report) onJourney?.(paused ? false : moving);
    const pose = chapterPose(chapter, portrait);
    const end = new THREE.Vector3(...pose.camera);
    const endTarget = new THREE.Vector3(...pose.target);
    const stageX = chapterOrder.indexOf(chapter) * 18;
    const hallwayStart = new THREE.Vector3(
      stageX + (portrait ? -1.85 : -1.1),
      1.75,
      portrait ? 0.4 : -0.35,
    );
    const hallwayTarget = new THREE.Vector3(stageX - 3.57, 1.8, 0.57);
    // First IV entry starts at its window. Waiting while looking at the prior
    // bay would keep the new room culled and prevent its first-draw callback.
    const hallwayDuration = 3.6;
    const archiveStart = new THREE.Vector3(
      ...(portrait
        ? ([stageX - 0.1, 5.3, 12.2] as const)
        : ([stageX - 1.3, 5.8, 10.5] as const)),
    );
    const archiveTarget = new THREE.Vector3(stageX, portrait ? -1.1 : 0.75, 0);
    const objectStart = end
      .clone()
      .add(new THREE.Vector3(portrait ? 0 : -0.25, 0.35, 1.1));
    const objectTarget = endTarget.clone();
    const gestureDuration =
      chapter === "II" || chapter === "V"
        ? 1.6
        : chapter === "VI"
          ? 2.1
          : inkQuill.animation.duration;
    const objectDuration = gestureDuration;
    const lens = chapterDirection[chapter].fov;
    if (!prior || entrance) {
      camera.position.copy(end);
      target.current.copy(endTarget);
      if (archiveEntrance) {
        camera.position.copy(archiveStart);
        target.current.copy(archiveTarget);
      }
      if (objectEntrance) {
        camera.position.copy(objectStart);
        target.current.copy(objectTarget);
      }
      if (hallwayEntrance) {
        camera.position.copy(hallwayStart);
        target.current.copy(hallwayTarget);
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
      if (chapter === "IV") {
        let progress = 1;
        if (hallwayEntrance) {
          progress = state.p;
          const u = THREE.MathUtils.clamp((progress - 0.42) / 0.58, 0, 1),
            p = -(Math.cos(Math.PI * u) - 1) / 2;
          camera.position.lerpVectors(hallwayStart, end, p);
          target.current.lerpVectors(hallwayTarget, endTarget, p);
        }
        hallwayPlayback?.seek(progress * 3.6);
        gl.domElement.setAttribute(
          "data-hallway-state",
          progress < 1 ? "delivering" : hallwaySeen ? "resumed" : "settled",
        );
        gl.domElement.setAttribute(
          "data-hallway-resumed",
          hallwaySeen ? "true" : "false",
        );
      }
      if (chapter === "VII") {
        let openingProgress = 1;
        if (archiveEntrance) {
          openingProgress = state.p;
          const progress = -(Math.cos(Math.PI * openingProgress) - 1) / 2;
          camera.position.lerpVectors(archiveStart, end, progress);
          target.current.lerpVectors(archiveTarget, endTarget, progress);
        }
        archivePlayback?.seek(openingProgress * photoBox.animation.openingEnd);
        deskPlayback?.seek(openingProgress * 2.2);
        gl.domElement.setAttribute(
          "data-photo-box-state",
          openingProgress < 1 ? "opening" : "open",
        );
      }
      if (["II", "III", "V", "VI"].includes(chapter)) {
        let manifestation = 1;
        if (objectEntrance) {
          manifestation = state.p;
          const p = -(Math.cos(Math.PI * manifestation) - 1) / 2;
          camera.position.lerpVectors(objectStart, end, p);
          target.current.lerpVectors(objectTarget, endTarget, p);
        }
        objectPlayback?.seek(manifestation * gestureDuration);
        gl.domElement.setAttribute(
          chapter === "II"
            ? "data-scroll-state"
            : chapter === "III"
              ? "data-ink-state"
              : chapter === "V"
                ? "data-mirror-state"
                : "data-armillary-state",
          manifestation < 1 ? "manifesting" : "settled",
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
      advanceFrame.current = null;
      onPrepared?.();
      gl.domElement.setAttribute("data-entrance-phase", "complete");
      gl.domElement.setAttribute("data-camera-state", "arrived");
      animating.current = false;
      if (chapter === "IV" && hallwayKey) {
        try {
          localStorage.setItem(hallwayKey, "seen");
        } catch {}
      }
      if (report) onJourney?.(false);
    };
    gl.domElement.setAttribute(
      "data-camera-state",
      moving ? "travelling" : "arrived",
    );
    if (paused) {
      update();
      gl.domElement.setAttribute("data-entrance-phase", "waiting");
      gl.domElement.setAttribute("data-camera-state", "waiting");
      const prepared = () => {
        onPrepared?.();
        gl.domElement.setAttribute("data-entrance-phase", "ready");
      };
      // Compile/draw the initial pose, but do not consume the entrance or its
      // seen marker while the invitation is waiting for the player's click.
      const disconnect = presentation?.whenDrawn(prepared);
      if (!presentation) prepared();
      return () => disconnect?.();
    }
    if (still || (!changing && !opening && !entrance)) {
      state.p = 1;
      update();
      complete();
      return;
    }
    const duration = hallwayEntrance
      ? hallwayDuration
      : archiveEntrance
        ? archiveDuration
        : objectEntrance
          ? objectDuration
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
    // Leave shader-stall recovery time on first entry; skipping is always
    // available and this upper bound still releases controls if RAF stops.
    let remaining =
      entrance || opening
        ? Math.max(15000, duration * 5000)
        : duration * 1000 + 250;
    let started = performance.now();
    // Shader compilation must not consume the entrance: draw the object in its
    // initial pose before starting the shared clock on direct chapter entry.
    const frameDriven = (entrance || opening) && !!presentation;
    let waitingForDraw = frameDriven;
    gl.domElement.setAttribute(
      "data-entrance-phase",
      waitingForDraw ? "waiting" : "playing",
    );
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
      ease: entrance ? "none" : "sine.inOut",
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
    let clockStarted = false;
    const stopWaiting = waitingForDraw
      ? presentation!.whenDrawn(() => {
          waitingForDraw = false;
          let settling = 0,
            elapsed = 0;
          gl.domElement.setAttribute("data-entrance-phase", "settling");
          // Give the visible scene a short rest after its first complete draw.
          // Advance only on rendered frames: shader/upload stalls must never
          // consume an entrance, even when GSAP's wall clock keeps running.
          advanceFrame.current = (delta) => {
            if (document.hidden || finished) return;
            const step = Math.min(Math.max(delta, 0), 0.1);
            if (settling < 0.8) {
              settling += step;
            } else {
              if (!clockStarted) {
                clockStarted = true;
                onPrepared?.();
                gl.domElement.setAttribute("data-entrance-phase", "playing");
                if (hallwayEntrance && hallwayKey) {
                  try {
                    localStorage.setItem(hallwayKey, "seen");
                  } catch {}
                }
                arm();
              }
              elapsed = Math.min(duration, elapsed + step);
              timeline.totalTime(elapsed, false);
            }
            invalidate();
          };
          invalidate();
        })
      : () => {};
    if (!frameDriven && !finished) {
      clockStarted = true;
      arm();
    }
    // Bounded completion also protects input when RAF/ticker stalls; hidden time is excluded.
    const pause = () => {
      if (document.hidden) {
        timeline.pause();
        clearTimeout(deadline);
        if (!clockStarted) return;
        remaining = Math.max(0, remaining - (performance.now() - started));
      } else if (!finished && !waitingForDraw) {
        if (!frameDriven) timeline.resume();
        if (clockStarted) arm();
        invalidate();
      }
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      advanceFrame.current = null;
      clearTimeout(deadline);
      timeline.kill();
      stopWaiting();
      document.removeEventListener("visibilitychange", pause);
    };
  }, [
    paused,
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
    deskPlayback,
    objectPlayback,
    hallwayPlayback,
    presentationKey,
    hallwaySeenOnResume,
    presentation,
    onPrepared,
    replay,
  ]);
  return null;
}
