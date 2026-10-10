"use client";
import { useState } from "react";
import { chapters, type ChapterId } from "@/content/chapters";
export function SceneBanner({ chapter }: { chapter: ChapterId }) {
  const c = chapters[chapter];
  const [still, setStill] = useState(false);
  return (
    <section
      className={`scene-banner scene-${c.scene} ${still ? "no-motion" : ""}`}
      aria-label={`Cena: ${c.title}`}
    >
      <div className="scene-art" aria-hidden="true">
        <span className="scene-object">{c.symbol}</span>
        <span className="scene-spark one">✦</span>
        <span className="scene-spark two">✧</span>
        <span className="scene-spark three">·</span>
      </div>
      <p>{c.transition}</p>
      <button
        className="motion-button"
        aria-pressed={still}
        onClick={() => setStill(true)}
      >
        Pular animação / reduzir movimento
      </button>
    </section>
  );
}
