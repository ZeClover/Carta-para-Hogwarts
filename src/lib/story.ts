import { z } from "zod";
import { chapterIds, allNarrativeQuestions } from "../content/chapters";
import { questions } from "../content/admission";
import { validBirthDate, validateAdmission, type Draft } from "./draft";
export const textSchema = z.string().max(5000);
const id = z.string().min(1).max(100);
const lines = z.array(textSchema).max(200);
export const answerSchema = z.object({
  value: z.union([textSchema, z.array(textSchema).max(200)]),
  status: z.enum([
    "answered",
    "skipped",
    "not_applicable",
    "prefer_not_to_answer",
    "unknown",
  ]),
  explanation: textSchema.optional(),
});
export type Answer = z.infer<typeof answerSchema>;
export const relationSchema = z.object({
  id,
  name: z.string().trim().min(1).max(200),
  role: z.string().max(100),
  relationshipLevel: z.enum([
    "desconhecido",
    "conhecido",
    "proximo",
    "confidente",
    "vinculo",
  ]),
  status: z.enum(["vivo", "morto", "desconhecido"]).optional(),
  qualifiers: lines.default([]),
  knownFacts: lines,
  characterBeliefs: lines,
  openQuestions: lines,
  canReappear: z.enum(["yes", "maybe", "no"]),
  notes: textSchema,
});
export type Relation = z.infer<typeof relationSchema>;
export const objectSchema = z.object({
  id,
  name: z.string().trim().min(1).max(200),
  kind: z.enum(["objeto", "lugar"]),
  meaning: textSchema,
});
export type StoryObject = z.infer<typeof objectSchema>;
export const hookSchema = z.object({
  id,
  sourceQuestionId: z.string().max(100),
  kind: z.enum([
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
  ]),
  title: z.string().trim().min(1).max(200),
  confirmedFacts: lines,
  characterBeliefs: lines,
  unansweredQuestion: textSchema,
  permission: z.enum(["closed", "details", "explanation", "broad"]),
  playerInterest: z.enum(["low", "medium", "high"]),
  specificConstraints: lines,
  exploreInCampaign: z.enum(["yes", "maybe", "no"]),
  eventDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (v) =>
        !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v),
      "Data inválida",
    )
    .optional(),
});
export type Hook = z.infer<typeof hookSchema>;
export const preferencesSchema = z.object({
  themes: lines,
  avoid: lines,
  discussFirst: lines,
  notes: textSchema,
  discussPrivately: z.boolean().optional(),
});
export const storySchema = z.object({
  format: z.literal("hogwarts-story-draft"),
  version: z.literal(1),
  admissionId: id,
  updatedAt: z.string().datetime(),
  revision: z.number().int().min(0),
  answers: z.record(z.string().max(100), answerSchema),
  family: z.object({
    catalogId: z.string().max(100),
    displayName: textSchema,
    branchNotes: textSchema,
    customName: textSchema,
    customContext: textSchema,
  }),
  relationships: z.array(relationSchema).max(200),
  objects: z.array(objectSchema).max(200),
  narrativeHooks: z.array(hookSchema).max(200),
  preferences: preferencesSchema,
  chaptersReviewed: z.array(z.enum(chapterIds)).max(7),
});
export type Story = z.infer<typeof storySchema>;
export const exportSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    exportedAt: z.string().datetime(),
    revision: z.number().int().min(1),
    campaign: z.object({
      id: z.literal("hogwarts-1890"),
      year: z.literal(1890),
    }),
    character: z.object({
      id,
      fullName: z.string().trim().min(1).max(5000),
      preferredName: textSchema,
      birthDate: z
        .string()
        .refine(validBirthDate, "Data de nascimento inválida"),
      birthPlace: z.string().trim().min(1).max(5000),
      residence: z.string().trim().min(1).max(5000),
      pronouns: textSchema,
      appearance: textSchema,
      distinctiveFeature: textSchema,
      family: z.object({
        catalogId: z.string().max(100),
        displayName: textSchema,
        branchNotes: textSchema,
        context: textSchema.optional(),
      }),
      worldFamiliarity: z.enum(["sim", "nao", "parcialmente", "incerto"]),
    }),
    answers: z.record(z.string().max(100), answerSchema),
    relationships: z.array(relationSchema).max(200),
    objects: z.array(objectSchema).max(200).optional(),
    narrativeHooks: z.array(hookSchema).max(200),
    preferences: preferencesSchema,
    completion: z.object({
      completed: z.boolean(),
      chaptersReviewed: z.array(z.enum(chapterIds)).max(7),
    }),
  })
  .superRefine((data, ctx) => {
    for (const collection of [
      data.relationships,
      data.narrativeHooks,
      data.objects ?? [],
    ]) {
      if (new Set(collection.map((v) => v.id)).size !== collection.length)
        ctx.addIssue({
          code: "custom",
          message: "IDs duplicados em uma coleção.",
        });
    }
    for (const q of allNarrativeQuestions.filter(
      (q) => q.type === "relations" || q.type === "objects",
    )) {
      const a = data.answers[q.id];
      if (!a || a.status !== "answered") continue;
      const ids = (
        q.type === "relations" ? data.relationships : (data.objects ?? [])
      ).map((v) => v.id);
      if (!Array.isArray(a.value) || a.value.some((v) => !ids.includes(v)))
        ctx.addIssue({
          code: "custom",
          message: `Referência inválida em ${q.id}.`,
        });
    }
  });
export type CharacterExport = z.infer<typeof exportSchema>;
export function createStory(admissionId: string): Story {
  return {
    format: "hogwarts-story-draft",
    version: 1,
    admissionId,
    updatedAt: new Date().toISOString(),
    revision: 0,
    answers: {},
    family: {
      catalogId: "",
      displayName: "",
      branchNotes: "",
      customName: "",
      customContext: "",
    },
    relationships: [],
    objects: [],
    narrativeHooks: [],
    preferences: {
      themes: [],
      avoid: [],
      discussFirst: [],
      notes: "",
      discussPrivately: false,
    },
    chaptersReviewed: [],
  };
}
export function activeAnswers(story: Story): Record<string, Answer> {
  const result: Record<string, Answer> = {};
  for (const q of allNarrativeQuestions) {
    const a = story.answers[q.id];
    if (!a) continue;
    result[q.id] =
      a.status === "answered"
        ? {
            ...a,
            explanation:
              q.conditionalExplanation && a.value === "nao"
                ? ""
                : a.explanation,
          }
        : { value: "", status: a.status };
  }
  if (story.family.catalogId)
    result.II00 = { value: story.family.catalogId, status: "answered" };
  if (story.answers["II00-applies"]) {
    const a = story.answers["II00-applies"];
    result["II00-applies"] =
      a.status === "answered" ? a : { value: "", status: a.status };
  }
  return result;
}
export function completionErrors(draft: Draft, story: Story): string[] {
  const errors = Object.entries(validateAdmission(draft.admission)).map(
    ([key, message]) =>
      `${questions.find((q) => q.key === key)?.label}: ${message}`,
  );
  const familiarity = story.answers.III01;
  if (
    !familiarity ||
    familiarity.status !== "answered" ||
    !["sim", "nao", "parcialmente", "incerto"].includes(
      String(familiarity.value),
    )
  )
    errors.push("Responda III01: cresceu sabendo que o mundo mágico existia?");
  if (chapterIds.some((ch) => !story.chaptersReviewed.includes(ch)))
    errors.push("Revise e confirme os sete capítulos antes de concluir.");
  return errors;
}
export function buildExport(
  draft: Draft,
  story: Story,
  now = new Date().toISOString(),
): CharacterExport {
  const errors = completionErrors(draft, story);
  if (errors.length) throw new Error(errors.join(" "));
  const answers = activeAnswers(story);
  for (const q of questions)
    answers[q.id] = {
      value: draft.admission[q.key],
      status: draft.admission[q.key] ? "answered" : "skipped",
    };
  const family = {
    catalogId: story.family.catalogId,
    displayName: story.family.displayName,
    branchNotes: story.family.branchNotes,
    ...(story.family.catalogId === "outra"
      ? { context: story.family.customContext }
      : {}),
  };
  return exportSchema.parse({
    schemaVersion: "1.0.0",
    exportedAt: now,
    revision: story.revision + 1,
    campaign: { id: "hogwarts-1890", year: 1890 },
    character: {
      id: draft.id,
      ...draft.admission,
      family,
      worldFamiliarity: story.answers.III01.value,
    },
    answers,
    relationships: story.relationships,
    objects: story.objects,
    narrativeHooks: story.narrativeHooks,
    preferences: story.preferences,
    completion: { completed: true, chaptersReviewed: story.chaptersReviewed },
  });
}
export function authorized(h: Hook): boolean {
  return h.exploreInCampaign === "yes" && h.permission !== "closed";
}
export function splitLines(value: string) {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}
export function slug(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "personagem"
  );
}
export function downloadJSON(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseCharacter(raw: string): CharacterExport {
  if (new TextEncoder().encode(raw).length > 2_000_000)
    throw new Error("O JSON excede 2 MB.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("O arquivo não contém JSON válido.");
  }
  const result = exportSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      "Personagem inválido: " +
        result.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".") || "estrutura"}: ${i.message}`)
          .join("; "),
    );
  return result.data;
}
