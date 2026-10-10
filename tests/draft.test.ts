import { describe, expect, it } from "vitest";
import {
  createDraft,
  validateAdmission,
  ageIn1890,
  parseBackup,
} from "../src/lib/draft";
describe("Registro de Admissão", () => {
  it("exige apenas os quatro campos obrigatórios", () => {
    const d = createDraft();
    expect(Object.keys(validateAdmission(d.admission))).toHaveLength(4);
    Object.assign(d.admission, {
      fullName: "Eleanor",
      birthDate: "1879-03-15",
      birthPlace: "Edimburgo",
      residence: "Yorkshire",
    });
    expect(validateAdmission(d.admission)).toEqual({});
    d.admission.birthDate = "1870-03-15";
    expect(validateAdmission(d.admission)).toEqual({});
  });
  it("detecta datas impossíveis, futuras e aceita exceções à idade típica", () => {
    expect(ageIn1890("1879-03-15")).toBe(11);
    expect(ageIn1890("1878-09-02")).toBe(11);
    expect(ageIn1890("1879-09-01")).toBe(11);
    expect(ageIn1890("1878-09-01")).toBe(12);
    expect(ageIn1890("1879-09-02")).toBe(10);
    expect(ageIn1890("1880-10-15")).toBe(9);
    expect(ageIn1890("1879-02-30")).toBeNull();
    expect(ageIn1890("1890-09-01")).toBeNull();
  });
  it("restaura sem perder identidade, folha, campos opcionais e estado", () => {
    const d = createDraft();
    d.sheet = 2;
    d.admission.appearance = "Tinta nas mãos";
    expect(parseBackup(JSON.stringify(d))).toEqual(d);
    expect(() => parseBackup('{"version":9}')).toThrow();
    expect(() => parseBackup("x".repeat(100001))).toThrow();
  });
});
