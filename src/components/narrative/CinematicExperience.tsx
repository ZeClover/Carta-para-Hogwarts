"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { chapters, chapterIds, type ChapterId } from "@/content/chapters";
import { questions } from "@/content/admission";
import { families } from "@/content/families";
import { validateAdmission } from "@/lib/draft";
import type { Story, Hook, Relation, StoryObject } from "@/lib/story";
import { BirthGuidance } from "../BirthGuidance";
import { SceneStage } from "../scenes/SceneStage";
import { usePlayer } from "./PlayerProvider";
import { QuestionField } from "./QuestionField";
import { FamilySelector } from "./FamilySelector";
import { HookEditor, HookCard } from "./HookEditor";
import { PlayerStatus, PlayerTools } from "./PlayerTools";

export const experienceSteps = chapterIds.flatMap((chapter) => [
  ...(chapter === "I"
    ? questions.map((q) => ({ id: q.id, chapter }))
    : chapter === "II"
      ? [{ id: "II00", chapter }]
      : []),
  ...chapters[chapter].questions.map((q) => ({ id: q.id, chapter })),
  { id: `${chapter}-review`, chapter },
]);

export function CinematicExperience({ chapter }: { chapter?: ChapterId }) {
  const { player } = usePlayer();
  if (!player)
    return (
      <main className="cinema" id="conteudo">
        <p role="status">Recuperando seu registro mágico…</p>
      </main>
    );
  return (
    <Experience
      key={player.draft.id}
      initial={
        chapter
          ? experienceSteps.find((s) => s.chapter === chapter)?.id
          : (player.story.experienceStep ??
            experienceSteps.find(
              (s) =>
                s.chapter ===
                chapterIds.find(
                  (id) => !player.story.chaptersReviewed.includes(id),
                ),
            )?.id ??
            "VII-review")
      }
    />
  );
}
function Experience({ initial }: { initial?: string }) {
  const { player, change, saveNow, storageError } = usePlayer();
  const router = useRouter();
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      experienceSteps.findIndex((s) => s.id === initial),
    ),
  );
  const [phase, setPhase] = useState("idle");
  const [travelling, setTravelling] = useState(false);
  const [page, setPage] = useState(0);
  const [turnDirection, setTurnDirection] = useState(1);
  const [ink, setInk] = useState("");
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [skip, setSkip] = useState(false);
  const [opening, setOpening] = useState<{
    source: string;
    hook?: Hook;
  } | null>(null);
  const root = useRef<HTMLElement>(null),
    heading = useRef<HTMLDivElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const operation = useRef(0);
  const skipRequested = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  useEffect(() => {
    // A chapter link selects the entry point once; reload must use the saved cursor.
    if (new URL(window.location.href).searchParams.has("capitulo"))
      window.history.replaceState(window.history.state, "", "/experiencia");
    const viewport = window.visualViewport;
    const update = () => {
      root.current?.style.setProperty(
        "--cinema-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      root.current?.style.setProperty(
        "--cinema-top",
        `${viewport?.offsetTop ?? 0}px`,
      );
    };
    update();
    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      operation.current += 1;
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (menu) dialog.current?.showModal();
    else dialog.current?.close();
  }, [menu]);
  useEffect(() => {
    change((p) => ({
      ...p,
      story: { ...p.story, experienceStep: experienceSteps[index].id },
    }));
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollTo(0, 0);
  }, [index, change]);
  if (!player) return null;
  const { story, draft } = player;
  const step = experienceSteps[index],
    chapter = step.chapter,
    c = chapters[chapter];
  const admission = questions.find((q) => q.id === step.id);
  const original = c.questions.find((q) => q.id === step.id);
  const question =
    original?.id === "IV01" && story.answers.III01?.value === "nao"
      ? {
          ...original,
          help: "Se você não conhecia o mundo mágico, quem explicou a notícia? Um representante da escola, familiar ou outra pessoa? Você escolhe a forma da chegada.",
        }
      : original;
  const review = step.id.endsWith("-review");
  function editStory(edit: (s: Story) => Story) {
    change((p) => ({
      ...p,
      story: {
        ...edit(p.story),
        updatedAt: new Date().toISOString(),
        chaptersReviewed: p.story.chaptersReviewed.filter((v) => v !== chapter),
      },
    }));
  }
  function saveRelation(r: Relation) {
    setError("");
    const existing = story.relationships.find(
      (v) =>
        v.id !== r.id &&
        v.name.trim().toLocaleLowerCase("pt-BR") ===
          r.name.trim().toLocaleLowerCase("pt-BR"),
    );
    if (existing) return existing.id;
    editStory((s) => ({
      ...s,
      relationships: s.relationships.some((v) => v.id === r.id)
        ? s.relationships.map((v) => (v.id === r.id ? r : v))
        : [...s.relationships, r],
    }));
    return r.id;
  }
  function saveObject(o: StoryObject) {
    setError("");
    const existing = story.objects.find(
      (v) =>
        v.id !== o.id &&
        v.name.toLocaleLowerCase("pt-BR") === o.name.toLocaleLowerCase("pt-BR"),
    );
    if (existing) return existing.id;
    editStory((s) => ({
      ...s,
      objects: s.objects.some((v) => v.id === o.id)
        ? s.objects.map((v) => (v.id === o.id ? o : v))
        : [...s.objects, o],
    }));
    return o.id;
  }
  function finishAnimation() {
    if (timer.current) clearTimeout(timer.current);
    pending.current?.();
    pending.current = null;
    setPhase("idle");
    busy.current = false;
  }
  function skipAnimations() {
    skipRequested.current = true;
    setSkip(true);
    if (pending.current) finishAnimation();
  }
  function editingOpen() {
    const editor = heading.current?.querySelector(
      ".entity-editor, .hook-editor",
    );
    if (!editor) return false;
    setError("Salve ou cancele a edição em aberto antes de continuar ou sair.");
    setMenu(false);
    editor.querySelector<HTMLElement>(".button:not(.secondary)")?.focus();
    return true;
  }
  function cancelTransition() {
    operation.current += 1;
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    busy.current = false;
    setPhase("idle");
    return operation.current;
  }
  async function leave(path: string) {
    if (editingOpen()) return;
    const token = cancelTransition();
    setPhase("saving");
    busy.current = true;
    const saved = await saveNow();
    if (token !== operation.current) return;
    if (saved) router.push(path);
    else {
      setPhase("idle");
      busy.current = false;
      setError("Preserve um backup antes de sair.");
      setMenu(true);
    }
  }
  async function move(target: number, animate = false) {
    if (busy.current || editingOpen()) return;
    const token = ++operation.current;
    busy.current = true;
    setPhase("saving");
    setError("");
    if (animate) {
      const invalid = admission
        ? validateAdmission(draft.admission)[admission.key]
        : review && chapter === "I"
          ? Object.values(validateAdmission(draft.admission))[0]
          : undefined;
      const familiarity = story.answers.III01;
      if (
        invalid ||
        ((step.id === "III01" || (review && chapter === "III")) &&
          (familiarity?.status !== "answered" ||
            !["sim", "nao", "parcialmente", "incerto"].includes(
              String(familiarity?.value),
            )))
      ) {
        setError(
          invalid || "Escolha uma resposta para III01. “Incerto” é válido.",
        );
        busy.current = false;
        setPhase("idle");
        document.getElementById(step.id)?.focus();
        return;
      }
    }
    const next = experienceSteps[target];
    // Persist the confirmed answer and resume cursor before any visual transition.
    change((p) => ({
      ...p,
      draft:
        review && animate && chapter === "I"
          ? { ...p.draft, completed: true }
          : p.draft,
      story: {
        ...p.story,
        experienceStep: next?.id ?? step.id,
        chaptersReviewed:
          review && animate
            ? Array.from(new Set([...p.story.chaptersReviewed, chapter]))
            : p.story.chaptersReviewed,
      },
    }));
    const saved = await saveNow();
    if (token !== operation.current) return;
    if (!saved) {
      change((p) => ({
        ...p,
        story: {
          ...p.story,
          experienceStep: step.id,
          chaptersReviewed: story.chaptersReviewed,
        },
      }));
      setError(
        "Não foi possível salvar. Tente novamente ou preserve um backup no menu.",
      );
      busy.current = false;
      setPhase("idle");
      return;
    }
    const finish = () => {
      setOpening(null);
      if (next) setIndex(target);
      else router.push("/revisao");
    };
    if (
      (!animate && target === index) ||
      skipRequested.current ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInk("");
      finish();
      setPhase("idle");
      busy.current = false;
      return;
    }
    const value = !animate
      ? ""
      : admission
        ? draft.admission[admission.key]
        : question
          ? story.answers[question.id]?.status === "answered"
            ? story.answers[question.id]?.value
            : ""
          : step.id === "II00"
            ? story.family.displayName
            : "";
    setInk(
      Array.isArray(value)
        ? value
            .map(
              (id) =>
                story.relationships.find((r) => r.id === id)?.name ??
                story.objects.find((o) => o.id === id)?.name ??
                id,
            )
            .join(" · ")
        : value || "",
    );
    pending.current = finish;
    setTurnDirection(target < index ? -1 : 1);
    if (!animate) {
      setPage((p) => p + 1);
      setPhase("turn");
      timer.current = setTimeout(finishAnimation, 1650);
      return;
    }
    setPhase("glow");
    timer.current = setTimeout(() => {
      setPhase("absorb");
      timer.current = setTimeout(() => {
        setPage((p) => p + 1);
        setPhase("turn");
        timer.current = setTimeout(finishAnimation, 1650);
      }, 650);
    }, 320);
  }
  const family = families.find((f) => f.id === story.family.catalogId);
  return (
    <main
      ref={root}
      id="conteudo"
      className={`cinema ${skip ? "cinema-still" : ""}`}
      data-phase={phase}
      data-chapter={chapter}
      data-travelling={travelling ? "true" : "false"}
      aria-busy={travelling || phase !== "idle"}
    >
      <SceneStage
        kind={chapter}
        immersive
        page={page}
        turnDirection={turnDirection}
        turning={phase === "turn"}
        writtenText={ink}
        onSkip={skipAnimations}
        onJourney={setTravelling}
      />
      <div className="cinema-scrim" aria-hidden="true" />
      <header className="cinema-header">
        <div>
          <p className="eyebrow">Hogwarts · 1890 · Capítulo {chapter}</p>
          <h1>{c.title}</h1>
        </div>
        <button className="text-button" onClick={() => setMenu(true)}>
          Capítulos e opções
        </button>
        <button className="text-button" onClick={() => void leave("/")}>
          Sair e continuar depois
        </button>
      </header>
      <div className="cinema-document-layout">
        <div
          ref={heading}
          tabIndex={-1}
          className="cinema-writing"
          key={step.id}
          aria-label={`Página ${step.id}`}
        >
          <fieldset
            disabled={travelling || phase !== "idle"}
            className="cinema-fields"
          >
            {admission && (
              <section className="question-block">
                <h2 id={`${step.id}-title`}>
                  {admission.label}
                  {admission.required ? " *" : ""}
                </h2>
                <p id={`${step.id}-help`} className="field-help">
                  {admission.help}
                </p>
                <label className="sr-only" htmlFor={step.id}>
                  {admission.label}
                </label>
                {admission.type === "textarea" ? (
                  <textarea
                    id={step.id}
                    rows={4}
                    maxLength={5000}
                    value={draft.admission[admission.key]}
                    aria-describedby={`${step.id}-help`}
                    onChange={(e) =>
                      change((p) => ({
                        ...p,
                        draft: {
                          ...p.draft,
                          completed: false,
                          updatedAt: new Date().toISOString(),
                          admission: {
                            ...p.draft.admission,
                            [admission.key]: e.target.value,
                          },
                        },
                        story: {
                          ...p.story,
                          chaptersReviewed: p.story.chaptersReviewed.filter(
                            (v) => v !== "I",
                          ),
                        },
                      }))
                    }
                  />
                ) : (
                  <input
                    id={step.id}
                    type={admission.type}
                    min={admission.type === "date" ? "0001-01-01" : undefined}
                    max={admission.type === "date" ? "1890-08-31" : undefined}
                    maxLength={5000}
                    value={draft.admission[admission.key]}
                    aria-describedby={`${step.id}-help${admission.key === "birthDate" ? ` ${step.id}-age` : ""}`}
                    aria-invalid={!!error}
                    onChange={(e) =>
                      change((p) => ({
                        ...p,
                        draft: {
                          ...p.draft,
                          completed: false,
                          updatedAt: new Date().toISOString(),
                          admission: {
                            ...p.draft.admission,
                            [admission.key]: e.target.value,
                          },
                        },
                        story: {
                          ...p.story,
                          chaptersReviewed: p.story.chaptersReviewed.filter(
                            (v) => v !== "I",
                          ),
                        },
                      }))
                    }
                  />
                )}
                {admission.key === "birthDate" && (
                  <BirthGuidance
                    value={draft.admission.birthDate}
                    id={`${step.id}-age`}
                  />
                )}
              </section>
            )}
            {step.id === "II00" && (
              <FamilySelector
                family={story.family}
                applies={story.answers["II00-applies"]}
                onChange={(family) =>
                  editStory((s) => ({
                    ...s,
                    family,
                    answers:
                      s.family.catalogId !== family.catalogId &&
                      s.answers["II00-applies"]
                        ? {
                            ...s.answers,
                            "II00-applies": {
                              ...s.answers["II00-applies"],
                              status: "unknown",
                            },
                          }
                        : s.answers,
                  }))
                }
                onApply={(a) =>
                  editStory((s) => ({
                    ...s,
                    answers: { ...s.answers, "II00-applies": a },
                  }))
                }
              />
            )}
            {question && (
              <QuestionField
                question={question}
                answer={story.answers[question.id]}
                onChange={(a) =>
                  editStory((s) => ({
                    ...s,
                    answers: { ...s.answers, [question.id]: a },
                  }))
                }
                relations={story.relationships}
                objects={story.objects}
                onSaveRelation={saveRelation}
                onSaveObject={saveObject}
                onOpen={() => setOpening({ source: question.id })}
              />
            )}
            {review && (
              <section className="question-block">
                <h2>{c.transition}</h2>
                <p>{c.intro}</p>
                {chapter !== "I" && (
                  <>
                    <h3>Uma página ainda em branco</h3>
                    <p className="field-help">
                      Você pode deixar algo em aberto; não precisa. As sugestões
                      nunca viram fatos automaticamente.
                    </p>
                    {c.extensions.map((ext) => (
                      <button
                        className="text-button"
                        key={ext.id}
                        onClick={() => setOpening({ source: ext.id })}
                      >
                        {ext.title}
                      </button>
                    ))}
                    <button
                      className="text-button"
                      onClick={() => setOpening({ source: `${chapter}-livre` })}
                    >
                      Quero deixar uma parte em aberto
                    </button>
                  </>
                )}
                {story.narrativeHooks
                  .filter(
                    (h) =>
                      h.sourceQuestionId.replace(/\d.*$/, "") === chapter ||
                      h.sourceQuestionId.startsWith(`${chapter}-`),
                  )
                  .map((h) => (
                    <HookCard
                      key={h.id}
                      hook={h}
                      onEdit={() =>
                        setOpening({ source: h.sourceQuestionId, hook: h })
                      }
                      onDelete={() => {
                        if (confirm("Excluir esta oportunidade?"))
                          editStory((s) => ({
                            ...s,
                            narrativeHooks: s.narrativeHooks.filter(
                              (v) => v.id !== h.id,
                            ),
                          }));
                      }}
                    />
                  ))}
              </section>
            )}
            {opening && (
              <HookEditor
                key={opening.hook?.id ?? opening.source}
                initial={opening.hook}
                source={opening.source}
                suggestions={
                  family?.perguntasContextuais ??
                  c.extensions.map((e) => e.title)
                }
                onCancel={() => setOpening(null)}
                onSave={(h) => {
                  editStory((s) => ({
                    ...s,
                    narrativeHooks: s.narrativeHooks.some((v) => v.id === h.id)
                      ? s.narrativeHooks.map((v) => (v.id === h.id ? h : v))
                      : [...s.narrativeHooks, h],
                  }));
                  setOpening(null);
                }}
              />
            )}
          </fieldset>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </div>
        <div className="cinema-bottom">
          <div className="cinema-progress">
            <span>
              {index + 1} / {experienceSteps.length}
            </span>
            <progress
              aria-label="Progresso da história"
              value={index + 1}
              max={experienceSteps.length}
            />
          </div>
          <div className="cinema-actions">
            <button
              className="button secondary"
              disabled={travelling || index === 0 || phase !== "idle"}
              onClick={() => void move(index - 1)}
            >
              Voltar
            </button>
            <button
              className="button"
              disabled={travelling || phase !== "idle"}
              onClick={() => void move(index + 1, true)}
            >
              {review
                ? chapter === "VII"
                  ? "Revisar minha história"
                  : "Confirmar capítulo e continuar"
                : "Continuar"}
            </button>
          </div>
          <p className="sr-only" role="status">
            {phase === "idle" ? `Página ${step.id}` : "Guardando sua resposta…"}
          </p>
          {storageError && (
            <button className="text-button" onClick={() => setMenu(true)}>
              Falha ao salvar — preservar backup
            </button>
          )}
        </div>
      </div>
      {phase !== "idle" && (
        <div className="cinema-ink" aria-hidden="true">
          {ink.slice(0, 250)}
        </div>
      )}
      <dialog
        ref={dialog}
        className="cinema-menu"
        aria-label="Seu registro mágico"
        onCancel={() => setMenu(false)}
        onClose={() => setMenu(false)}
      >
        <h2>Seu registro mágico</h2>
        <button className="button secondary" onClick={() => setMenu(false)}>
          Voltar à cena
        </button>
        <nav aria-label="Capítulos da história">
          {chapterIds.map((id) => (
            <button
              key={id}
              className="text-button"
              onClick={async () => {
                await move(experienceSteps.findIndex((s) => s.chapter === id));
                setMenu(false);
              }}
            >
              {id} — {chapters[id].title}
              {story.chaptersReviewed.includes(id) ? " ✓" : ""}
            </button>
          ))}
          <button
            className="text-button"
            onClick={() => void leave("/revisao")}
          >
            Revisar minha história
          </button>
          <button className="text-button" onClick={() => void leave("/mestre")}>
            Arquivo do Mestre
          </button>
        </nav>
        <PlayerStatus />
        <PlayerTools
          onRestore={(stepId) => {
            cancelTransition();
            setInk("");
            setIndex(
              Math.max(
                0,
                experienceSteps.findIndex((s) => s.id === stepId),
              ),
            );
            setMenu(false);
          }}
        />
      </dialog>
    </main>
  );
}
