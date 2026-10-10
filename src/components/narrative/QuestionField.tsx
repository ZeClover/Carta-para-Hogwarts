"use client";
import { labels, type Question } from "@/content/chapters";
import { type Answer, type Relation, type StoryObject } from "@/lib/story";
import { RelationCollection, ObjectCollection } from "./Entities";
export function QuestionField({
  question,
  answer,
  onChange,
  relations,
  objects,
  onSaveRelation,
  onSaveObject,
  onOpen,
  error,
}: {
  question: Question;
  answer?: Answer;
  onChange: (a: Answer) => void;
  relations: Relation[];
  objects: StoryObject[];
  onSaveRelation: (r: Relation) => string;
  onSaveObject: (o: StoryObject) => string;
  onOpen: () => void;
  error?: string;
}) {
  const a = answer ?? {
    value:
      question.type === "multi" ||
      question.type === "relations" ||
      question.type === "objects"
        ? []
        : "",
    status: "answered",
  };
  const q = question;
  const update = (value: string | string[]) =>
    onChange({ ...a, status: "answered", value });
  const string = typeof a.value === "string" ? a.value : "";
  const array = Array.isArray(a.value) ? a.value : [];
  const explainHidden = q.conditionalExplanation && a.value === "nao";
  return (
    <section className="question-block" aria-labelledby={`${q.id}-title`}>
      <h2 id={`${q.id}-title`}>
        <span className="question-id">{q.id}</span> {q.label}
        {q.required ? (
          " *"
        ) : (
          <small>{q.recommended ? " Recomendado" : " Opcional"}</small>
        )}
      </h2>
      <p className="field-help" id={`${q.id}-help`}>
        {q.help}
      </p>
      {!q.required && (
        <div className="answer-status">
          <label htmlFor={`${q.id}-status`}>Como deseja responder?</label>
          <select
            id={`${q.id}-status`}
            value={a.status}
            onChange={(e) =>
              onChange({ ...a, status: e.target.value as Answer["status"] })
            }
          >
            {[
              "answered",
              "skipped",
              "unknown",
              "prefer_not_to_answer",
              "not_applicable",
            ].map((v) => (
              <option key={v} value={v}>
                {labels[v]}
              </option>
            ))}
          </select>
        </div>
      )}
      {a.status !== "answered" && (
        <p className="fine-print">
          {labels[a.status]}.{" "}
          {(string || array.length || a.explanation) &&
            "Seu texto permanece no rascunho, mas não será incluído na exportação enquanto esta opção estiver selecionada."}
        </p>
      )}
      {a.status === "answered" && (
        <div className="field">
          {(q.type === "long" || q.type === "text" || q.type === "opening") && (
            <>
              <label className="sr-only" htmlFor={q.id}>
                {q.label}
              </label>
              {q.type === "text" ? (
                <input
                  id={q.id}
                  value={string}
                  maxLength={5000}
                  onChange={(e) => update(e.target.value)}
                  aria-describedby={`${q.id}-help`}
                />
              ) : (
                <textarea
                  id={q.id}
                  rows={4}
                  value={string}
                  maxLength={5000}
                  placeholder={
                    q.example ??
                    "Escreva no seu ritmo. Você decide quanto contar."
                  }
                  onChange={(e) => update(e.target.value)}
                  aria-describedby={`${q.id}-help`}
                />
              )}
            </>
          )}
          {q.type === "single" && (
            <>
              <label className="sr-only" htmlFor={q.id}>
                {q.label}
              </label>
              <select
                id={q.id}
                value={string}
                required={q.required}
                aria-invalid={!!error}
                aria-describedby={`${q.id}-help ${error ? `${q.id}-error` : ""}`}
                onChange={(e) => update(e.target.value)}
              >
                <option value="">Escolha uma opção</option>
                {q.choices?.map((v) => (
                  <option key={v} value={v}>
                    {labels[v] ?? v}
                  </option>
                ))}
              </select>
            </>
          )}
          {q.type === "multi" && (
            <fieldset className="choice-grid">
              <legend className="sr-only">{q.label}</legend>
              {q.choices?.map((v) => (
                <label key={v}>
                  <input
                    type="checkbox"
                    checked={array.includes(v)}
                    onChange={(e) =>
                      update(
                        e.target.checked
                          ? [...array, v]
                          : array.filter((item) => item !== v),
                      )
                    }
                  />
                  {labels[v] ?? v}
                </label>
              ))}
            </fieldset>
          )}
          {q.type === "relations" && (
            <RelationCollection
              relations={relations}
              selected={array}
              onSelect={update}
              onSave={onSaveRelation}
            />
          )}{" "}
          {q.type === "objects" && (
            <ObjectCollection
              objects={objects}
              selected={array}
              onSelect={update}
              onSave={onSaveObject}
            />
          )}{" "}
          {q.explain && !explainHidden && (
            <div className="field">
              <label htmlFor={`${q.id}-explanation`}>
                Conte mais sobre sua resposta
              </label>
              <textarea
                id={`${q.id}-explanation`}
                maxLength={5000}
                rows={3}
                value={a.explanation ?? ""}
                onChange={(e) =>
                  onChange({ ...a, explanation: e.target.value })
                }
              />
            </div>
          )}
          {explainHidden && a.explanation && (
            <p className="warning">
              A explicação anterior foi guardada no rascunho. Ela não será
              exportada enquanto a resposta for “Não”.
            </p>
          )}
        </div>
      )}
      {error && (
        <p role="alert" id={`${q.id}-error`} className="field-error">
          {error}
        </p>
      )}
      <button className="text-button" onClick={onOpen}>
        Quero deixar algo em aberto — {q.id}
      </button>
    </section>
  );
}
