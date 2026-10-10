"use client";
import type { ChapterId } from "@/content/chapters";
import { SceneStage } from "../scenes/SceneStage";
export function SceneBanner({ chapter }: { chapter: ChapterId }) {
  return <SceneStage key={chapter} kind={chapter} />;
}
