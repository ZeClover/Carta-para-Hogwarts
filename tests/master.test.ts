import { describe, expect, it } from "vitest";
import { buildExport } from "../src/lib/story";
import {
  emptyMaster,
  parseMasterBackup,
  possibleConnections,
  summarize,
  timeline,
} from "../src/lib/master";
import { fixture, hook } from "./fixtures";
describe("Arquivo do Mestre", () => {
  it("preserva o JSON bruto e as notas separadas em backup/restauração", () => {
    const { draft, story } = fixture();
    story.narrativeHooks = [hook];
    const data = buildExport(draft, story);
    const raw = JSON.stringify(data, null, 2);
    const s = emptyMaster();
    s.characters = [{ data, raw, importedAt: new Date().toISOString() }];
    s.plans = [
      {
        id: "private_note",
        title: "Hipótese privada",
        type: "hipotese",
        body: "Proposta do Mestre",
        status: "ideia",
        characterIds: [data.character.id],
        hookIds: [],
        updatedAt: new Date().toISOString(),
      },
    ];
    const restored = parseMasterBackup(JSON.stringify(s));
    expect(restored.characters[0].raw).toBe(raw);
    expect(restored.plans[0].body).toBe("Proposta do Mestre");
    expect(JSON.stringify(restored.characters[0].data)).not.toContain(
      "Proposta do Mestre",
    );
    expect(summarize(restored)).toEqual({
      characters: 1,
      relations: 0,
      hooks: 1,
      proposals: 1,
    });
    const mismatched = structuredClone(s);
    mismatched.characters[0].data.character.fullName = "Alterado";
    expect(() => parseMasterBackup(JSON.stringify(mismatched))).toThrow(
      "não correspondem",
    );
  });
  it("gera apenas coincidências declaradas e não inventa datas", () => {
    const a = fixture("Eleanor Whitmore"),
      b = fixture("Theo Whitmore");
    a.story.narrativeHooks = [hook];
    a.story.preferences.themes = ["familia", "misterio"];
    b.story.preferences.themes = ["familia", "misterio"];
    b.story.preferences.avoid = ["misterio"];
    const first = buildExport(a.draft, a.story),
      second = buildExport(b.draft, b.story);
    const connections = possibleConnections([first, second]);
    expect(
      connections.some((c) => c.kind === "sobrenome" && c.label === "Whitmore"),
    ).toBe(true);
    expect(
      connections.some((c) => c.kind === "tema" && c.label === "misterio"),
    ).toBe(false);
    expect(timeline(first).find((e) => e.id === hook.id)?.date).toBe("");
  });
  it("rejeita backup com personagens duplicados sem sobrescrever a origem", () => {
    const a = fixture();
    const data = buildExport(a.draft, a.story);
    const s = emptyMaster();
    const record = {
      data,
      raw: JSON.stringify(data),
      importedAt: new Date().toISOString(),
    };
    s.characters = [record, record];
    expect(() => parseMasterBackup(JSON.stringify(s))).toThrow("duplicados");
  });
});
