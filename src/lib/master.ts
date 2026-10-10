import { z } from "zod";
import {
  exportSchema,
  parseCharacter,
  authorized,
  textSchema,
  type CharacterExport,
} from "./story";
const id = z.string().min(1).max(100);
export const importedSchema = z
  .object({
    data: exportSchema,
    raw: z.string().max(2_000_000),
    importedAt: z.string().datetime(),
  })
  .superRefine((record, ctx) => {
    try {
      const parsed = parseCharacter(record.raw);
      if (JSON.stringify(parsed) !== JSON.stringify(record.data))
        ctx.addIssue({
          code: "custom",
          message: "JSON original e índice do personagem não correspondem.",
        });
    } catch {
      ctx.addIssue({ code: "custom", message: "JSON original inválido." });
    }
  });
export type ImportedCharacter = z.infer<typeof importedSchema>;
export const planSchema = z.object({
  id,
  title: z.string().trim().min(1).max(200),
  type: z.enum(["nota", "hipotese", "npc"]),
  body: textSchema,
  status: z.enum([
    "ideia",
    "em_desenvolvimento",
    "confirmado",
    "introduzido",
    "resolvido",
  ]),
  characterIds: z.array(id).max(200),
  hookIds: z.array(id).max(200),
  updatedAt: z.string().datetime(),
});
export type Plan = z.infer<typeof planSchema>;
export const masterSchema = z
  .object({
    format: z.literal("hogwarts-master-backup"),
    version: z.literal(1),
    characters: z.array(importedSchema).max(200),
    plans: z.array(planSchema).max(500),
    confirmedConnections: z.array(z.string().max(2000)).max(1000),
  })
  .superRefine((data, ctx) => {
    if (
      new Set(data.characters.map((c) => c.data.character.id)).size !==
      data.characters.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Personagens duplicados no backup.",
      });
    if (new Set(data.plans.map((p) => p.id)).size !== data.plans.length)
      ctx.addIssue({
        code: "custom",
        message: "Anotações duplicadas no backup.",
      });
  });
export type MasterState = z.infer<typeof masterSchema>;
export const emptyMaster = (): MasterState => ({
  format: "hogwarts-master-backup",
  version: 1,
  characters: [],
  plans: [],
  confirmedConnections: [],
});
export function parseMasterBackup(raw: string): MasterState {
  if (new TextEncoder().encode(raw).length > 20_000_000)
    throw new Error("O backup excede 20 MB.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("JSON de backup inválido.");
  }
  const parsed = masterSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      "Backup do Mestre inválido: " +
        parsed.error.issues
          .slice(0, 2)
          .map((i) => i.message)
          .join("; "),
    );
  return parsed.data;
}
export function summarize(state: MasterState) {
  return {
    characters: state.characters.length,
    relations: state.characters.reduce(
      (n, c) => n + c.data.relationships.length,
      0,
    ),
    hooks: state.characters.reduce(
      (n, c) => n + c.data.narrativeHooks.filter(authorized).length,
      0,
    ),
    proposals: state.plans.filter(
      (p) => p.status === "ideia" || p.status === "em_desenvolvimento",
    ).length,
  };
}
export function normalize(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
export type Connection = {
  key: string;
  label: string;
  kind: "sobrenome" | "local" | "pessoa" | "tema";
  characterIds: string[];
};
export function possibleConnections(
  characters: CharacterExport[],
): Connection[] {
  const buckets = new Map<
    string,
    { label: string; kind: Connection["kind"]; ids: Set<string> }
  >();
  function add(kind: Connection["kind"], value: string, id: string) {
    if (!value.trim()) return;
    const key = `${kind}:${normalize(value)}`;
    const bucket = buckets.get(key) ?? {
      label: value,
      kind,
      ids: new Set<string>(),
    };
    bucket.ids.add(id);
    buckets.set(key, bucket);
  }
  for (const c of characters) {
    const id = c.character.id;
    const parts = c.character.fullName.trim().split(/\s+/);
    if (parts.length > 1) add("sobrenome", parts.at(-1)!, id);
    add("local", c.character.birthPlace, id);
    add("local", c.character.residence, id);
    for (const r of c.relationships) add("pessoa", r.name, id);
    for (const theme of c.preferences.themes) {
      if (
        !c.preferences.avoid.some((v) => normalize(v) === normalize(theme)) &&
        !c.preferences.discussFirst.some(
          (v) => normalize(v) === normalize(theme),
        )
      )
        add("tema", theme, id);
    }
  }
  return [...buckets.entries()]
    .filter(([, v]) => v.ids.size > 1)
    .map(([key, v]) => ({
      key,
      label: v.label,
      kind: v.kind,
      characterIds: [...v.ids],
    }));
}
export function timeline(c: CharacterExport) {
  return [
    {
      id: "birth-" + c.character.id,
      title: "Nascimento",
      date: c.character.birthDate,
      source: "Registro de Admissão",
    },
    ...c.narrativeHooks.map((h) => ({
      id: h.id,
      title: h.title,
      date: h.eventDate ?? "",
      source: h.sourceQuestionId,
    })),
  ].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });
}
