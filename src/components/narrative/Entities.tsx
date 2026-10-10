"use client";
import { useState } from "react";
import { splitLines, type Relation, type StoryObject } from "@/lib/story";
const proximity = {
  desconhecido: "Desconhecido",
  conhecido: "Conhecido",
  proximo: "Próximo",
  confidente: "Confidente",
  vinculo: "Vínculo profundo",
};
export function RelationEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Relation;
  onSave: (r: Relation) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<Relation>(
    initial ?? {
      id: crypto.randomUUID(),
      name: "",
      role: "familiar",
      relationshipLevel: "conhecido",
      qualifiers: [],
      knownFacts: [],
      characterBeliefs: [],
      openQuestions: [],
      canReappear: "maybe",
      notes: "",
    },
  );
  const [error, setError] = useState("");
  return (
    <fieldset className="entity-editor">
      <legend>{initial ? "Editar pessoa" : "Nova pessoa"}</legend>
      <div className="field">
        <label htmlFor={`name-${value.id}`}>Nome da pessoa *</label>
        <input
          id={`name-${value.id}`}
          value={value.name}
          maxLength={200}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor={`role-${value.id}`}>Papel na sua história</label>
        <select
          id={`role-${value.id}`}
          value={value.role}
          onChange={(e) => setValue({ ...value, role: e.target.value })}
        >
          {["familiar", "responsável", "amigo", "rival", "mentor", "outro"].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`level-${value.id}`}>Proximidade</label>
        <select
          id={`level-${value.id}`}
          value={value.relationshipLevel}
          onChange={(e) =>
            setValue({
              ...value,
              relationshipLevel: e.target
                .value as Relation["relationshipLevel"],
            })
          }
        >
          {Object.entries(proximity).map(([v, label]) => (
            <option value={v} key={v}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`life-${value.id}`}>Situação conhecida</label>
        <select
          id={`life-${value.id}`}
          value={value.status ?? ""}
          onChange={(e) =>
            setValue({
              ...value,
              status: e.target.value
                ? (e.target.value as Relation["status"])
                : undefined,
            })
          }
        >
          <option value="">Não declarado</option>
          <option value="vivo">Vivo</option>
          <option value="morto">Morto</option>
          <option value="desconhecido">Situação desconhecida</option>
        </select>
      </div>
      {(
        [
          "knownFacts",
          "characterBeliefs",
          "openQuestions",
          "qualifiers",
        ] as const
      ).map((key, i) => (
        <div className="field" key={key}>
          <label htmlFor={`${key}-${value.id}`}>
            {
              [
                "Fatos conhecidos",
                "Crenças do personagem",
                "Perguntas em aberto",
                "Qualificadores da relação",
              ][i]
            }
          </label>
          <p className="field-help">
            {key === "qualifiers"
              ? "Ex.: complexa, afetuosa. Isso não substitui a proximidade."
              : "Uma entrada por linha. Não transforme crenças em fatos."}
          </p>
          <textarea
            id={`${key}-${value.id}`}
            rows={2}
            maxLength={5000}
            value={value[key].join("\n")}
            onChange={(e) =>
              setValue({ ...value, [key]: e.target.value.split("\n") })
            }
          />
        </div>
      ))}
      <div className="field">
        <label htmlFor={`reappear-${value.id}`}>
          Pode reaparecer na campanha?
        </label>
        <select
          id={`reappear-${value.id}`}
          value={value.canReappear}
          onChange={(e) =>
            setValue({
              ...value,
              canReappear: e.target.value as Relation["canReappear"],
            })
          }
        >
          <option value="yes">Sim</option>
          <option value="maybe">Talvez, conversar antes</option>
          <option value="no">Não</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor={`notes-${value.id}`}>
          História, convivência e observações
        </label>
        <textarea
          id={`notes-${value.id}`}
          rows={3}
          maxLength={5000}
          value={value.notes}
          onChange={(e) => setValue({ ...value, notes: e.target.value })}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="form-actions">
        <button className="button secondary" onClick={onCancel}>
          Cancelar pessoa
        </button>
        <button
          className="button"
          onClick={() => {
            if (!value.name.trim()) {
              setError("Informe o nome da pessoa.");
              return;
            }
            onSave({
              ...value,
              name: value.name.trim(),
              knownFacts: splitLines(value.knownFacts.join("\n")),
              characterBeliefs: splitLines(value.characterBeliefs.join("\n")),
              openQuestions: splitLines(value.openQuestions.join("\n")),
              qualifiers: splitLines(value.qualifiers.join("\n")),
            });
          }}
        >
          Salvar pessoa
        </button>
      </div>
    </fieldset>
  );
}
export function RelationCollection({
  relations,
  selected,
  onSelect,
  onSave,
}: {
  relations: Relation[];
  selected: string[];
  onSelect: (ids: string[]) => void;
  onSave: (r: Relation) => string;
}) {
  const [editing, setEditing] = useState<Relation | "new" | null>(null);
  const [message, setMessage] = useState("");
  return (
    <div className="collection">
      <p className="fine-print">
        Reutilize a mesma pessoa ou objeto entre perguntas. Os registros
        cadastrados ficam na ficha; você pode removê-los na revisão final.
      </p>
      {relations.length === 0 && (
        <p className="fine-print">
          Nenhuma pessoa cadastrada. Adicione alguém, ou deixe a resposta em
          branco.
        </p>
      )}
      {relations.map((r) => (
        <div key={r.id} className="entity-row">
          <label>
            <input
              type="checkbox"
              checked={selected.includes(r.id)}
              onChange={(e) =>
                onSelect(
                  e.target.checked
                    ? [...selected, r.id]
                    : selected.filter((id) => id !== r.id),
                )
              }
            />
            {r.name}
            <small>
              {r.role} · {proximity[r.relationshipLevel]}
            </small>
          </label>
          <button
            className="text-button"
            aria-label={`Editar pessoa ${r.name}`}
            onClick={() => setEditing(r)}
          >
            Editar
          </button>
        </div>
      ))}
      <button className="button secondary" onClick={() => setEditing("new")}>
        Adicionar pessoa
      </button>
      {message && (
        <p role="status" className="fine-print">
          {message}
        </p>
      )}
      {editing && (
        <RelationEditor
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSave={(r) => {
            const id = onSave(r);
            onSelect(Array.from(new Set([...selected, id])));
            if (id !== r.id)
              setMessage(
                "Pessoa já cadastrada: a referência existente foi reutilizada.",
              );
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
export function ObjectCollection({
  objects,
  selected,
  onSelect,
  onSave,
}: {
  objects: StoryObject[];
  selected: string[];
  onSelect: (ids: string[]) => void;
  onSave: (o: StoryObject) => string;
}) {
  const [editing, setEditing] = useState<StoryObject | null>(null);
  const [error, setError] = useState("");
  return (
    <div className="collection">
      <p className="fine-print">
        Reutilize a mesma pessoa ou objeto entre perguntas. Os registros
        cadastrados ficam na ficha; você pode removê-los na revisão final.
      </p>
      {objects.map((o) => (
        <div className="entity-row" key={o.id}>
          <label>
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={(e) =>
                onSelect(
                  e.target.checked
                    ? [...selected, o.id]
                    : selected.filter((v) => v !== o.id),
                )
              }
            />
            {o.name}
            <small>{o.kind}</small>
          </label>
          <button
            className="text-button"
            aria-label={`Editar objeto ${o.name}`}
            onClick={() => setEditing(o)}
          >
            Editar
          </button>
        </div>
      ))}
      <button
        className="button secondary"
        onClick={() =>
          setEditing({
            id: crypto.randomUUID(),
            name: "",
            kind: "objeto",
            meaning: "",
          })
        }
      >
        Adicionar objeto ou lugar
      </button>
      {editing && (
        <fieldset className="entity-editor">
          <legend>Objeto ou lugar afetivo</legend>
          <div className="field">
            <label htmlFor={`object-${editing.id}`}>
              Nome do objeto ou lugar *
            </label>
            <input
              id={`object-${editing.id}`}
              value={editing.name}
              maxLength={200}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor={`kind-${editing.id}`}>Tipo</label>
            <select
              id={`kind-${editing.id}`}
              value={editing.kind}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  kind: e.target.value as StoryObject["kind"],
                })
              }
            >
              <option value="objeto">Objeto</option>
              <option value="lugar">Lugar</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`meaning-${editing.id}`}>Significado afetivo</label>
            <textarea
              id={`meaning-${editing.id}`}
              value={editing.meaning}
              maxLength={5000}
              onChange={(e) =>
                setEditing({ ...editing, meaning: e.target.value })
              }
            />
          </div>
          {error && <p role="alert">{error}</p>}
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar objeto
            </button>
            <button
              className="button"
              onClick={() => {
                if (!editing.name.trim()) {
                  setError("Informe um nome.");
                  return;
                }
                const id = onSave({ ...editing, name: editing.name.trim() });
                onSelect(Array.from(new Set([...selected, id])));
                setEditing(null);
                setError("");
              }}
            >
              Salvar objeto
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}
