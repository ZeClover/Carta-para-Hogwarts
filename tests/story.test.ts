import { describe, expect, it } from "vitest";
import { allNarrativeQuestions, chapters } from "../src/content/chapters";
import { questions } from "../src/content/admission";
import { families } from "../src/content/families";
import {
  activeAnswers,
  authorized,
  buildExport,
  completionErrors,
  parseCharacter,
} from "../src/lib/story";
import { fixture, hook } from "./fixtures";
describe("Contrato narrativo", () => {
  it("oferece as 61 perguntas principais, seleção de família e extensões sem duplicatas", () => {
    const ids = [...questions, ...allNarrativeQuestions].map((q) => q.id);
    expect(ids).toHaveLength(61);
    expect(new Set(ids).size).toBe(61);
    expect(chapters.II.questions).toHaveLength(9);
    expect(chapters.VII.questions).toHaveLength(10);
    expect(families).toHaveLength(11);
    expect(families.find((f) => f.id === "scamander")?.origemDaInformacao).toBe(
      "campanha",
    );
  });
  it("não exporta texto oculto, pulado ou contexto de uma família que deixou de ser escolhida", () => {
    const { draft, story } = fixture();
    story.answers.VII05 = {
      value: "nao",
      status: "answered",
      explanation: "Explicação anterior",
    };
    story.answers.II06 = {
      value: "Texto preservado no rascunho",
      status: "prefer_not_to_answer",
    };
    story.family = {
      catalogId: "black",
      displayName: "Black",
      branchNotes: "Não seguia as tradições",
      customName: "Família anterior",
      customContext: "Contexto anterior",
    };
    const data = buildExport(draft, story);
    expect(data.answers.VII05.explanation).toBe("");
    expect(data.answers.II06.value).toBe("");
    expect(JSON.stringify(data)).not.toContain("Família anterior");
    expect(story.answers.II06.value).toContain("preservado");
  });
  it("bloqueia a conclusão sem campos obrigatórios e revisão, mas permite zero ganchos", () => {
    const { draft, story } = fixture();
    expect(completionErrors(draft, story)).toEqual([]);
    expect(buildExport(draft, story).narrativeHooks).toEqual([]);
    delete story.answers.III01;
    expect(() => buildExport(draft, story)).toThrow("III01");
    story.answers.III01 = { value: "incerto", status: "answered" };
    story.chaptersReviewed = ["I"];
    expect(() => buildExport(draft, story)).toThrow("sete capítulos");
  });
  it("mantém IDs, permissões e revisões e rejeita versões ou referências inválidas", () => {
    const { draft, story } = fixture();
    story.narrativeHooks = [hook];
    story.revision = 2;
    const data = buildExport(draft, story, "2026-10-10T18:00:00.000Z");
    expect(data.revision).toBe(3);
    expect(parseCharacter(JSON.stringify(data)).character.id).toBe(draft.id);
    expect(data.narrativeHooks[0]).toEqual(hook);
    expect(() =>
      parseCharacter(JSON.stringify({ ...data, schemaVersion: "9" })),
    ).toThrow();
    data.answers.II01 = { value: ["missing"], status: "answered" };
    expect(() => parseCharacter(JSON.stringify(data))).toThrow(
      "Referência inválida",
    );
  });
  it("não interpreta uma possibilidade ou fio fechado como autorização", () => {
    expect(authorized(hook)).toBe(true);
    expect(authorized({ ...hook, exploreInCampaign: "maybe" })).toBe(false);
    expect(authorized({ ...hook, permission: "closed" })).toBe(false);
    expect(activeAnswers(fixture().story).III01.value).toBe("nao");
  });
});
