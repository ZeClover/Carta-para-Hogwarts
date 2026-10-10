import { chapters, chapterIds, labels } from "@/content/chapters";
import { questions } from "@/content/admission";
import { type ImportedCharacter } from "@/lib/master";
import { HookCard } from "../narrative/HookEditor";
export function CharacterDetail({ record }: { record: ImportedCharacter }) {
  const d = record.data;
  return (
    <article className="character-detail">
      <h2>{d.character.fullName}</h2>
      <p className="fine-print">
        Revisão {d.revision} · Importado em{" "}
        {new Date(record.importedAt).toLocaleDateString("pt-BR")} · ID{" "}
        {d.character.id}
      </p>
      <dl className="review-list">
        <div>
          <dt>Família declarada</dt>
          <dd>{d.character.family.displayName || "Não definida"}</dd>
        </div>
        <div>
          <dt>Notas do ramo</dt>
          <dd>{d.character.family.branchNotes || "Não informado"}</dd>
        </div>
        <div>
          <dt>Familiaridade com o mundo mágico</dt>
          <dd>{labels[d.character.worldFamiliarity]}</dd>
        </div>
        <div>
          <dt>Ambição declarada</dt>
          <dd>{String(d.answers.VI01?.value ?? "Não informada")}</dd>
        </div>
        <div>
          <dt>Medo declarado</dt>
          <dd>
            {d.answers.VI04?.status === "prefer_not_to_answer"
              ? "Prefere não responder"
              : [d.answers.VI04?.value, d.answers.VI04?.explanation]
                  .filter(Boolean)
                  .join(" — ") || "Não informado"}
          </dd>
        </div>
      </dl>
      {chapterIds.map((ch) => (
        <details key={ch}>
          <summary>
            {ch} · {chapters[ch].title} — respostas originais
          </summary>
          <dl className="review-list">
            {(ch === "I" ? questions : chapters[ch].questions).map((q) => {
              const a = d.answers[q.id];
              let val = a?.value;
              if (Array.isArray(val))
                val = val
                  .map(
                    (id) =>
                      d.relationships.find((r) => r.id === id)?.name ??
                      d.objects?.find((o) => o.id === id)?.name ??
                      id,
                  )
                  .join(", ");
              return (
                <div key={q.id}>
                  <dt>
                    {q.id} · {q.label}
                  </dt>
                  <dd>
                    {a
                      ? a.status === "answered"
                        ? String(val) || "Em branco"
                        : (labels[a.status] ?? a.status)
                      : "Não informado"}
                    {a?.status === "answered" && a.explanation && (
                      <p>{a.explanation}</p>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </details>
      ))}
      <h3>Pessoas declaradas</h3>
      {d.relationships.map((r) => (
        <details key={r.id}>
          <summary>
            {r.name} · {r.role} · {r.relationshipLevel}
          </summary>
          <dl className="review-list">
            <div>
              <dt>Fatos</dt>
              <dd>{r.knownFacts.join("\n") || "Não informado"}</dd>
            </div>
            <div>
              <dt>Crenças</dt>
              <dd>{r.characterBeliefs.join("\n") || "Não informado"}</dd>
            </div>
            <div>
              <dt>Perguntas</dt>
              <dd>{r.openQuestions.join("\n") || "Não informado"}</dd>
            </div>
            <div>
              <dt>História e notas do jogador</dt>
              <dd>{r.notes || "Não informado"}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>{r.status ?? "Não declarada"}</dd>
            </div>
          </dl>
        </details>
      ))}
      <h3>Oportunidades declaradas</h3>
      {d.narrativeHooks.map((h) => (
        <HookCard key={h.id} hook={h} />
      ))}
      <details>
        <summary>JSON original preservado</summary>
        <pre className="json-view">{record.raw}</pre>
      </details>
    </article>
  );
}
