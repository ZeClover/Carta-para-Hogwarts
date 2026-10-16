import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { emptyMaster } from "../../src/lib/master";
import { fixture } from "../fixtures";
import { goTo, reloadPage } from "./navigation";

test("falha de leitura do Mestre não autoriza sobrescrever o arquivo e restauração exige confirmação", async ({
  page,
}) => {
  await goTo(page, "/mestre");
  await page.getByRole("button", { name: "Planejamento", exact: true }).click();
  await page
    .getByRole("button", { name: "Adicionar anotação privada" })
    .click();
  await page.getByLabel("Título da anotação").fill("Nota fictícia a preservar");
  await page
    .getByLabel("Conteúdo privado")
    .fill("Conteúdo exclusivo deste teste.");
  await page.getByRole("button", { name: "Salvar anotação" }).click();
  await expect(page.locator(".save-status")).toHaveText(
    "Arquivo salvo neste navegador.",
  );
  await page.addInitScript(() => {
    const original = IDBObjectStore.prototype.get;
    IDBObjectStore.prototype.get = function (key) {
      if (this.transaction.db.name === "hogwarts-master")
        throw new Error("Read failure injected by audit");
      return original.call(this, key);
    };
  });
  await page.reload();
  await expect(
    page.getByText(
      "Falha ao recuperar o arquivo. Os dados existentes não foram substituídos.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("master-read-failure.png"),
    fullPage: true,
  });
  // On the old version this button overwrites the unread archive with emptyMaster().
  const unsafeRetry = page.getByRole("button", {
    name: "Tentar salvar arquivo",
  });
  if (await unsafeRetry.count()) {
    await unsafeRetry.click();
    await expect(page.locator(".save-status")).toHaveText(
      "Arquivo salvo neste navegador.",
    );
  }
  const archive = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("hogwarts-master", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      return await new Promise<{ plans: { title: string }[] }[]>(
        (resolve, reject) => {
          const request = db
            .transaction("records")
            .objectStore("records")
            .getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        },
      );
    } finally {
      db.close();
    }
  });
  expect(archive[0].plans.map((plan) => plan.title)).toEqual([
    "Nota fictícia a preservar",
  ]);
  await expect(
    page.getByLabel("Selecionar JSONs", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Adicionar anotação privada" }),
  ).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const file = {
    name: "master.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(emptyMaster())),
  };
  const canceled = new Promise<void>((resolve) =>
    page.once("dialog", async (dialog) => {
      await dialog.dismiss();
      resolve();
    }),
  );
  await page
    .getByLabel("Restaurar backup do Mestre", { exact: true })
    .setInputFiles(file);
  await canceled;
  await expect(
    page.getByRole("button", { name: "Tentar recuperar arquivo" }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByLabel("Restaurar backup do Mestre", { exact: true })
    .setInputFiles(file);
  await expect(page.locator(".import-reports")).toContainText(
    "Backup restaurado.",
  );
  await expect(
    page.getByLabel("Selecionar JSONs", { exact: true }),
  ).toBeEnabled();
});

test("falha de escrita impede avanço, mantém backup e permite salvar novamente", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.assign(window, { failAuditWrite: false });
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (
        (window as unknown as { failAuditWrite: boolean }).failAuditWrite &&
        this.transaction.db.name === "hogwarts-narrative"
      )
        throw new DOMException("Quota test", "QuotaExceededError");
      return Reflect.apply(original, this, args);
    };
  });
  await goTo(page, "/experiencia?capitulo=VI");
  await expect(page.locator("#VI01")).toBeEnabled();
  await page.evaluate(() => Object.assign(window, { failAuditWrite: true }));
  await page
    .locator("#VI01")
    .fill("Resposta fictícia durante falha de escrita");
  await expect(page.locator(".cinema-save")).toContainText(
    "Não foi possível salvar",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#VI01")).toBeEnabled();
  await page.getByRole("button", { name: "Capítulos e opções" }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  const backup = JSON.parse(
    await readFile((await (await downloading).path())!, "utf8"),
  );
  expect(backup.story.answers.VI01.value).toBe(
    "Resposta fictícia durante falha de escrita",
  );
  await page.evaluate(() => Object.assign(window, { failAuditWrite: false }));
  await page.getByRole("button", { name: "Tentar salvar novamente" }).click();
  await expect(page.locator(".save-status")).toHaveText(
    "Salvo neste navegador.",
  );
  await reloadPage(page);
  await expect(page.locator("#VI01")).toHaveValue(
    "Resposta fictícia durante falha de escrita",
  );
});

test("conclusão e revisão exportada são reconhecidas ao reabrir a revisão", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goTo(page, "/revisao");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Restaurar história", { exact: true }).setInputFiles({
    name: "player.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "hogwarts-player-backup",
        version: 1,
        ...fixture("Estudante fictício da conclusão"),
      }),
    ),
  });
  await expect(
    page.getByText("História restaurada.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Concluir minha história", exact: true })
    .click();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Confirmar e concluir sem oportunidades" })
    .click();
  await downloading;
  await expect(
    page.getByRole("button", { name: "Reexportar minha história" }),
  ).toBeEnabled();
  await reloadPage(page);
  await expect(
    page.getByRole("button", { name: "Reexportar minha história" }),
  ).toBeVisible();
  await expect(
    page.getByText("Assinatura simbólica do personagem · Revisão 1"),
  ).toBeVisible();
  await page
    .locator(".epilogue")
    .screenshot({ path: test.info().outputPath("completed-after-reload.png") });
});

test("respostas salvam sem rede e retornam após fechar e reabrir a aba", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "light"),
  );
  await goTo(page, "/experiencia?capitulo=VI");
  await expect(page.locator("#VI01")).toBeEnabled();
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.locator("#VI01").fill("Resposta fictícia escrita sem conexão");
  await expect(page.locator(".cinema-save")).toHaveText(
    "Salvo neste navegador.",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#VI02").fill("Segunda resposta preservada");
  await expect(page.locator(".cinema-save")).toHaveText(
    "Salvo neste navegador.",
  );
  await page.close();
  await context.setOffline(false);
  const reopened = await context.newPage();
  await reopened.emulateMedia({ reducedMotion: "reduce" });
  await goTo(reopened, "/experiencia");
  await expect(reopened.locator("#VI02")).toHaveValue(
    "Segunda resposta preservada",
  );
  await reopened.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(reopened.locator("#VI01")).toHaveValue(
    "Resposta fictícia escrita sem conexão",
  );
});
