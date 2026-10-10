import { z } from "zod";
export const fields = [
  "fullName",
  "preferredName",
  "birthDate",
  "birthPlace",
  "residence",
  "pronouns",
  "appearance",
  "distinctiveFeature",
] as const;
export type Field = (typeof fields)[number];
const text = z.string().max(5000);
export const admissionSchema = z.object({
  fullName: text,
  preferredName: text,
  birthDate: text,
  birthPlace: text,
  residence: text,
  pronouns: text,
  appearance: text,
  distinctiveFeature: text,
});
export const draftSchema = z.object({
  format: z.literal("hogwarts-admission-draft"),
  version: z.literal(1),
  id: z.string().min(1).max(100),
  updatedAt: z.string().datetime(),
  sheet: z.number().int().min(0).max(2),
  completed: z.boolean(),
  admission: admissionSchema,
});
export type Draft = z.infer<typeof draftSchema>;
export function createDraft(): Draft {
  return {
    format: "hogwarts-admission-draft",
    version: 1,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
    sheet: 0,
    completed: false,
    admission: {
      fullName: "",
      preferredName: "",
      birthDate: "",
      birthPlace: "",
      residence: "",
      pronouns: "",
      appearance: "",
      distinctiveFeature: "",
    },
  };
}
export function validateAdmission(
  a: Draft["admission"],
): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const field of [
    "fullName",
    "birthDate",
    "birthPlace",
    "residence",
  ] as const) {
    if (!a[field].trim())
      errors[field] = "Preencha este campo para concluir o registro.";
  }
  if (a.birthDate && !validBirthDate(a.birthDate))
    errors.birthDate =
      "Informe uma data válida, anterior ao início das aulas em 1890.";
  return errors;
}
export function validBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(d.getTime()) &&
    d.toISOString().slice(0, 10) === value &&
    value < "1890-09-01" &&
    value >= "0001-01-01"
  );
}
export function ageIn1890(value: string): number | null {
  if (!validBirthDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return 1890 - year - (month > 9 || (month === 9 && day > 1) ? 1 : 0);
}
export function parseBackup(value: string): Draft {
  if (new TextEncoder().encode(value).length > 100_000)
    throw new Error("O arquivo excede 100 KB.");
  const result = draftSchema.safeParse(JSON.parse(value));
  if (!result.success)
    throw new Error(
      "Este arquivo não é um backup válido do Registro de Admissão (versão 1).",
    );
  return result.data;
}
export function downloadDraft(draft: Draft) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(draft, null, 2)], {
      type: "application/json;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "hogwarts-1890-registro-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
