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
import hallway from "@/content/hallway.json";
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
  paused = false,
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
  presentationKey,
  hallwaySeenOnResume,
  replay = false,
}: {
  paused?: boolean;
  replay?: boolean;
  presentationKey?: string;
  hallwaySeenOnResume?: boolean;
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
    immersive && (kind === "II" || kind === "IV")
      ? {
          ...sceneConfig[kind],
          title:
            kind === "II" ? "O pergaminho das origens" : "O corredor vitoriano",
          caption:
            kind === "II"
              ? "Você escolhe o que contar sobre infância e família."
              : "A correspondência repousa à luz da janela. Você escolhe como narrar o chamado.",
        }
      : immersive && kind === "VII"
        ? {
            ...sceneConfig[kind],
            title: "A mesa de documentos",
            caption:
              "Cartas e fotografias por preencher, sobre a escrivaninha. Você escolhe o que guardar.",
          }
        : immersive && kind === "III"
          ? {
              ...sceneConfig[kind],
              title: "O tinteiro e a pena",
              caption:
                "A pena se move por um instante. Sua história ainda está por escrever.",
            }
          : immersive && kind === "V"
            ? {
                ...sceneConfig[kind],
                title: "O espelho ornamentado",
                caption:
                  "A moldura guarda a luz do quarto. Você decide como se descrever.",
              }
            : immersive && kind === "VI"
              ? {
                  ...sceneConfig[kind],
                  title: "A esfera armilar",
                  caption:
                    "Entre os anéis de metal e a areia, há espaço para o que você escolher contar.",
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
  const [fallbackReason, setFallbackReason] = useState<
    "unavailable" | "error" | "timeout" | null
  >(null);
  const announced = useRef(false);
  const frameKind = useRef<SceneKind | null>(null);
  const preparedFrameKind = useRef<SceneKind | null>(null);
  const [checkedKind, setCheckedKind] = useState<SceneKind | null>(null);
  const [readyKind, setReadyKind] = useState<SceneKind | null>(null);
  const [preparedKind, setPreparedKind] = useState<SceneKind | null>(null);
  const ready = readyKind === kind;
  const [limited, setLimited] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const [replayPending, setReplayPending] = useState(replay);
  const container = useRef<HTMLDivElement>(null);
  const replayRequested = useRef(replay);
  const failure = useCallback(() => {
    setFallbackReason("error");
    setTimedOut(true);
    setReadyKind(null);
  }, []);
  const loaded = useCallback(
    (phase?: "assets" | "prepared") => {
      if (phase === "assets") {
        replayRequested.current = false;
        setReplayPending(false);
      } else if (phase === "prepared") {
        preparedFrameKind.current = kind;
        setPreparedKind(kind);
      } else {
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
      setStill(
        !replayRequested.current &&
          localStorage.getItem("hogwarts-motion") === "reduced",
      );
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
          let context: WebGL2RenderingContext | null = null;
          try {
            context = probe.getContext("webgl2", {
              failIfMajorPerformanceCaveat: true,
            });
          } catch {
            // Browser policies and unavailable drivers can reject the probe.
          }
          if (context) {
            setAvailable(true);
            let renderer = "";
            try {
              const debug = context.getExtension("WEBGL_debug_renderer_info");
              if (debug)
                renderer = String(
                  context.getParameter(debug.UNMASKED_RENDERER_WEBGL),
                );
            } catch {
              // Renderer identification is optional under privacy policies.
            }
            if (/SwiftShader|llvmpipe|Software Rasterizer/i.test(renderer))
              setLimited(true);
            let saved: string | null = null;
            try {
              saved = localStorage.getItem("hogwarts-scene");
            } catch {}
            setSimple(
              !replayRequested.current &&
                (saved === "light" ||
                  (saved !== "3d" &&
                    (constrained ||
                      /SwiftShader|llvmpipe|Software Rasterizer/i.test(
                        renderer,
                      )))),
            );
            try {
              context.getExtension("WEBGL_lose_context")?.loseContext();
            } catch {}
          } else setFallbackReason("unavailable");
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
    const path =
      kind === "IV" && window.matchMedia("(max-width:700px)").matches
        ? hallway.mobile.path
        : chapterScenes[kind]?.criticalAssets[0];
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
    if (
      (ready && (!immersive || preparedKind === kind)) ||
      (probed && (!available || simple || timedOut))
    ) {
      announce();
    }
  }, [
    ready,
    immersive,
    preparedKind,
    kind,
    probed,
    available,
    simple,
    timedOut,
    visible,
    onPresentationReady,
  ]);
  useEffect(() => {
    if (!visible || !probed || !available || simple || timedOut) return;
    const fallback = () => {
      setFallbackReason("timeout");
      setTimedOut(true);
    };
    // One deadline per attempt, not a fresh deadline at every loading phase.
    // Assets being decoded does not prove that the browser rendered a frame.
    let recovery: ReturnType<typeof setTimeout> | undefined;
    const limit = setTimeout(
      () => {
        if (frameKind.current === kind && preparedFrameKind.current === kind)
          return;
        if (immersive && frameKind.current === kind) {
          // Lower the render cost and give the visible scene a bounded grace
          // period. Do not silently skip the animation the player requested.
          setLimited(true);
          recovery = setTimeout(() => {
            if (preparedFrameKind.current !== kind) fallback();
          }, 5000);
          return;
        }
        fallback();
      },
      immersive ? 30000 : manualSelection ? 12000 : 8000,
    );
    return () => {
      clearTimeout(limit);
      clearTimeout(recovery);
    };
  }, [
    visible,
    probed,
    available,
    simple,
    manualSelection,
    kind,
    immersive,
    timedOut,
  ]);
  useEffect(() => {
    if (render3d) return;
    container.current
      ?.closest<HTMLElement>(".cinema")
      ?.style.removeProperty("--document-left");
    onJourney?.(false);
  }, [kind, render3d, onJourney]);
  const reduced = still || systemReduced;
  const support = fallbackReason
    ? {
        title:
          fallbackReason === "unavailable"
            ? "3D indisponível neste navegador"
            : "Não foi possível iniciar o 3D",
        text:
          fallbackReason === "unavailable"
            ? "O navegador não disponibilizou WebGL 2. Confira a aceleração gráfica nas configurações de sistema do navegador e reinicie-o. Você pode continuar no cenário leve sem perder respostas."
            : "O carregamento ou a preparação gráfica não terminou. O cenário leve foi ativado e suas respostas continuam salvas. Use Ativar cenário 3D para tentar novamente. Se persistir, confira a aceleração gráfica e teste outro navegador atualizado.",
      }
    : systemReduced
      ? {
          title: "Movimento reduzido ativo no sistema",
          text: "A preferência de acessibilidade do sistema ou do navegador apresenta as entradas sem movimento, inclusive ao usar Ver animação. Para assistir, desative essa preferência nas configurações do seu dispositivo.",
        }
      : simple
        ? {
            title: "Cenário leve ativo",
            text: "Este modo usa uma imagem estática. Para assistir à entrada 3D, use Ver animação ou Ativar cenário 3D. Em aparelhos limitados, o modo leve pode ser escolhido automaticamente.",
          }
        : still
          ? {
              title: "Animações reduzidas",
              text: "O movimento foi reduzido nos controles do cenário. Use Ver animação para repetir a entrada, respeitando a preferência de acessibilidade do sistema.",
            }
          : null;
  useEffect(() => {
    // Cold scenes suspend their 3D subtree. Gate while loading,
    // before the camera director can commit and announce the entrance.
    if (immersive && render3d && readyKind !== kind) onJourney?.(true);
  }, [immersive, kind, render3d, readyKind, onJourney]);
  return (
    <section
      className={`study-scene study-${kind} ${immersive ? "study-immersive" : ""} ${reduced ? "reduce-scene" : ""}`}
      inert={paused || undefined}
      aria-label={`Cena: ${config.title}`}
      data-essential-assets-ready={ready || !render3d ? "true" : "false"}
      data-first-frame-ready={ready || (!render3d && probed) ? "true" : "false"}
      data-scene={kind}
      data-renderer={render3d && ready ? "3d" : "2.5d"}
      data-playback={paused ? "waiting" : "running"}
      data-motion={reduced ? "reduced" : "cinematic"}
      data-fallback-reason={fallbackReason ?? "none"}
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
                paused={paused}
                replay={replayPending}
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
                presentationKey={presentationKey}
                hallwaySeenOnResume={hallwaySeenOnResume}
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
        {support && (
          <details className="scene-support">
            <summary>
              <span role="status">{support.title}</span>
            </summary>
            <p>{support.text}</p>
          </details>
        )}
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
                preparedFrameKind.current = null;
                setReadyKind(null);
                setPreparedKind(null);
                setCheckedKind(null);
                setManualSelection(true);
                setTimedOut(false);
                setFallbackReason(null);
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
        {immersive && kind !== "IV" && (
          <span className="sr-only">
            Arquitetura: Victorian Hallway fornecido ao projeto, com
            enquadramento próprio por capítulo.
          </span>
        )}
        <p className="scene-renderer-note">
          {render3d && ready ? "Cenário 3D interativo" : "Cenário leve 2.5D"} ·
          {immersive && kind === "VII"
            ? "Mesa: Faheem Yusuf · CC BY 4.0 · Caixa fornecida"
            : immersive && kind === "III"
              ? "Tinteiro com pena · Matthew Collings · CC BY 4.0"
              : immersive && kind === "V"
                ? "Ornate Mirror · Arnold Konrad · Sketchfab Standard"
                : immersive && kind === "VI"
                  ? "Esfera: Stellarator · Ampulheta: Inknot · CC BY 4.0"
                  : immersive && (kind === "II" || kind === "IV")
                    ? "Modelo fornecido ao projeto"
                    : "Arte original e modelos CC0"}
        </p>
        <p className="sr-only" aria-live="polite">
          {interacted ? config.result : ""}
        </p>
        {immersive && (kind === "II" || kind === "IV") ? (
          <span className="scene-source-credit">
            {kind === "II" ? "Pergaminho" : "Victorian Hallway"} — modelo
            fornecido ao projeto
          </span>
        ) : immersive && kind === "VII" ? (
          <span className="scene-source-credit">
            <a
              href="https://sketchfab.com/3d-models/victorian-desk-ac061b3de2b9480d8ca175e9fdc0c785"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mesa — Faheem Yusuf · CC BY 4.0
            </a>{" "}
            · Caixa fornecida ao projeto
          </span>
        ) : immersive && kind === "III" ? (
          <a
            className="scene-source-credit"
            href="https://sketchfab.com/3d-models/ink-bottle-with-quill-ef967c9bc13b4635add8ab7517dfedfe"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ink Bottle with Quill — Matthew Collings · CC BY 4.0
          </a>
        ) : immersive && kind === "V" ? (
          <a
            className="scene-source-credit"
            href="https://sketchfab.com/3d-models/ornate-mirror-68a8a9f27f6f4fb3b9d568bbb5db1086"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ornate Mirror — Arnold Konrad · Sketchfab Standard
          </a>
        ) : immersive && kind === "VI" ? (
          <span className="scene-source-credit">
            <a
              href="https://sketchfab.com/3d-models/armillary-sphere-astrolabe-d9c7e19aeef940fcac65efc964534a9c"
              target="_blank"
              rel="noopener noreferrer"
            >
              Esfera — Stellarator
            </a>{" "}
            ·{" "}
            <a
              href="https://sketchfab.com/3d-models/hourglass-6cdbe313e61a48c584a1a77b0925aac6"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ampulheta — Inknot
            </a>{" "}
            · CC BY 4.0
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
