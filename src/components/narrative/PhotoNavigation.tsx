"use client";
import { useEffect, useState } from "react";
import { chapters } from "@/content/chapters";
import {
  PHOTO_ANCHORS_EVENT,
  type PhotoAnchor,
} from "../scenes/photoBoxMotion";

export function PhotoNavigation({
  selected,
  disabled,
  onSelect,
  overlay = false,
}: {
  selected: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  overlay?: boolean;
}) {
  const [points, setPoints] = useState<PhotoAnchor[]>([]);
  useEffect(() => {
    if (!overlay) return;
    const publish = (anchors: PhotoAnchor[]) => {
      const documentBox = document
        .querySelector(".cinema-document-layout")
        ?.getBoundingClientRect();
      setPoints(
        anchors.map((p) => ({
          ...p,
          visible:
            p.visible &&
            !(
              documentBox &&
              p.x + 22 > documentBox.left &&
              p.x - 22 < documentBox.right &&
              p.y + 22 > documentBox.top &&
              p.y - 22 < documentBox.bottom
            ),
        })),
      );
    };
    const receive = (event: Event) =>
      publish((event as CustomEvent<PhotoAnchor[]>).detail);
    window.addEventListener(PHOTO_ANCHORS_EVENT, receive);
    const saved = document
      .querySelector(".study-webgl canvas")
      ?.getAttribute("data-photo-anchors");
    const frame = requestAnimationFrame(() => {
      if (saved) publish(JSON.parse(saved));
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(PHOTO_ANCHORS_EVENT, receive);
    };
  }, [overlay]);
  return (
    <nav
      className={overlay ? "photo-hotspots" : "photo-index"}
      aria-label={overlay ? "Fotografias na cena" : "Fotografias do capítulo"}
    >
      {!overlay && <p>Escolha uma fotografia. Você decide o que ela guarda.</p>}
      <div>
        {chapters.VII.questions.map((q, i) => {
          const point = points.find((p) => p.id === q.id);
          if (overlay && (!point?.visible || disabled)) return null;
          return (
            <button
              type="button"
              key={q.id}
              disabled={disabled}
              onClick={() => onSelect(q.id)}
              aria-label={`Fotografia ${i + 1} — ${q.label}`}
              aria-current={selected === q.id ? "step" : undefined}
              title={q.label}
              data-photo-question={q.id}
              style={overlay ? { left: point!.x, top: point!.y } : undefined}
            >
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
