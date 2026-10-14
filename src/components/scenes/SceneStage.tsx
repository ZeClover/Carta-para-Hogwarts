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
}: {
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
  const config = sceneConfig[kind];
  const [active, setActive] = useState(false),
    [still, setStill] = useState(false),
    [systemReduced, setSystemReduced] = useState(false);
  const [available, setAvailable] = useState(false),
    [visible, setVisible] = useState(false),
    [ready, setReady] = useState(false),
    [simple, setSimple] = useState(false);
  const [limited, setLimited] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const failure = useCallback(() => {
    setAvailable(false);
    setReady(false);
  }, []);
  const loaded = useCallback(() => setReady(true), []);
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
            setSimple(
              constrained ||
                /SwiftShader|llvmpipe|Software Rasterizer/i.test(renderer),
            );
            context.getExtension("WEBGL_lose_context")?.loseContext();
          }
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
    if (kind === "letter") onOpen?.();
    else setActive((a) => !a);
  }, [kind, onOpen]);
  const value = immersive
    ? !!(page % 2)
    : kind === "letter"
      ? !!open
      : kind === "I"
        ? active !== !!(page % 2)
        : active;
  const render3d = available && visible && !simple;
  const reduced = still || systemReduced;
  return (
    <section
      className={`study-scene study-${kind} ${immersive ? "study-immersive" : ""} ${reduced ? "reduce-scene" : ""}`}
      aria-label={`Cena: ${config.title}`}
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
                onJourney={onJourney}
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
            aria-pressed={reduced}
            onClick={() => {
              setStill(true);
              onSkip?.();
            }}
          >
            Pular animação / reduzir movimento
          </button>
          {available && (
            <button
              type="button"
              className="text-button"
              aria-pressed={simple}
              onClick={() => setSimple((s) => !s)}
            >
              {simple ? "Ativar cenário 3D" : "Usar cenário leve"}
            </button>
          )}
        </div>
        <p className="scene-renderer-note">
          {render3d && ready ? "Cenário 3D interativo" : "Cenário leve 2.5D"} ·
          Arte original e modelos CC0
        </p>
        <p className="sr-only" aria-live="polite">
          {interacted ? config.result : ""}
        </p>
        <a
          className="scene-source-credit"
          href="https://polyhaven.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by Poly Haven
        </a>
        {kind === "final" && label && (
          <p className="personal-book-label">Livro de {label}</p>
        )}
      </div>
    </section>
  );
});
