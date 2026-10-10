"use client";
import { useState } from "react";
import { planSchema, type Plan, type ImportedCharacter } from "@/lib/master";
export const planLabels: Record<string, string> = {
  ideia: "Ideia",
  em_desenvolvimento: "Em desenvolvimento",
  confirmado: "Confirmado",
  introduzido: "Introduzido",
  resolvido: "Resolvido",
};
export function PlanEditor({
  initial,
  characters,
  onSave,
  onCancel,
}: {
  initial?: Plan;
  characters: ImportedCharacter[];
  onSave: (p: Plan) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Plan>(
    initial ?? {
      id: crypto.randomUUID(),
      title: "",
      type: "nota",
      body: "",
      status: "ideia",
      characterIds: [],
      hookIds: [],
      updatedAt: new Date().toISOString(),
    },
  );
  const [error, setError] = useState("");
  return (
    <fieldset className="entity-editor">
      <legend>Anotação privada do Mestre</legend>
      <p className="fine-print">
        Este registro é separado do JSON do jogador. “Confirmado” aqui é um
        status do planejamento, não uma alteração de fatos importados.
      </p>
      <div className="field">
        <label htmlFor="plan-title">Título da anotação *</label>
        <input
          id="plan-title"
          value={value.title}
          maxLength={200}
          onChange={(e) => setValue({ ...value, title: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="plan-type">Tipo de anotação</label>
        <select
          id="plan-type"
          value={value.type}
          onChange={(e) =>
            setValue({ ...value, type: e.target.value as Plan["type"] })
          }
        >
          <option value="nota">Nota</option>
          <option value="hipotese">Hipótese</option>
          <option value="npc">NPC proposto</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="plan-body">Conteúdo privado</label>
        <textarea
          id="plan-body"
          maxLength={5000}
          rows={5}
          value={value.body}
          onChange={(e) => setValue({ ...value, body: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="plan-status">Status do planejamento</label>
        <select
          id="plan-status"
          value={value.status}
          onChange={(e) =>
            setValue({ ...value, status: e.target.value as Plan["status"] })
          }
        >
          {Object.entries(planLabels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="choice-grid">
        <legend>Vincular personagens</legend>
        {characters.map((c) => (
          <label key={c.data.character.id}>
            <input
              type="checkbox"
              checked={value.characterIds.includes(c.data.character.id)}
              onChange={(e) =>
                setValue({
                  ...value,
                  characterIds: e.target.checked
                    ? [...value.characterIds, c.data.character.id]
                    : value.characterIds.filter(
                        (id) => id !== c.data.character.id,
                      ),
                })
              }
            />
            {c.data.character.fullName}
          </label>
        ))}
      </fieldset>
      <fieldset className="choice-grid">
        <legend>Vincular oportunidades</legend>
        {characters.flatMap((c) =>
          c.data.narrativeHooks.map((h) => (
            <label key={`${c.data.character.id}:${h.id}`}>
              <input
                type="checkbox"
                checked={value.hookIds.includes(
                  `${c.data.character.id}:${h.id}`,
                )}
                onChange={(e) =>
                  setValue({
                    ...value,
                    hookIds: e.target.checked
                      ? [...value.hookIds, `${c.data.character.id}:${h.id}`]
                      : value.hookIds.filter(
                          (id) => id !== `${c.data.character.id}:${h.id}`,
                        ),
                  })
                }
              />
              {c.data.character.fullName}: {h.title}
            </label>
          )),
        )}
      </fieldset>
      {error && (
        <p role="alert" className="warning">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button secondary" onClick={onCancel}>
          Cancelar anotação
        </button>
        <button
          className="button"
          onClick={() => {
            const parsed = planSchema.safeParse({
              ...value,
              updatedAt: new Date().toISOString(),
            });
            if (!parsed.success) {
              setError("Informe um título.");
              return;
            }
            onSave(parsed.data);
          }}
        >
          Salvar anotação
        </button>
      </div>
    </fieldset>
  );
}
