"use client";
import { families } from "@/content/families";
import { type Answer, type Story } from "@/lib/story";
export function FamilySelector({
  family,
  applies,
  onChange,
  onApply,
}: {
  family: Story["family"];
  applies?: Answer;
  onChange: (f: Story["family"]) => void;
  onApply: (a: Answer) => void;
}) {
  const current = families.find((f) => f.id === family.catalogId);
  return (
    <section className="question-block">
      <h2>
        <span className="question-id">II00</span> Família ou linhagem
      </h2>
      <p className="field-help">
        Sua família não determina quem o criou, seu status de sangue, sua Casa
        ou seus talentos. Escolha uma referência, crie outra família ou deixe
        sem definir.
      </p>
      <div className="field">
        <label htmlFor="family">Família / linhagem</label>
        <select
          id="family"
          value={family.catalogId}
          onChange={(e) => {
            const next = families.find((f) => f.id === e.target.value);
            onChange({
              ...family,
              catalogId: e.target.value,
              displayName:
                next?.tipo === "original"
                  ? family.customName
                  : (next?.nome ?? ""),
            });
          }}
        >
          <option value="">Ainda não defini</option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </select>
      </div>
      {current && (
        <article className="family-card">
          <p className="eyebrow">
            {current.origemDaInformacao === "campanha"
              ? "Contexto desta campanha"
              : current.origemDaInformacao === "canon"
                ? "Referência do universo"
                : "Possibilidade para definir"}
          </p>
          <h3>{current.nome}</h3>
          <p>{current.introPublica}</p>
          <p className="fine-print">{current.contexto}</p>
          <ul>
            {current.perguntasContextuais.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          {current.tipo === "conhecida" && (
            <div className="field">
              <label htmlFor="family-applies">
                Essas tendências se aplicam ao seu ramo?
              </label>
              <select
                id="family-applies"
                value={
                  applies?.status === "answered" &&
                  typeof applies.value === "string"
                    ? applies.value
                    : ""
                }
                onChange={(e) =>
                  onApply({
                    value: e.target.value,
                    status: e.target.value ? "answered" : "unknown",
                  })
                }
              >
                <option value="">Não definido</option>
                <option>Sim</option>
                <option>Em parte</option>
                <option>Não</option>
                <option>Não sei</option>
              </select>
            </div>
          )}
        </article>
      )}
      {current?.tipo === "original" && (
        <>
          <div className="field">
            <label htmlFor="family-custom">Nome da família original</label>
            <input
              id="family-custom"
              value={family.customName}
              maxLength={200}
              onChange={(e) =>
                onChange({
                  ...family,
                  customName: e.target.value,
                  displayName: e.target.value,
                })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="family-context">
              Cultura, atividade e reputação da família
            </label>
            <textarea
              id="family-context"
              maxLength={5000}
              value={family.customContext}
              onChange={(e) =>
                onChange({ ...family, customContext: e.target.value })
              }
            />
          </div>
        </>
      )}
      {current?.tipo === "desconhecida" && (
        <p className="warning">
          Quem o criou é uma pergunta separada logo abaixo. Você pode ter
          responsáveis conhecidos e próximos.
        </p>
      )}
      {current?.tipo !== "original" &&
        (family.customName || family.customContext) && (
          <p className="fine-print">
            A família original anterior está preservada no rascunho; nome e
            contexto não serão exportados para a opção atual.
          </p>
        )}
      <div className="field">
        <label htmlFor="family-branch">
          Como isso se aplica à sua história?
        </label>
        <textarea
          id="family-branch"
          maxLength={5000}
          value={family.branchNotes}
          onChange={(e) => onChange({ ...family, branchNotes: e.target.value })}
        />
      </div>
    </section>
  );
}
