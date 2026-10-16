"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authorized, downloadJSON, parseCharacter } from "@/lib/story";
import {
  emptyMaster,
  masterSchema,
  parseMasterBackup,
  possibleConnections,
  summarize,
  timeline,
  type ImportedCharacter,
  type MasterState,
  type Plan,
} from "@/lib/master";
import { masterStore } from "@/lib/local-store";
import { chapterIds, labels } from "@/content/chapters";
import { CharacterDetail } from "./CharacterDetail";
import { PlanEditor, planLabels } from "./PlanEditor";
import { HookCard } from "../narrative/HookEditor";
let recoverySession: {
  state: MasterState;
  dirty: boolean;
  failed: boolean;
} | null = null;
let recoveryVersion = 0;
const areas = [
  "Visão geral",
  "Personagens",
  "Pontas abertas",
  "Relações",
  "Linha do tempo",
  "Possíveis conexões",
  "Planejamento",
  "Limites",
];
type ImportMessage = { name: string; message: string; error?: boolean };
export function Master() {
  const [state, setState] = useState<MasterState | null>(null);
  const latest = useRef<MasterState | null>(null);
  const [area, setArea] = useState(0);
  const [status, setStatus] = useState("Carregando o arquivo local…");
  const [storageError, setStorageError] = useState(false);
  const [recoveryError, setRecoveryError] = useState(false);
  const recoveryBlocked = useRef(false);
  const [messages, setMessages] = useState<ImportMessage[]>([]);
  const [pending, setPending] = useState<ImportedCharacter[]>([]);
  const [search, setSearch] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState({
    character: "",
    kind: "",
    permission: "",
    interest: "",
    source: "",
  });
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const [limits, setLimits] = useState(false);
  const [working, setWorking] = useState(false);
  const dirty = useRef(recoverySession?.dirty ?? false);
  useEffect(() => {
    let active = true;
    (recoverySession
      ? Promise.resolve(recoverySession.state)
      : masterStore.read("archive")
    )
      .then((value) => {
        if (!active) return;
        const s =
          value === undefined ? emptyMaster() : masterSchema.parse(value);
        latest.current = s;
        setState(s);
        setStorageError(recoverySession?.failed ?? false);
        setStatus(
          value
            ? "Arquivo recuperado deste navegador."
            : "Arquivo vazio neste navegador.",
        );
      })
      .catch(() => {
        if (!active) return;
        recoveryBlocked.current = true;
        setRecoveryError(true);
        const s = emptyMaster();
        latest.current = s;
        setState(s);
        setStorageError(true);
        setStatus(
          "Falha ao recuperar o arquivo. Os dados existentes não foram substituídos.",
        );
      });
    return () => {
      active = false;
    };
  }, []);
  const persist = useCallback(async () => {
    const s = latest.current;
    const version = recoveryVersion;
    if (!s || recoveryBlocked.current) return false;
    try {
      await masterStore.write("archive", masterSchema.parse(s));
      if (latest.current === s) {
        dirty.current = false;
        if (version === recoveryVersion)
          recoverySession = { state: s, dirty: false, failed: false };
        setStatus("Arquivo salvo neste navegador.");
        setStorageError(false);
      }
      return true;
    } catch {
      recoverySession = {
        state: recoverySession?.state ?? s,
        dirty: true,
        failed: true,
      };
      setStorageError(true);
      setStatus("Não foi possível salvar. Exporte um backup antes de sair.");
      return false;
    }
  }, []);
  function update(edit: (s: MasterState) => MasterState) {
    if (!latest.current || recoveryBlocked.current) return;
    const next = edit(latest.current);
    recoveryVersion += 1;
    latest.current = next;
    dirty.current = true;
    recoverySession = { state: next, dirty: true, failed: storageError };
    setState(next);
    setStatus("Salvando o arquivo…");
  }
  useEffect(
    () => () => {
      if (dirty.current && latest.current && !recoverySession?.failed)
        void persist();
    },
    [persist],
  );
  useEffect(() => {
    if (!state || !dirty.current || storageError) return;
    const timer = setTimeout(() => {
      void persist();
    }, 300);
    return () => clearTimeout(timer);
  }, [state, storageError, persist]);
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, []);
  async function importFiles(files: File[]) {
    if (!latest.current || working || recoveryBlocked.current) return;
    if (files.length > 200) {
      setMessages([
        {
          name: "Importação",
          message: "Selecione até 200 arquivos por vez.",
          error: true,
        },
      ]);
      return;
    }
    setWorking(true);
    const reports: ImportMessage[] = [];
    const conflicts: ImportedCharacter[] = [];
    for (const file of files) {
      try {
        if (
          !file.name.toLowerCase().endsWith(".json") ||
          file.size > 2_000_000 ||
          !["", "application/json", "text/plain"].includes(file.type)
        )
          throw new Error("Use um arquivo .json de até 2 MB.");
        const raw = await file.text();
        const data = parseCharacter(raw);
        const record = { data, raw, importedAt: new Date().toISOString() };
        const existing = latest.current.characters.find(
          (c) => c.data.character.id === data.character.id,
        );
        if (
          existing ||
          conflicts.some((c) => c.data.character.id === data.character.id)
        ) {
          conflicts.push(record);
          reports.push({
            name: file.name,
            message: "Mesmo ID: aguardando decisão de revisão.",
          });
        } else {
          if (latest.current.characters.length >= 200)
            throw new Error(
              "O arquivo suporta até 200 personagens. Preserve um backup antes de remover importações.",
            );
          const candidate = {
            ...latest.current,
            characters: [...latest.current.characters, record],
          };
          if (
            new TextEncoder().encode(JSON.stringify(candidate)).length >
            19_000_000
          )
            throw new Error(
              "O arquivo está próximo do limite de backup. Exporte uma cópia e libere espaço antes de importar.",
            );
          update((s) => ({ ...s, characters: [...s.characters, record] }));
          reports.push({
            name: file.name,
            message: `Importado: ${data.character.fullName}, revisão ${data.revision}.`,
          });
        }
      } catch (e) {
        reports.push({
          name: file.name,
          message: e instanceof Error ? e.message : "Arquivo inválido.",
          error: true,
        });
      }
    }
    setMessages(reports);
    setPending((previous) => [...previous, ...conflicts]);
    await persist();
    setWorking(false);
  }
  async function restoreBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 20_000_000 || !file.name.toLowerCase().endsWith(".json"))
        throw new Error("Escolha um backup JSON do Mestre de até 20 MB.");
      const restored = parseMasterBackup(await file.text());
      if (
        !window.confirm(
          "Restaurar este backup substituirá personagens, anotações e conexões atuais. Exporte uma cópia antes se desejar preservá-los.",
        )
      )
        return;
      // A normal save/retry must never overwrite an archive we could not read.
      // Only this explicitly confirmed, validated backup can replace it.
      recoveryBlocked.current = false;
      setRecoveryError(false);
      update(() => restored);
      setPending([]);
      setSelected("");
      setCompare([]);
      const saved = await persist();
      setMessages([
        {
          name: file.name,
          message: saved
            ? "Backup restaurado."
            : "Restaurado em memória. Exporte uma cópia antes de sair.",
        },
      ]);
    } catch (e) {
      setMessages([
        {
          name: file.name,
          message: e instanceof Error ? e.message : "Backup inválido.",
          error: true,
        },
      ]);
    }
  }
  if (recoveryError)
    return (
      <main id="conteudo" className="master-layout">
        <section className="paper master-paper">
          <h1>Recuperar Arquivo do Mestre</h1>
          <p role="alert">{status}</p>
          <p>
            Feche outras abas e tente recarregar. Importações e gravações ficam
            bloqueadas para preservar o arquivo que não conseguimos ler.
          </p>
          <button className="button" onClick={() => window.location.reload()}>
            Tentar recuperar arquivo
          </button>
          <div className="backup-tools">
            <label className="file-button">
              Restaurar backup do Mestre
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  void restoreBackup(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {messages.map((message, i) => (
              <p role="status" key={i}>
                {message.message}
              </p>
            ))}
          </div>
        </section>
      </main>
    );
  if (!state)
    return (
      <p className="paper" role="status">
        Carregando o arquivo local…
      </p>
    );
  const totals = summarize(state);
  const records = state.characters.filter((c) =>
    [
      c.data.character.fullName,
      c.data.character.family.displayName,
      c.data.character.birthPlace,
      c.data.character.residence,
      ...c.data.relationships.map((r) => r.name),
    ]
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  const selectedRecord = state.characters.find(
    (c) => c.data.character.id === selected,
  );
  const connections = possibleConnections(state.characters.map((c) => c.data));
  const hooks = state.characters
    .flatMap((c) =>
      c.data.narrativeHooks.map((h) => ({
        character: c.data.character,
        hook: h,
      })),
    )
    .filter(
      ({ character, hook: h }) =>
        (!filter.character || character.id === filter.character) &&
        (!filter.kind || h.kind === filter.kind) &&
        (!filter.permission || h.permission === filter.permission) &&
        (!filter.interest || h.playerInterest === filter.interest) &&
        (!filter.source ||
          h.sourceQuestionId.replace(/[-\d].*$/, "") === filter.source),
    );
  const currentConflict = pending[0];
  const previousConflict = currentConflict
    ? state.characters.find(
        (c) => c.data.character.id === currentConflict.data.character.id,
      )
    : undefined;
  return (
    <main id="conteudo" className="master-layout">
      <section className="master-heading">
        <p className="eyebrow">Arquivo privado no seu dispositivo</p>
        <h1>Arquivo do Mestre</h1>
        <p>
          A Vercel hospeda o código e não recebe estes JSONs no MVP. As
          importações e notas ficam neste navegador. Outro computador exige
          backup/restauração.
        </p>
        <p className="fine-print">
          Esta rota não tem autenticação e não oferece proteção por PIN. Quem
          usar este mesmo perfil do navegador poderá acessar os dados locais.
          Sem importações, ela fica vazia.
        </p>
      </section>
      <section className="paper master-paper">
        <p role="status" className="save-status">
          {status}
        </p>
        {storageError && (
          <div className="warning" role="alert">
            Não substitua dados antigos sem preservar suas cópias. Exporte um
            backup dos dados em memória.
            <button className="button secondary" onClick={() => void persist()}>
              Tentar salvar arquivo
            </button>
          </div>
        )}
        <section
          className="import-zone"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            void importFiles(Array.from(e.dataTransfer.files));
          }}
          aria-label="Importação de personagens"
        >
          <h2>Importar personagens</h2>
          <p className="fine-print">
            Arraste vários JSONs aqui ou use o seletor. Arquivos inválidos são
            rejeitados individualmente.
          </p>
          <label className="file-button">
            Selecionar JSONs
            <input
              disabled={working}
              type="file"
              multiple
              accept=".json,application/json"
              onChange={(e) => {
                void importFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </label>
          <button
            className="button secondary"
            onClick={() =>
              downloadJSON(state, "hogwarts-1890-backup-mestre.json")
            }
          >
            Exportar backup do Mestre
          </button>
          <label className="file-button">
            Restaurar backup do Mestre
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                void restoreBackup(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          {messages.length > 0 && (
            <ul className="import-reports" aria-live="polite">
              {messages.map((m, i) => (
                <li key={i} className={m.error ? "field-error" : ""}>
                  <strong>{m.name}:</strong> {m.message}
                </li>
              ))}
            </ul>
          )}
        </section>
        {currentConflict && (
          <section className="warning" aria-label="Conflito de revisão">
            <h3>Mesmo personagem: {currentConflict.data.character.fullName}</h3>
            <p>
              Revisão atual:{" "}
              {previousConflict?.data.revision ?? "não importada"} · Recebida:{" "}
              {currentConflict.data.revision}
            </p>
            {previousConflict &&
              currentConflict.data.revision <=
                previousConflict.data.revision && (
                <p>
                  A revisão recebida não é mais recente. Só substitua se tiver
                  certeza.
                </p>
              )}
            <button
              className="button"
              onClick={() => {
                update((s) => ({
                  ...s,
                  characters: [
                    ...s.characters.filter(
                      (c) =>
                        c.data.character.id !==
                        currentConflict.data.character.id,
                    ),
                    currentConflict,
                  ],
                }));
                setPending((p) => p.slice(1));
              }}
            >
              Substituir revisão
            </button>
            <button
              className="button secondary"
              onClick={() => setPending((p) => p.slice(1))}
            >
              Manter anterior
            </button>
            <button className="text-button" onClick={() => setPending([])}>
              Cancelar importações pendentes
            </button>
          </section>
        )}
        <nav className="master-tabs" aria-label="Áreas do Arquivo do Mestre">
          {areas.map((name, i) => (
            <button
              key={name}
              className={area === i ? "active" : ""}
              aria-current={area === i ? "page" : undefined}
              onClick={() => {
                setArea(i);
                setLimits(false);
              }}
            >
              {name}
            </button>
          ))}
        </nav>
        <section className="master-area" aria-label={areas[area]}>
          <h2>{areas[area]}</h2>
          {state.characters.length === 0 && (
            <p className="empty-state">
              Nenhum personagem importado. Importe fichas JSON para começar. O
              aplicativo não inclui fichas privadas de exemplo.
            </p>
          )}
          {area === 0 && (
            <>
              <div className="stats-grid">
                {[
                  ["Personagens", totals.characters],
                  ["Relações declaradas", totals.relations],
                  ["Lacunas autorizadas", totals.hooks],
                  ["Ideias em planejamento", totals.proposals],
                ].map(([label, value]) => (
                  <div key={String(label)}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <h3>Temas de interesse declarados</h3>
              <ul>
                {[
                  ...new Set(
                    state.characters.flatMap((c) => c.data.preferences.themes),
                  ),
                ].map((theme) => (
                  <li key={theme}>
                    {theme.replaceAll("_", " ")}:{" "}
                    {
                      state.characters.filter((c) =>
                        c.data.preferences.themes.includes(theme),
                      ).length
                    }
                  </li>
                ))}
              </ul>
              <p className="fine-print">
                Lacunas autorizadas têm exploração “Sim” e permissão diferente
                de “Fechado”. “Talvez” exige conversa. As ideias do planejamento
                são propostas do Mestre.
              </p>
            </>
          )}
          {area === 1 && (
            <>
              <div className="field">
                <label htmlFor="master-search">
                  Buscar personagens, famílias, locais ou pessoas
                </label>
                <input
                  id="master-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="character-cards">
                {records.map((c) => (
                  <article className="character-card" key={c.data.character.id}>
                    <h3>{c.data.character.fullName}</h3>
                    <p>
                      {c.data.character.family.displayName ||
                        "Família não definida"}{" "}
                      · Revisão {c.data.revision}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setSelected(c.data.character.id)}
                    >
                      Abrir ficha de {c.data.character.fullName}
                    </button>
                    <label className="check-line">
                      <input
                        type="checkbox"
                        checked={compare.includes(c.data.character.id)}
                        onChange={(e) =>
                          setCompare(
                            e.target.checked
                              ? [...compare, c.data.character.id].slice(-2)
                              : compare.filter(
                                  (id) => id !== c.data.character.id,
                                ),
                          )
                        }
                      />
                      Comparar {c.data.character.fullName}
                    </label>
                    <button
                      className="text-button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remover esta importação? O arquivo original não será alterado.",
                          )
                        ) {
                          update((s) => ({
                            ...s,
                            characters: s.characters.filter(
                              (v) =>
                                v.data.character.id !== c.data.character.id,
                            ),
                          }));
                          if (selected === c.data.character.id) setSelected("");
                          setCompare((ids) =>
                            ids.filter((id) => id !== c.data.character.id),
                          );
                        }
                      }}
                    >
                      Remover importação
                    </button>
                  </article>
                ))}
              </div>
              {records.length === 0 && state.characters.length > 0 && (
                <p>Nenhum resultado para a busca.</p>
              )}
              {compare.length === 2 && (
                <section
                  className="compare-grid"
                  aria-label="Comparação de personagens"
                >
                  {compare.map((id) => {
                    const record = state.characters.find(
                      (c) => c.data.character.id === id,
                    );
                    return record ? (
                      <CharacterDetail key={id} record={record} />
                    ) : null;
                  })}
                </section>
              )}
              {selectedRecord && <CharacterDetail record={selectedRecord} />}
            </>
          )}
          {area === 2 && (
            <>
              <div className="filter-grid">
                {(
                  [
                    [
                      "character",
                      "Personagem",
                      state.characters.map((c) => [
                        c.data.character.id,
                        c.data.character.fullName,
                      ]),
                    ],
                    [
                      "kind",
                      "Tipo",
                      [
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
                      ].map((v) => [v, v]),
                    ],
                    [
                      "permission",
                      "Permissão",
                      ["closed", "details", "explanation", "broad"].map((v) => [
                        v,
                        labels[v],
                      ]),
                    ],
                    [
                      "interest",
                      "Interesse",
                      ["low", "medium", "high"].map((v) => [v, labels[v]]),
                    ],
                    [
                      "source",
                      "Capítulo de origem",
                      chapterIds.map((v) => [v, v]),
                    ],
                  ] as [keyof typeof filter, string, string[][]][]
                ).map(([key, label, options]) => (
                  <div className="field" key={key}>
                    <label htmlFor={`filter-${key}`}>{label}</label>
                    <select
                      id={`filter-${key}`}
                      value={filter[key]}
                      onChange={(e) =>
                        setFilter({ ...filter, [key]: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      {options.map(([v, l]) => (
                        <option value={v} key={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <p>{hooks.length} oportunidades encontradas.</p>
              {hooks.map(({ character, hook }) => (
                <section key={`${character.id}:${hook.id}`}>
                  <p className="eyebrow">
                    {character.fullName} ·{" "}
                    {authorized(hook)
                      ? "Autorizada"
                      : "Sem autorização para exploração livre"}
                  </p>
                  <HookCard hook={hook} />
                </section>
              ))}
            </>
          )}
          {area === 3 && (
            <div className="table-scroll">
              <table>
                <caption>
                  Relações declaradas pelos jogadores. Nomes iguais não provam
                  que se trata da mesma pessoa.
                </caption>
                <thead>
                  <tr>
                    <th>Pessoa</th>
                    <th>Personagem</th>
                    <th>Papel / proximidade</th>
                    <th>Fatos, crenças e história</th>
                    <th>Reaparecer</th>
                  </tr>
                </thead>
                <tbody>
                  {state.characters.flatMap((c) =>
                    c.data.relationships.map((r) => (
                      <tr key={`${c.data.character.id}:${r.id}`}>
                        <td>
                          {r.name}
                          <br />
                          <small>{r.status ?? "Situação não declarada"}</small>
                        </td>
                        <td>{c.data.character.fullName}</td>
                        <td>
                          {r.role} · {r.relationshipLevel}
                          <br />
                          {r.qualifiers.join(", ")}
                        </td>
                        <td>
                          <details>
                            <summary>Ver detalhes</summary>
                            <p className="preserve-lines">
                              Fatos:{" "}
                              {r.knownFacts.join("\n") || "Não informados"}
                            </p>
                            <p className="preserve-lines">
                              Crenças:{" "}
                              {r.characterBeliefs.join("\n") ||
                                "Não informadas"}
                            </p>
                            <p className="preserve-lines">
                              Questões:{" "}
                              {r.openQuestions.join("\n") || "Não informadas"}
                            </p>
                            <p className="preserve-lines">{r.notes}</p>
                          </details>
                        </td>
                        <td>{labels[r.canReappear]}</td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          )}
          {area === 4 && (
            <>
              <p className="fine-print">
                Somente datas explicitamente declaradas. Nenhum ano é inferido
                de uma lembrança.
              </p>
              {state.characters.map((c) => (
                <section key={c.data.character.id}>
                  <h3>{c.data.character.fullName}</h3>
                  <ol className="timeline">
                    {timeline(c.data).map((event) => (
                      <li key={event.id}>
                        <strong>{event.date || "Época não definida"}</strong>
                        <span>
                          {event.title} · {event.source}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </>
          )}
          {area === 5 && (
            <>
              <p>
                Coincidências declaradas são apenas possíveis conexões. Nomes
                iguais não confirmam identidade. Sua confirmação fica no
                planejamento do Mestre e não altera os JSONs.
              </p>
              {connections.length === 0 && (
                <p>Nenhuma coincidência declarada encontrada.</p>
              )}
              {connections.map((c) => (
                <article className="connection-card" key={c.key}>
                  <h3>Possível conexão: {c.label}</h3>
                  <p>
                    {c.kind} ·{" "}
                    {c.characterIds
                      .map(
                        (id) =>
                          state.characters.find(
                            (v) => v.data.character.id === id,
                          )?.data.character.fullName,
                      )
                      .join(" ↔ ")}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        confirmedConnections: s.confirmedConnections.includes(
                          c.key,
                        )
                          ? s.confirmedConnections.filter((v) => v !== c.key)
                          : [...s.confirmedConnections, c.key],
                      }))
                    }
                  >
                    {state.confirmedConnections.includes(c.key)
                      ? "Desfazer confirmação do Mestre"
                      : "Confirmar conexão no planejamento"}
                  </button>
                  {state.confirmedConnections.includes(c.key) && (
                    <p className="fine-print">
                      Confirmada manualmente pelo Mestre; não é uma alteração de
                      fatos do jogador.
                    </p>
                  )}
                </article>
              ))}
            </>
          )}
          {area === 6 && (
            <>
              <p>
                Notas, hipóteses e NPCs propostos são privados e separados das
                respostas originais.
              </p>
              <button
                className="button secondary"
                onClick={() => setEditing("new")}
              >
                Adicionar anotação privada
              </button>
              {editing && (
                <PlanEditor
                  key={editing === "new" ? "new" : editing.id}
                  initial={editing === "new" ? undefined : editing}
                  characters={state.characters}
                  onCancel={() => setEditing(null)}
                  onSave={(plan) => {
                    update((s) => ({
                      ...s,
                      plans: s.plans.some((p) => p.id === plan.id)
                        ? s.plans.map((p) => (p.id === plan.id ? plan : p))
                        : [...s.plans, plan],
                    }));
                    setEditing(null);
                  }}
                />
              )}
              {state.plans.map((p) => (
                <article className="plan-card" key={p.id}>
                  <p className="eyebrow">
                    {p.type} · {planLabels[p.status]}
                  </p>
                  <h3>{p.title}</h3>
                  <p className="preserve-lines">{p.body}</p>
                  <p className="fine-print">
                    Personagens:{" "}
                    {p.characterIds
                      .map(
                        (id) =>
                          state.characters.find(
                            (c) => c.data.character.id === id,
                          )?.data.character.fullName ?? "Importação removida",
                      )
                      .join(", ") || "Nenhum"}
                    <br />
                    Oportunidades:{" "}
                    {p.hookIds
                      .map((id) => {
                        const target = state.characters
                          .flatMap((c) =>
                            c.data.narrativeHooks.map((h) => ({
                              id: `${c.data.character.id}:${h.id}`,
                              title: h.title,
                            })),
                          )
                          .find((h) => h.id === id);
                        return target?.title ?? "Oportunidade não disponível";
                      })
                      .join(", ") || "Nenhuma"}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setEditing(p)}
                  >
                    Editar anotação
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (window.confirm("Excluir esta anotação privada?"))
                        update((s) => ({
                          ...s,
                          plans: s.plans.filter((v) => v.id !== p.id),
                        }));
                    }}
                  >
                    Excluir anotação
                  </button>
                </article>
              ))}
            </>
          )}
          {area === 7 && (
            <>
              <p>
                Limites são consultados separadamente. Não são usados para gerar
                sugestões de história. As permissões de cada oportunidade
                continuam valendo.
              </p>
              <button
                className="button secondary"
                onClick={() => setLimits(!limits)}
              >
                {limits
                  ? "Ocultar limites privados"
                  : "Mostrar limites privados"}
              </button>
              {limits &&
                state.characters.map((c) => (
                  <article className="limits-card" key={c.data.character.id}>
                    <h3>{c.data.character.fullName}</h3>
                    <dl className="review-list">
                      <div>
                        <dt>Não explorar</dt>
                        <dd>
                          {c.data.preferences.avoid.join("\n") ||
                            "Não informado"}
                        </dd>
                      </div>
                      <div>
                        <dt>Conversar antes</dt>
                        <dd>
                          {c.data.preferences.discussFirst.join("\n") ||
                            "Não informado"}
                        </dd>
                      </div>
                      <div>
                        <dt>Observações</dt>
                        <dd>{c.data.preferences.notes || "Não informado"}</dd>
                      </div>
                      <div>
                        <dt>Conversa em particular</dt>
                        <dd>
                          {c.data.preferences.discussPrivately
                            ? "Solicitada"
                            : "Não declarada"}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
            </>
          )}
        </section>
      </section>
    </main>
  );
}
