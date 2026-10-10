import "fake-indexeddb/auto";
import { expect, it } from "vitest";
import { createDraft } from "../src/lib/draft";
import { loadDraft, saveDraft } from "../src/lib/storage";
it("recupera o registro e serializa escritas sem sobrescrever a resposta mais nova", async () => {
  expect(await loadDraft()).toBeNull();
  const d = createDraft();
  d.admission.fullName = "Primeira resposta";
  const newer = {
    ...d,
    admission: { ...d.admission, fullName: "Resposta mais recente" },
    sheet: 2,
  };
  await Promise.all([saveDraft(d), saveDraft(newer)]);
  expect(await loadDraft()).toEqual(newer);
});
