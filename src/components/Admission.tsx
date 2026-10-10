"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sheets, sheetNames } from "@/content/admission";
import {
  ageIn1890,
  downloadDraft,
  parseBackup,
  validateAdmission,
  type Field,
} from "@/lib/draft";
import { createStory } from "@/lib/story";
import { usePlayer } from "./narrative/PlayerProvider";
import { PlayerStatus, PlayerTools } from "./narrative/PlayerTools";
import { ChapterNav } from "./narrative/ChapterNav";
import { SceneStage } from "./scenes/SceneStage";
export function Admission() {
  const router = useRouter();
  const { player, change, replace, saveNow } = usePlayer();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  if (!player)
    return (
      <p className="paper" role="status">
        Carregando seu registro…
      </p>
    );
  const { draft, story } = player;
  const age = ageIn1890(draft.admission.birthDate);
  function changeField(field: Field, value: string) {
    change((p) => ({
      ...p,
      draft: {
        ...p.draft,
        completed: false,
        updatedAt: new Date().toISOString(),
        admission: { ...p.draft.admission, [field]: value },
      },
      story: {
        ...p.story,
        chaptersReviewed: p.story.chaptersReviewed.filter((v) => v !== "I"),
      },
    }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }
  function navigate(sheet: number) {
    change((p) => ({ ...p, draft: { ...p.draft, sheet } }));
    heading.current?.focus();
  }
  async function conclude() {
    if (!player) return;
    const issues = validateAdmission(player.draft.admission);
    setErrors(issues);
    if (Object.keys(issues).length) {
      const first = Object.keys(issues)[0] as Field;
      const sheet = sheets.findIndex((group) =>
        group.some((q) => q.key === first),
      );
      navigate(sheet);
      setNotice("Revise os campos indicados antes de concluir.");
      setTimeout(() => document.getElementById(first)?.focus(), 0);
      return;
    }
    change((p) => ({
      ...p,
      draft: { ...p.draft, completed: true },
      story: {
        ...p.story,
        chaptersReviewed: Array.from(
          new Set([...p.story.chaptersReviewed, "I"]),
        ),
      },
    }));
    if (await saveNow()) router.push("/criar/II");
    else
      setNotice(
        "O registro está preenchido, mas não foi salvo. Baixe um backup antes de sair.",
      );
  }
  async function restoreLegacy(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 100000 || !file.name.toLowerCase().endsWith(".json"))
        throw new Error("Escolha um backup JSON do registro de até 100 KB.");
      const d = parseBackup(await file.text());
      if (
        !window.confirm(
          "Restaurar apenas o Registro de Admissão? Para preservar capítulos adicionais, use o backup completo abaixo.",
        )
      )
        return;
      replace({
        draft: d,
        story: player?.draft.id === d.id ? player.story : createStory(d.id),
      });
      if (await saveNow()) setNotice("Cópia restaurada.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Arquivo inválido.");
    }
  }
  return (
    <>
      <ChapterNav current="I" reviewed={story.chaptersReviewed} />
      <section className="paper admission">
        <p className="eyebrow">Secretaria de Admissões · Documento oficial</p>
        <h1 ref={heading} tabIndex={-1}>
          {sheetNames[draft.sheet]}
        </h1>
        <SceneStage kind="I" page={draft.sheet} />
        <PlayerStatus />
        {notice && (
          <p className="warning" role="alert">
            {notice}
          </p>
        )}
        <nav className="sheet-tabs" aria-label="Folhas do registro">
          {sheetNames.map((name, i) => (
            <button
              key={name}
              aria-label={`Folha ${i + 1}: ${name}`}
              aria-current={i === draft.sheet ? "step" : undefined}
              onClick={() => navigate(i)}
            >
              {i + 1}
              <span>{name}</span>
            </button>
          ))}
        </nav>
        <p className="fine-print">
          Folha {draft.sheet + 1} de 3 · * Campo obrigatório · Descreva seu
          personagem fictício.
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.sheet < 2) navigate(draft.sheet + 1);
            else void conclude();
          }}
        >
          {sheets[draft.sheet].map((q) => (
            <div className="field" key={q.id}>
              <label htmlFor={q.key}>
                {q.label}
                {q.required ? (
                  " *"
                ) : (
                  <small>{q.id === "I07" ? " Recomendado" : " Opcional"}</small>
                )}
              </label>
              <p id={`${q.key}-help`} className="field-help">
                {q.help}
              </p>
              {q.type === "textarea" ? (
                <textarea
                  id={q.key}
                  value={draft.admission[q.key]}
                  rows={4}
                  maxLength={5000}
                  placeholder={q.example}
                  aria-describedby={`${q.key}-help`}
                  onChange={(e) => changeField(q.key, e.target.value)}
                />
              ) : (
                <input
                  id={q.key}
                  type={q.type}
                  value={draft.admission[q.key]}
                  required={q.required}
                  maxLength={5000}
                  min={q.type === "date" ? "0001-01-01" : undefined}
                  max={q.type === "date" ? "1890-08-31" : undefined}
                  placeholder={q.example}
                  autoComplete="off"
                  aria-invalid={!!errors[q.key]}
                  aria-describedby={`${q.key}-help ${errors[q.key] ? `${q.key}-error` : ""}`}
                  onChange={(e) => changeField(q.key, e.target.value)}
                />
              )}{" "}
              {errors[q.key] && (
                <p className="field-error" id={`${q.key}-error`}>
                  {errors[q.key]}
                </p>
              )}
              {q.key === "birthDate" && age !== null && age !== 11 && (
                <p className="warning">
                  Seu personagem terá {age} anos no início das aulas. A idade
                  típica é 11 anos; exceções são permitidas e podem ser
                  combinadas com o Mestre.
                </p>
              )}
            </div>
          ))}
          <div className="form-actions">
            {draft.sheet > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => navigate(draft.sheet - 1)}
              >
                ← Folha anterior
              </button>
            )}
            <button className="button" type="submit">
              {draft.sheet === 2
                ? "Concluir Registro de Admissão"
                : "Próxima folha →"}
            </button>
          </div>
        </form>
        <details className="legacy-backup">
          <summary>Backup do registro da primeira versão</summary>
          <p className="fine-print">
            Este formato preserva apenas as oito perguntas do Capítulo I. Use o
            backup completo para incluir todos os capítulos.
          </p>
          <button
            className="button secondary"
            onClick={() => downloadDraft(draft)}
          >
            Baixar backup do registro
          </button>
          <label className="file-button">
            Restaurar backup
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                void restoreLegacy(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </details>
        <PlayerTools />
      </section>
    </>
  );
}
