"use client";
import { useEffect, useRef, useState } from "react";
import { hookSchema, splitLines, type Hook } from "@/lib/story";
import { labels } from "@/content/chapters";
export function HookEditor({
  initial,
  source,
  onSave,
  onCancel,
  suggestions = [],
}: {
  initial?: Hook;
  source: string;
  onSave: (hook: Hook) => void;
  onCancel: () => void;
  suggestions?: string[];
}) {
  const [value, setValue] = useState<Hook>(
    initial ?? {
      id: crypto.randomUUID(),
      sourceQuestionId: source,
      kind: source.startsWith("II")
        ? "familia"
        : source.startsWith("III")
          ? "magia"
          : "outro",
      title: "",
      confirmedFacts: [],
      characterBeliefs: [],
      unansweredQuestion: "",
      permission: "closed",
      playerInterest: "medium",
      specificConstraints: [],
      exploreInCampaign: "no",
    },
  );
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <section
      className="hook-editor"
      aria-label="Editor de oportunidade narrativa"
    >
      <h3 ref={heading} tabIndex={-1}>
        {initial ? "Editar ponta aberta" : "Quero deixar algo em aberto"}
      </h3>
      <p className="fine-print">
        Opcional. Uma possibilidade só entra na sua história quando você salva.
        Não é necessário criar trauma ou um grande mistério.
      </p>
      {suggestions.length > 0 && (
        <details>
          <summary>Perguntas de apoio — não são acontecimentos</summary>
          <ul>
            {suggestions.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="field">
        <label htmlFor="hook-title">Título da oportunidade *</label>
        <input
          id="hook-title"
          maxLength={200}
          value={value.title}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="hook-kind">Tipo de fio</label>
        <select
          id="hook-kind"
          value={value.kind}
          onChange={(e) =>
            setValue({ ...value, kind: e.target.value as Hook["kind"] })
          }
        >
          {[
            "familia",
            "lembranca",
            "magia",
            "objeto",
            "pessoa",
            "conflito",
            "ambicao",
            "medo",
            "promessa",
            "misterio",
            "outro",
          ].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {(["confirmedFacts", "characterBeliefs"] as const).map((key, i) => (
        <div className="field" key={key}>
          <label htmlFor={`hook-${key}`}>
            {i === 0
              ? "1. O que aconteceu ou foi percebido? — Fatos"
              : "2. O que o personagem acha que significa? — Crenças"}
          </label>
          <textarea
            id={`hook-${key}`}
            rows={3}
            maxLength={5000}
            value={value[key].join("\n")}
            placeholder={
              i === 0
                ? "Somente o que foi declarado; uma entrada por linha."
                : "Uma teoria não se torna verdade."
            }
            onChange={(e) =>
              setValue({ ...value, [key]: e.target.value.split("\n") })
            }
          />
        </div>
      ))}
      <div className="field">
        <label htmlFor="hook-question">3. O que ainda não sabe?</label>
        <textarea
          id="hook-question"
          rows={2}
          maxLength={5000}
          value={value.unansweredQuestion}
          onChange={(e) =>
            setValue({ ...value, unansweredQuestion: e.target.value })
          }
        />
      </div>
      <div className="field">
        <label htmlFor="hook-explore">
          4. Quer que o Mestre possa usar isso?
        </label>
        <select
          id="hook-explore"
          value={value.exploreInCampaign}
          onChange={(e) =>
            setValue({
              ...value,
              exploreInCampaign: e.target.value as Hook["exploreInCampaign"],
            })
          }
        >
          {["yes", "maybe", "no"].map((v) => (
            <option value={v} key={v}>
              {labels[v]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="hook-permission">
          5. Com quanta liberdade neste fio?
        </label>
        <select
          id="hook-permission"
          value={value.permission}
          onChange={(e) =>
            setValue({
              ...value,
              permission: e.target.value as Hook["permission"],
            })
          }
        >
          {["closed", "details", "explanation", "broad"].map((v) => (
            <option value={v} key={v}>
              {labels[v]}
            </option>
          ))}
        </select>
        <p className="field-help">
          Nenhuma opção permite contradizer fatos firmes ou limites. “Fechado”
          impede revelações ocultas. “Talvez” exige conversa antes de explorar.
        </p>
      </div>
      <div className="field">
        <label htmlFor="hook-constraints">
          6. O que não pode mudar ou acontecer?
        </label>
        <textarea
          id="hook-constraints"
          maxLength={5000}
          value={value.specificConstraints.join("\n")}
          onChange={(e) =>
            setValue({
              ...value,
              specificConstraints: e.target.value.split("\n"),
            })
          }
        />
      </div>
      <div className="field">
        <label htmlFor="hook-interest">7. Interesse neste fio</label>
        <select
          id="hook-interest"
          value={value.playerInterest}
          onChange={(e) =>
            setValue({
              ...value,
              playerInterest: e.target.value as Hook["playerInterest"],
            })
          }
        >
          {["low", "medium", "high"].map((v) => (
            <option value={v} key={v}>
              {labels[v]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="hook-date">Data do acontecimento, se souber</label>
        <input
          id="hook-date"
          type="date"
          max="1890-09-01"
          value={value.eventDate ?? ""}
          onChange={(e) =>
            setValue({ ...value, eventDate: e.target.value || undefined })
          }
        />
        <p className="field-help">
          Opcional. Se não houver data, a linha do tempo mostrará “época não
          definida”.
        </p>
      </div>
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" onClick={onCancel}>
          Cancelar oportunidade
        </button>
        <button
          className="button"
          onClick={() => {
            const parsed = hookSchema.safeParse({
              ...value,
              confirmedFacts: splitLines(value.confirmedFacts.join("\n")),
              characterBeliefs: splitLines(value.characterBeliefs.join("\n")),
              specificConstraints: splitLines(
                value.specificConstraints.join("\n"),
              ),
            });
            if (!parsed.success) {
              setError("Informe um título e confira a data, se preenchida.");
              return;
            }
            onSave(parsed.data);
          }}
        >
          Salvar oportunidade
        </button>
      </div>
    </section>
  );
}
export function HookCard({
  hook,
  onEdit,
  onDelete,
}: {
  hook: Hook;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className="hook-card">
      <h3>{hook.title}</h3>
      <p className="fine-print">
        {hook.sourceQuestionId} · {hook.kind} · {labels[hook.permission]} ·
        Explorar: {labels[hook.exploreInCampaign]}
      </p>
      <dl>
        <dt>Fatos confirmados pelo jogador</dt>
        <dd>{hook.confirmedFacts.join("\n") || "Não informado"}</dd>
        <dt>Crenças do personagem</dt>
        <dd>{hook.characterBeliefs.join("\n") || "Não informado"}</dd>
        <dt>Pergunta em aberto</dt>
        <dd>{hook.unansweredQuestion || "Não informado"}</dd>
        <dt>Restrições específicas</dt>
        <dd>{hook.specificConstraints.join("\n") || "Não informado"}</dd>
      </dl>
      {onEdit && (
        <button className="button secondary" onClick={onEdit}>
          Editar {hook.title}
        </button>
      )}
      {onDelete && (
        <button className="text-button" onClick={onDelete}>
          Excluir {hook.title}
        </button>
      )}
    </article>
  );
}
