"use client";
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/** Object motion follows displayed frames, never time lost to a shader stall. */
export function useFrameTween(
  prepare: () => ((progress: number) => void) | undefined,
  duration: number,
  still: boolean,
) {
  const { invalidate } = useThree();
  const motion = useRef<{
    sample: (progress: number) => void;
    elapsed: number;
  } | null>(null);
  useEffect(() => {
    const sample = prepare();
    if (!sample) return;
    sample(still || duration === 0 ? 1 : 0);
    if (!still && duration > 0) motion.current = { sample, elapsed: 0 };
    const resume = () => {
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", resume);
    invalidate();
    return () => {
      motion.current = null;
      document.removeEventListener("visibilitychange", resume);
    };
  }, [prepare, duration, still, invalidate]);
  useFrame((_, delta) => {
    const current = motion.current;
    if (!current || document.hidden) return;
    current.elapsed += Math.min(Math.max(delta, 0), 0.15);
    const progress = Math.min(current.elapsed / duration, 1);
    current.sample(-(Math.cos(Math.PI * progress) - 1) / 2);
    if (progress === 1) motion.current = null;
    invalidate();
  });
}
