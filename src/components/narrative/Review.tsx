"use client";
import Link from "next/link";
import { useState } from "react";
import { chapterIds, chapters, labels, themeOptions } from "@/content/chapters";
import { questions } from "@/content/admission";
import {
  authorized,
  buildExport,
  completionErrors,
  downloadJSON,
  slug,
  splitLines,
  type Hook,
} from "@/lib/story";
import { usePlayer } from "./PlayerProvider";
import { PlayerTools, PlayerStatus } from "./PlayerTools";
import { ChapterNav } from "./ChapterNav";
import { HookCard, HookEditor } from "./HookEditor";
function statusText(value: unknown, status: string) {
  return status !== "answered"
    ? (labels[status] ?? status)
    : Array.isArray(value)
      ? value.join(", ")
      : String(value ?? "");
}
import { SceneStage } from "../scenes/SceneStage";
export function Review() {
  const { player, change, saveNow } = usePlayer();
  const [sheet, setSheet] = useState(0);
  const [editing, setEditing] = useState<Hook | null>(null);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [noOpen, setNoOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!player)
    return (
      <p className="paper" role="status">
        Carregando sua história…
      </p>
    );
  const { draft, story } = player;
  const tabs = [
    "Minha história",
    "O que permanece aberto",
    "Histórias que quero viver",
    "Limites narrativos",
  ];
  function updatePreferences(
    key: keyof typeof story.preferences,
    value: string[] | string | boolean,
  ) {
    change((p) => ({
      ...p,
      story: {
        ...p.story,
        preferences: { ...p.story.preferences, [key]: value },
        updatedAt: new Date().toISOString(),
      },
    }));
  }
  async function conclude() {
    if (!player) return;
    const issues = completionErrors(player.draft, player.story);
    if (issues.length) {
      setError(issues.join(" "));
      return;
    }
    if (!player.story.narrativeHooks.some(authorized) && !noOpen) {
      setNoOpen(true);
      return;
    }
    setBusy(true);
    try {
      const data = buildExport(player.draft, player.story);
      change((p) => ({
        ...p,
        story: {
          ...p.story,
          revision: data.revision,
          updatedAt: data.exportedAt,
        },
      }));
      downloadJSON(
        data,
        `hogwarts-1890-personagem-${slug(data.character.fullName)}-v${data.revision}.json`,
      );
      const saved = await saveNow();
      setComplete(true);
      setError(
        saved
          ? ""
          : "O arquivo foi exportado, mas a revisão local não pôde ser salva. Guarde o JSON e baixe o backup completo.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível exportar.");
    } finally {
      setBusy(false);
    }
  }
  function readableAnswer(id: string) {
    const a = story.answers[id];
    if (!a) return "Não informado";
    let value = a.value;
    const q = chapters[
      id.replace(/\d+$/, "") as keyof typeof chapters
    ]?.questions.find((q) => q.id === id);
    if (q?.type === "relations" && Array.isArray(value))
      value = value.map(
        (v) => story.relationships.find((r) => r.id === v)?.name ?? v,
      );
    if (q?.type === "objects" && Array.isArray(value))
      value = value.map(
        (v) => story.objects.find((o) => o.id === v)?.name ?? v,
      );
    return [
      statusText(value, a.status),
      a.status === "answered" &&
      !(q?.conditionalExplanation && a.value === "nao")
        ? a.explanation
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return (
    <>
      <ChapterNav current="revisao" reviewed={story.chaptersReviewed} />
      <section className="paper admission">
        <p className="eyebrow">Seu passado está escrito. Seu futuro, não.</p>
        <h1>Revisão da sua história</h1>
        <SceneStage kind="final" label={player.draft.admission.fullName} />
        <PlayerStatus />
        <p>
          Confira fatos, crenças e permissões. Nenhum limite ou resposta exige
          dados da sua vida real.
        </p>
        <nav className="review-tabs" aria-label="Folhas de revisão">
          {tabs.map((title, i) => (
            <button
              key={title}
              className={sheet === i ? "active" : ""}
              aria-current={sheet === i ? "page" : undefined}
              onClick={() => setSheet(i)}
            >
              {i + 1}. {title}
            </button>
          ))}
        </nav>
        {sheet === 0 && (
          <>
            <h2>Minha história</h2>
            <p className="fine-print">
              As respostas abaixo são suas palavras; nenhuma biografia foi
              inventada.
            </p>
            <div className="review-chapter">
              <h3>I · Registro de Admissão</h3>
              <Link href="/experiencia?capitulo=I">Editar Capítulo I</Link>
              <dl className="review-list">
                {questions.map((q) => (
                  <div key={q.id}>
                    <dt>{q.label}</dt>
                    <dd>{draft.admission[q.key] || "Não informado"}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {chapterIds.slice(1).map((id) => (
              <div key={id} className="review-chapter">
                <h3>
                  {id} · {chapters[id].title}
                </h3>
                <Link href={`/experiencia?capitulo=${id}`}>
                  Editar Capítulo {id}
                </Link>
                {id === "II" && (
                  <p>
                    Família: {story.family.displayName || "Não definida"}
                    <br />
                    {story.family.branchNotes}
                  </p>
                )}
                <dl className="review-list">
                  {chapters[id].questions.map((q) => (
                    <div key={q.id}>
                      <dt>{q.label}</dt>
                      <dd>{readableAnswer(q.id)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            <div className="review-chapter">
              <h3>Pessoas e vínculos</h3>
              <p className="fine-print">
                As pessoas e objetos cadastrados compõem sua ficha mesmo quando
                não estão selecionados em uma pergunta. Você pode removê-los
                aqui; isso retira as referências de todas as respostas.
              </p>
              {story.relationships.map((r) => (
                <article key={r.id}>
                  <h4>
                    {r.name} · {r.role}
                  </h4>
                  <p>
                    Proximidade: {r.relationshipLevel} · Situação:{" "}
                    {r.status ?? "não declarada"}
                  </p>
                  <p className="preserve-lines">{r.notes}</p>
                  <p>Fatos: {r.knownFacts.join("; ") || "não informados"}</p>
                  <p>
                    Crenças: {r.characterBeliefs.join("; ") || "não informadas"}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remover ${r.name} e suas referências de todas as perguntas?`,
                        )
                      )
                        change((p) => ({
                          ...p,
                          story: {
                            ...p.story,
                            relationships: p.story.relationships.filter(
                              (v) => v.id !== r.id,
                            ),
                            answers: Object.fromEntries(
                              Object.entries(p.story.answers).map(([id, a]) => [
                                id,
                                Array.isArray(a.value)
                                  ? {
                                      ...a,
                                      value: a.value.filter((v) => v !== r.id),
                                    }
                                  : a,
                              ]),
                            ),
                          },
                        }));
                    }}
                  >
                    Remover pessoa {r.name}
                  </button>
                </article>
              ))}
            </div>
            <div className="review-chapter">
              <h3>Objetos e lugares queridos</h3>
              {story.objects.map((o) => (
                <article key={o.id}>
                  <h4>
                    {o.name} · {o.kind}
                  </h4>
                  <p className="preserve-lines">{o.meaning}</p>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        window.confirm(`Remover ${o.name} e suas referências?`)
                      )
                        change((p) => ({
                          ...p,
                          story: {
                            ...p.story,
                            objects: p.story.objects.filter(
                              (v) => v.id !== o.id,
                            ),
                            answers: Object.fromEntries(
                              Object.entries(p.story.answers).map(([id, a]) => [
                                id,
                                Array.isArray(a.value)
                                  ? {
                                      ...a,
                                      value: a.value.filter((v) => v !== o.id),
                                    }
                                  : a,
                              ]),
                            ),
                          },
                        }));
                    }}
                  >
                    Remover objeto {o.name}
                  </button>
                </article>
              ))}
            </div>
            <div className="review-checks">
              <h3>Confirme os capítulos que revisou</h3>
              {chapterIds.map((id) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={story.chaptersReviewed.includes(id)}
                    onChange={(e) =>
                      change((p) => ({
                        ...p,
                        story: {
                          ...p.story,
                          chaptersReviewed: e.target.checked
                            ? Array.from(
                                new Set([...p.story.chaptersReviewed, id]),
                              )
                            : p.story.chaptersReviewed.filter((v) => v !== id),
                        },
                      }))
                    }
                  />
                  {id} · {chapters[id].title}
                </label>
              ))}
            </div>
          </>
        )}
        {sheet === 1 && (
          <>
            <h2>O que permanece aberto</h2>
            <p>
              {story.narrativeHooks.filter(authorized).length} oportunidades
              explicitamente autorizadas. Recomendamos duas oportunidades e uma
              relação aproveitável, mas você pode concluir sem nenhuma.
            </p>
            {story.narrativeHooks.length === 0 && (
              <p>
                Nenhuma oportunidade criada. Se desejar, volte a um capítulo e
                clique em “Quero deixar algo em aberto”.
              </p>
            )}
            {story.narrativeHooks.map((h) => (
              <HookCard
                key={h.id}
                hook={h}
                onEdit={() => setEditing(h)}
                onDelete={() => {
                  if (window.confirm("Excluir esta oportunidade?"))
                    change((p) => ({
                      ...p,
                      story: {
                        ...p.story,
                        narrativeHooks: p.story.narrativeHooks.filter(
                          (v) => v.id !== h.id,
                        ),
                      },
                    }));
                }}
              />
            ))}
            {editing && (
              <HookEditor
                key={editing.id}
                initial={editing}
                source={editing.sourceQuestionId}
                onCancel={() => setEditing(null)}
                onSave={(h) => {
                  change((p) => ({
                    ...p,
                    story: {
                      ...p.story,
                      narrativeHooks: p.story.narrativeHooks.map((v) =>
                        v.id === h.id ? h : v,
                      ),
                    },
                  }));
                  setEditing(null);
                }}
              />
            )}
          </>
        )}
        {sheet === 2 && (
          <>
            <h2>Que histórias gostaria de viver?</h2>
            <p>Interesses não obrigam o Mestre a executar tudo.</p>
            <fieldset className="choice-grid">
              <legend className="sr-only">Temas de interesse</legend>
              {themeOptions.map((theme) => (
                <label key={theme}>
                  <input
                    type="checkbox"
                    checked={story.preferences.themes.includes(theme)}
                    onChange={(e) =>
                      updatePreferences(
                        "themes",
                        e.target.checked
                          ? [...story.preferences.themes, theme]
                          : story.preferences.themes.filter((v) => v !== theme),
                      )
                    }
                  />
                  {theme.replaceAll("_", " ")}
                </label>
              ))}
            </fieldset>
          </>
        )}
        {sheet === 3 && (
          <>
            <h2>Limites narrativos</h2>
            <p>
              Estes campos são privados para você e para o Mestre que receber o
              JSON. Não são usados para gerar histórias automaticamente.
            </p>
            {(["avoid", "discussFirst", "notes"] as const).map((key, i) => (
              <div className="field" key={key}>
                <label htmlFor={`preference-${key}`}>
                  {["Não explorar", "Conversar antes", "Observações"][i]}
                </label>
                <p className="field-help">
                  {i < 2
                    ? "Uma entrada por linha."
                    : "Não é preciso justificar seus limites."}
                </p>
                <textarea
                  id={`preference-${key}`}
                  rows={3}
                  maxLength={5000}
                  value={
                    typeof story.preferences[key] === "string"
                      ? (story.preferences[key] as string)
                      : (story.preferences[key] as string[]).join("\n")
                  }
                  onChange={(e) =>
                    updatePreferences(
                      key,
                      key === "notes"
                        ? e.target.value
                        : e.target.value.split("\n"),
                    )
                  }
                />
              </div>
            ))}
            <label className="check-line">
              <input
                type="checkbox"
                checked={story.preferences.discussPrivately ?? false}
                onChange={(e) =>
                  updatePreferences("discussPrivately", e.target.checked)
                }
              />
              Prefiro discutir em particular
            </label>
          </>
        )}
        {error && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}
        {noOpen && !story.narrativeHooks.some(authorized) && (
          <div className="warning">
            <p>
              Você não deixou oportunidades autorizadas. Isso é válido. Deseja
              concluir assim? Você também pode voltar aos capítulos e usar as
              perguntas de apoio.
            </p>
            <button
              className="button secondary"
              onClick={() => {
                setNoOpen(false);
                setSheet(1);
              }}
            >
              Rever oportunidades
            </button>
          </div>
        )}
        <div className="final-actions">
          <button
            className="button"
            disabled={busy}
            onClick={() => {
              change((p) => ({
                ...p,
                story: {
                  ...p.story,
                  preferences: {
                    ...p.story.preferences,
                    avoid: splitLines(p.story.preferences.avoid.join("\n")),
                    discussFirst: splitLines(
                      p.story.preferences.discussFirst.join("\n"),
                    ),
                  },
                },
              }));
              void conclude();
            }}
          >
            {busy
              ? "Exportando…"
              : complete
                ? "Reexportar minha história"
                : noOpen && !story.narrativeHooks.some(authorized)
                  ? "Confirmar e concluir sem oportunidades"
                  : "Concluir minha história"}
          </button>
          <p className="fine-print">
            Valida os campos obrigatórios, incrementa a revisão e baixa a ficha
            JSON. A entrega ao Mestre é sua escolha; não há envio automático.
          </p>
        </div>
        {complete && (
          <section className="epilogue">
            <div className="seal" aria-hidden="true">
              H
            </div>
            <h2>{draft.admission.fullName}</h2>
            <p>
              Seu passado está escrito. Seu futuro, não.
              <br />
              Nos encontraremos em Hogwarts.
            </p>
            <p className="fine-print">
              Assinatura simbólica do personagem · Revisão {story.revision}
            </p>
          </section>
        )}
        <PlayerTools />
      </section>
    </>
  );
}
