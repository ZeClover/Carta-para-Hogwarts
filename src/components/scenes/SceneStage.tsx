"use client";
import dynamic from "next/dynamic";
import {
  Component,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChapterFallback } from "./ChapterFallback";
import { chapterOrder } from "./chapterDirection";
import { chapterScenes } from "./chapterScenes";
import type { ChapterId } from "@/content/chapters";
import { SceneFallback } from "./SceneFallback";
import { sceneConfig, type SceneKind } from "./config";
const StudyCanvas = dynamic(() => import("./StudyCanvas"), { ssr: false });
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export const SceneStage = memo(function SceneStage({
  kind,
  open,
  onOpen,
  label,
  page = 0,
  onSkip,
  immersive = false,
  writtenText,
  turnDirection = 1,
  turning,
  onJourney,
  opening = false,
  onPresentationReady,
  onDocumentAction,
  onPhotoSelect,
  selectedPhoto,
}: {
  onPhotoSelect?: (id: string) => void;
  selectedPhoto?: string;
  onDocumentAction?: () => void;
  opening?: boolean;
  onPresentationReady?: (ready: boolean) => void;
  onJourney?: (moving: boolean) => void;
  turnDirection?: number;
  turning?: boolean;
  immersive?: boolean;
  writtenText?: string;
  kind: SceneKind;
  open?: boolean;
  onOpen?: () => void;
  label?: string;
  page?: number;
  onSkip?: () => void;
}) {
  const config =
    immersive && kind === "VII"
      ? {
          ...sceneConfig[kind],
          title: "A caixa de fotografias",
          caption: "Fotografias por preencher. Você escolhe o que guardar.",
        }
      : sceneConfig[kind];
  const [active, setActive] = useState(false),
    [still, setStill] = useState(false),
    [systemReduced, setSystemReduced] = useState(false);
  const [available, setAvailable] = useState(false),
    [visible, setVisible] = useState(false),
    [simple, setSimple] = useState(false);
  const [probed, setProbed] = useState(false);
  const [manualSelection, setManualSelection] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const announced = useRef(false);
  const resourceKind = useRef<SceneKind | null>(null);
  const frameKind = useRef<SceneKind | null>(null);
  const [slowChapter, setSlowChapter] = useState<SceneKind | null>(null);
  const [checkedKind, setCheckedKind] = useState<SceneKind | null>(null);
  const [readyKind, setReadyKind] = useState<SceneKind | null>(null);
  const ready = readyKind === kind;
  const [limited, setLimited] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const failure = useCallback(() => {
    setAvailable(false);
    setReadyKind(null);
  }, []);
  const loaded = useCallback(
    (phase?: "assets") => {
      if (phase === "assets") resourceKind.current = kind;
      else {
        frameKind.current = kind;
        setReadyKind(kind);
      }
    },
    [kind],
  );
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(reduced.matches);
    reduced.addEventListener("change", update);
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const constrained =
      (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      navigator.hardwareConcurrency <= 4 ||
      !!device.connection?.saveData;
    setLimited(constrained);
    try {
      setStill(localStorage.getItem("hogwarts-motion") === "reduced");
    } catch {}
    let probed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.some((e) => e.isIntersecting);
        setVisible(entering);
        update();
        if (entering && !probed) {
          probed = true;
          const probe = document.createElement("canvas");
          const context = probe.getContext("webgl2", {
            failIfMajorPerformanceCaveat: true,
          });
          if (context) {
            setAvailable(true);
            const debug = context.getExtension("WEBGL_debug_renderer_info");
            const renderer = debug
              ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL))
              : "";
            if (/SwiftShader|llvmpipe|Software Rasterizer/i.test(renderer))
              setLimited(true);
            let saved: string | null = null;
            try {
              saved = localStorage.getItem("hogwarts-scene");
            } catch {}
            setSimple(
              saved === "light" ||
                (saved !== "3d" &&
                  (constrained ||
                    /SwiftShader|llvmpipe|Software Rasterizer/i.test(
                      renderer,
                    ))),
            );
            context.getExtension("WEBGL_lose_context")?.loseContext();
          }
          setProbed(true);
        }
      },
      { rootMargin: "120px" },
    );
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", update);
    };
  }, []);
  const action = useCallback(() => {
    setInteracted(true);
    if (immersive && kind === "VII" && onDocumentAction) {
      onDocumentAction();
      return;
    }
    if (kind === "letter") onOpen?.();
    else setActive((a) => !a);
  }, [kind, onOpen, immersive, onDocumentAction]);
  const value = immersive
    ? !!(page % 2)
    : kind === "letter"
      ? !!open
      : kind === "I"
        ? active !== !!(page % 2)
        : active;
  const wants3d = available && visible && !simple && !timedOut;
  const render3d =
    wants3d &&
    (!immersive ||
      !chapterOrder.includes(kind as ChapterId) ||
      readyKind !== null ||
      checkedKind === kind);
  useEffect(() => {
    if (!wants3d || render3d) return;
    const controller = new AbortController();
    // Missing initial heroes should fail before allocating a renderer and compiling its lighting.
    const path = chapterScenes[kind]?.criticalAssets[0];
    if (!path) return;
    void fetch(path, { method: "HEAD", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Critical scene asset unavailable");
        if (!controller.signal.aborted) setCheckedKind(kind);
      })
      .catch(() => {
        if (!controller.signal.aborted) failure();
      });
    return () => controller.abort();
  }, [wants3d, render3d, kind, failure]);
  useEffect(() => {
    if (!visible) return;
    const announce = () => {
      if (!announced.current) {
        announced.current = true;
        onPresentationReady?.(true);
      }
    };
    if (ready || (probed && (!available || simple))) {
      const frame = requestAnimationFrame(announce);
      return () => cancelAnimationFrame(frame);
    }
    const limit = setTimeout(
      () => {
        // Frame callbacks precede React's commit: never tear down a frame already drawn.
        if (frameKind.current === kind) {
          announce();
          return;
        }
        if (immersive && readyKind !== null && resourceKind.current === kind) {
          // A live chapter has loaded its hero but a slow GPU is still crossing the cut.
          // Settle the camera immediately, keeping this renderer and the owned resources.
          setSlowChapter(kind);
          setLimited(true);
          return;
        }
        setTimedOut(true);
        announce();
      },
      manualSelection ? 12000 : 4000,
    );
    return () => clearTimeout(limit);
  }, [
    ready,
    visible,
    probed,
    available,
    simple,
    manualSelection,
    onPresentationReady,
    kind,
    immersive,
    readyKind,
  ]);
  useEffect(() => {
    if (render3d) return;
    container.current
      ?.closest<HTMLElement>(".cinema")
      ?.style.removeProperty("--document-left");
    const frame = requestAnimationFrame(() => onJourney?.(false));
    return () => cancelAnimationFrame(frame);
  }, [kind, render3d, onJourney]);
  const reduced = still || systemReduced || slowChapter === kind;
  return (
    <section
      className={`study-scene study-${kind} ${immersive ? "study-immersive" : ""} ${reduced ? "reduce-scene" : ""}`}
      aria-label={`Cena: ${config.title}`}
      data-essential-assets-ready={ready || !render3d ? "true" : "false"}
      data-first-frame-ready={ready || (!render3d && probed) ? "true" : "false"}
      data-scene={kind}
      data-renderer={render3d && ready ? "3d" : "2.5d"}
      data-motion={reduced ? "reduced" : "cinematic"}
      data-active={value ? "true" : "false"}
    >
      <div className="study-viewport" ref={container}>
        {immersive && chapterOrder.includes(kind as ChapterId) ? (
          <ChapterFallback
            chapter={kind as ChapterId}
            turnDirection={turnDirection}
            turning={turning}
            still={reduced}
          />
        ) : (
          <SceneFallback
            kind={kind}
            active={value}
            still={reduced}
            immersive={immersive}
            writtenText={writtenText}
            turning={turning}
            turnSerial={page}
            turnDirection={turnDirection}
          />
        )}
        {render3d && (
          <div
            className={`study-webgl ${ready ? "ready" : ""}`}
            aria-hidden="true"
          >
            <SceneBoundary onFailure={failure}>
              <StudyCanvas
                kind={kind}
                active={value}
                still={reduced}
                onAction={action}
                onFailure={failure}
                onReady={loaded}
                label={label}
                immersive={immersive}
                writtenText={writtenText}
                turnSerial={page}
                turnDirection={turnDirection}
                turning={turning}
                limited={limited}
                opening={opening}
                open={open}
                onJourney={onJourney}
                onPhotoSelect={onPhotoSelect}
                selectedPhoto={selectedPhoto}
              />
            </SceneBoundary>
          </div>
        )}
        <div className="study-vignette" aria-hidden="true" />
        <span className="study-scene-title" aria-hidden="true">
          {config.title}
        </span>
      </div>
      <div className="study-controls">
        <p className="study-caption">{config.caption}</p>
        <div className="study-buttons">
          {!immersive && (kind !== "letter" || !open) && (
            <button
              type="button"
              className="button scene-action"
              onClick={action}
              aria-pressed={kind === "letter" ? undefined : value}
            >
              {config.action}
            </button>
          )}
          <button
            type="button"
            className="text-button scene-skip"
            onClick={() => {
              setStill(true);
              onSkip?.();
            }}
          >
            Pular animações
          </button>
          <button
            type="button"
            className="text-button"
            aria-pressed={still}
            onClick={() => {
              const next = !still;
              setStill(next);
              try {
                localStorage.setItem(
                  "hogwarts-motion",
                  next ? "reduced" : "cinematic",
                );
              } catch {}
            }}
          >
            Reduzir movimento
          </button>
          {available && (
            <button
              type="button"
              className="text-button"
              aria-pressed={simple || timedOut}
              onClick={() => {
                const light = simple || timedOut;
                frameKind.current = null;
                resourceKind.current = null;
                setReadyKind(null);
                setCheckedKind(null);
                setSlowChapter(null);
                setManualSelection(true);
                setTimedOut(false);
                setSimple(!light);
                try {
                  localStorage.setItem(
                    "hogwarts-scene",
                    light ? "3d" : "light",
                  );
                } catch {}
              }}
            >
              {simple || timedOut ? "Ativar cenário 3D" : "Usar cenário leve"}
            </button>
          )}
        </div>
        <p className="scene-renderer-note">
          {render3d && ready ? "Cenário 3D interativo" : "Cenário leve 2.5D"} ·
          {immersive && kind === "VII"
            ? "Caixa de fotografias · modelo fornecido"
            : "Arte original e modelos CC0"}
        </p>
        <p className="sr-only" aria-live="polite">
          {interacted ? config.result : ""}
        </p>
        {immersive && kind === "VII" ? (
          <span className="scene-source-credit">
            Modelo fornecido ao projeto
          </span>
        ) : (
          <a
            className="scene-source-credit"
            href="https://polyhaven.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by Poly Haven
          </a>
        )}
        {kind === "final" && label && (
          <p className="personal-book-label">Livro de {label}</p>
        )}
      </div>
    </section>
  );
});
