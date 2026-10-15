import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneEntrancePlayback } from "./sceneEntrancePlayback";
/** Announce the color pass, never an unloaded placeholder or shadow-only pass. */
export function useEntranceFirstDraw(
  model: THREE.Object3D,
  playback: SceneEntrancePlayback,
  onReady?: (phase?: "assets") => void,
) {
  const { invalidate } = useThree();
  useEffect(() => {
    let mounted = true,
      announced = false;
    onReady?.("assets");
    const restore: (() => void)[] = [];
    model.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const original = node.onAfterRender;
      node.onAfterRender = (...args) => {
        original.call(node, ...args);
        if (!onReady || announced) return;
        announced = true;
        queueMicrotask(() => {
          if (mounted) {
            playback.markDrawn();
            onReady();
            invalidate();
          }
        });
      };
      restore.push(() => {
        node.onAfterRender = original;
      });
    });
    invalidate();
    return () => {
      mounted = false;
      restore.forEach((fn) => fn());
    };
  }, [model, playback, onReady, invalidate]);
}
