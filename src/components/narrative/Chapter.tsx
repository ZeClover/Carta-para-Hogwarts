"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { chapters, chapterIds, type ChapterId } from "@/content/chapters";
import { families } from "@/content/families";
import { type Hook, type Relation, type StoryObject } from "@/lib/story";
import { usePlayer } from "./PlayerProvider";
import { PlayerStatus, PlayerTools } from "./PlayerTools";
import { ChapterNav } from "./ChapterNav";
import { SceneBanner } from "./SceneBanner";
import { FamilySelector } from "./FamilySelector";
import { QuestionField } from "./QuestionField";
import { HookEditor, HookCard } from "./HookEditor";
export function Chapter({ chapter }: { chapter: ChapterId }) {
  const { player, change, saveNow } = usePlayer();
  const router = useRouter();
  const c = chapters[chapter];
  const [opening, setOpening] = useState<{
    source: string;
    hook?: Hook;
  } | null>(null);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  if (!player)
    return (
      <p className="paper" role="status">
        Carregando sua história…
      </p>
    );
  const { story } = player;
  function editStory(edit: (s: typeof story) => typeof story) {
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
    const duplicate = story.relationships.find(
      (v) =>
        v.id !== r.id &&
        v.name.trim().toLocaleLowerCase("pt-BR") ===
          r.name.trim().toLocaleLowerCase("pt-BR"),
    );
    if (duplicate) return duplicate.id;
    editStory((s) => ({
      ...s,
      relationships: s.relationships.some((v) => v.id === r.id)
        ? s.relationships.map((v) => (v.id === r.id ? r : v))
        : [...s.relationships, r],
    }));
    return r.id;
  }
  function saveObject(o: StoryObject) {
    const duplicate = story.objects.find(
      (v) =>
        v.id !== o.id &&
        v.name.toLocaleLowerCase("pt-BR") === o.name.toLocaleLowerCase("pt-BR"),
    );
    if (duplicate) return duplicate.id;
    editStory((s) => ({
      ...s,
      objects: s.objects.some((v) => v.id === o.id)
        ? s.objects.map((v) => (v.id === o.id ? o : v))
        : [...s.objects, o],
    }));
    return o.id;
  }
  async function next() {
    if (!player) return;
    if (
      chapter === "III" &&
      (!player.story.answers.III01 ||
        player.story.answers.III01.status !== "answered" ||
        !["sim", "nao", "parcialmente", "incerto"].includes(
          String(player.story.answers.III01.value),
        ))
    ) {
      setError("Escolha uma resposta para III01. “Incerto” é válido.");
      document.getElementById("III01")?.focus();
      return;
    }
    change((p) => ({
      ...p,
      story: {
        ...p.story,
        chaptersReviewed: Array.from(
          new Set([...p.story.chaptersReviewed, chapter]),
        ),
      },
    }));
    if (!(await saveNow())) {
      setError(
        "Sua história ainda não foi salva. Preserve um backup antes de sair.",
      );
      return;
    }
    const index = chapterIds.indexOf(chapter);
    router.push(index === 6 ? "/revisao" : `/criar/${chapterIds[index + 1]}`);
  }
  const family = families.find((f) => f.id === story.family.catalogId);
  return (
    <>
      <ChapterNav current={chapter} reviewed={story.chaptersReviewed} />
      <section className="paper admission narrative-paper">
        <p className="eyebrow">
          Capítulo {chapter} · Memórias, não um formulário da escola
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {c.title}
        </h1>
        <SceneBanner chapter={chapter} />
        <p className="chapter-intro">{c.intro}</p>
        <PlayerStatus />
        <p className="fine-print">
          Você pode pular, dizer “Não sei” ou “Prefiro não responder”. Não
          forneça informações sensíveis da vida real.
        </p>
        {chapter === "II" && (
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
        )}{" "}
        {c.questions.map((q) => {
          const adapted =
            q.id === "IV01"
              ? {
                  ...q,
                  help:
                    story.answers.III01?.value === "nao"
                      ? "Se você não conhecia o mundo mágico, quem explicou a notícia? Um representante da escola, familiar ou outra pessoa? Você escolhe a forma da chegada."
                      : q.help,
                }
              : q;
          return (
            <div key={q.id}>
              <QuestionField
                question={adapted}
                answer={story.answers[q.id]}
                onChange={(a) =>
                  editStory((s) => ({
                    ...s,
                    answers: { ...s.answers, [q.id]: a },
                  }))
                }
                relations={story.relationships}
                objects={story.objects}
                onSaveRelation={saveRelation}
                onSaveObject={saveObject}
                onOpen={() => setOpening({ source: q.id })}
                error={q.id === "III01" ? error : undefined}
              />
              {opening?.source === q.id && (
                <HookEditor
                  key={opening.hook?.id ?? opening.source}
                  initial={opening.hook}
                  source={opening.source}
                  suggestions={
                    family?.perguntasContextuais ?? [
                      "O que você sabe com certeza?",
                      "O que gostaria de descobrir?",
                      "Que detalhe deve permanecer como você definiu?",
                    ]
                  }
                  onCancel={() => setOpening(null)}
                  onSave={(h) => {
                    editStory((s) => ({
                      ...s,
                      narrativeHooks: s.narrativeHooks.some(
                        (v) => v.id === h.id,
                      )
                        ? s.narrativeHooks.map((v) => (v.id === h.id ? h : v))
                        : [...s.narrativeHooks, h],
                    }));
                    setOpening(null);
                  }}
                />
              )}
            </div>
          );
        })}
        <section className="chapter-openings">
          <h2>Uma página ainda em branco</h2>
          <p className="fine-print">
            Você pode deixar algo em aberto; não precisa. As sugestões nunca
            viram fatos automaticamente.
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
            className="button secondary"
            onClick={() => setOpening({ source: `${chapter}-livre` })}
          >
            Quero deixar uma parte em aberto
          </button>
          {opening && !c.questions.some((q) => q.id === opening.source) && (
            <HookEditor
              key={opening.hook?.id ?? opening.source}
              initial={opening.hook}
              source={opening.source}
              suggestions={
                family?.perguntasContextuais ?? c.extensions.map((e) => e.title)
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
        </section>
        {story.narrativeHooks
          .filter(
            (h) =>
              h.sourceQuestionId.startsWith(chapter) &&
              !h.sourceQuestionId.startsWith(chapter + "I"),
          )
          .map((h) => (
            <HookCard
              key={h.id}
              hook={h}
              onEdit={() => setOpening({ source: h.sourceQuestionId, hook: h })}
              onDelete={() => {
                if (window.confirm("Excluir esta oportunidade?"))
                  editStory((s) => ({
                    ...s,
                    narrativeHooks: s.narrativeHooks.filter(
                      (v) => v.id !== h.id,
                    ),
                  }));
              }}
            />
          ))}
        {error && chapter !== "III" && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            onClick={async () => {
              await saveNow();
              router.push(
                `/criar/${chapterIds[chapterIds.indexOf(chapter) - 1]}`,
              );
            }}
          >
            ← Capítulo anterior
          </button>
          <button className="button" onClick={() => void next()}>
            {chapter === "VII"
              ? "Revisar minha história"
              : "Revisar capítulo e continuar →"}
          </button>
        </div>
        <PlayerTools />
      </section>
    </>
  );
}
