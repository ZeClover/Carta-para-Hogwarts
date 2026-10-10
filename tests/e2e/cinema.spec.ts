import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("fullscreen, confirma, retoma, edita e preserva todas as perguntas", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/experiencia");
  await expect(page.getByLabel("Nome completo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".cinema [role=alert]")).toContainText("Preencha");
  await page
    .getByLabel("Nome completo", { exact: true })
    .fill("Eleanor Whitmore");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#I02")).toBeVisible();
  await page.reload();
  await expect(page.locator("#I02")).toBeVisible();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator("#I01")).toHaveValue("Eleanor Whitmore");
  await page.locator("#I01").fill("Eleanor Whitmore Revisada");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#I03").fill("1879-03-15");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#I04").fill("Edimburgo");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#I05").fill("Yorkshire");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirmar capítulo e continuar" })
    .click();
  await expect(page.locator("#family")).toBeVisible();
  await page.locator("#family").selectOption("black");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#II01-title")).toBeVisible();
  await page
    .getByRole("button", { name: "Adicionar pessoa", exact: true })
    .click();
  await page
    .getByLabel("Nome da pessoa *", { exact: true })
    .fill("Responsável fictícia");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole("button", { name: "Salvar pessoa", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: /Responsável fictícia/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#II02").fill("Uma casa entre árvores.");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  for (let i = 0; i < 65; i++) {
    if (page.url().endsWith("/revisao")) break;
    if (await page.locator("#III01").count())
      await page.locator("#III01").selectOption("incerto");
    const current = await page
      .locator(".cinema-writing")
      .getAttribute("aria-label");
    await page.locator(".cinema-actions .button").last().click();
    await expect
      .poll(() =>
        page.evaluate(() =>
          location.pathname === "/revisao"
            ? "review"
            : (document
                .querySelector(".cinema-writing")
                ?.getAttribute("aria-label") ?? "navigation"),
        ),
      )
      .not.toBe(current);
  }
  await expect(page).toHaveURL(/revisao/);
  await page.goto("/experiencia");
  await expect(page.locator(".cinema-writing")).toHaveAttribute(
    "aria-label",
    "Página VII-review",
  );
  await page.getByRole("button", { name: "Capítulos e opções" }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  expect((await download).suggestedFilename()).toContain("backup");
  await page
    .getByRole("button", { name: "II — Antes da Carta", exact: false })
    .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#II02")).toHaveValue("Uma casa entre árvores.");
  expect(
    await page
      .locator(".cinema")
      .evaluate((el) => Math.round(el.getBoundingClientRect().height)),
  ).toBe(page.viewportSize()!.height);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/experiencia?capitulo=II");
  await expect(page.locator("#family")).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#II01-title")).toBeVisible();
  await page.reload();
  await expect(page.locator("#II01-title")).toBeVisible();
});
test("salva antes da animação, permite pular e sair", async ({ page }) => {
  await page.goto("/experiencia");
  await page.locator("#I01").fill("Nome persistente");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".cinema")).toHaveAttribute("data-phase", "glow");
  await page
    .getByRole("button", { name: "Pular animação / reduzir movimento" })
    .click();
  await expect(page.locator("#I02")).toBeVisible();
  await page.getByRole("button", { name: "Sair e continuar depois" }).click();
  await page.goto("/experiencia");
  await expect(page.locator("#I02")).toBeVisible();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator("#I01")).toHaveValue("Nome persistente");
  await expect(page.locator(".cinema-writing")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: test.info().outputPath("cinema.png"),
  });
});
test("texto oculto fica guardado e não aparece na tinta ou nas páginas", async ({
  page,
}) => {
  await page.goto("/experiencia?capitulo=II");
  await expect(page.locator("#family")).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#II01-title")).toBeVisible();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#II02")).toBeVisible();
  await page.locator("#II02").fill("Texto fictício reservado ao rascunho");
  await page.locator("#II02-status").selectOption("prefer_not_to_answer");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".cinema")).toHaveAttribute("data-phase", "glow");
  await expect(page.locator(".cinema-ink")).toBeEmpty();
  await expect(page.locator("#II03-title")).toBeVisible();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.locator("#II02-status").selectOption("answered");
  await expect(page.locator("#II02")).toHaveValue(
    "Texto fictício reservado ao rascunho",
  );
});
test("restaurar o mesmo personagem cancela uma transição pendente", async ({
  page,
}) => {
  await page.goto("/experiencia");
  await page.locator("#I01").fill("Personagem fictício preservado");
  await page.getByRole("button", { name: "Capítulos e opções" }).click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  const file = await downloading;
  const buffer = await readFile((await file.path())!);
  await page
    .getByRole("button", { name: "Voltar à cena", exact: true })
    .click();
  await page.clock.install({ time: new Date() });
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".cinema")).toHaveAttribute("data-phase", "glow");
  await page.getByRole("button", { name: "Capítulos e opções" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByLabel("Restaurar história").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer,
  });
  await expect(page.locator(".cinema-menu")).not.toBeVisible();
  await expect(page.locator(".cinema")).toHaveAttribute("data-phase", "idle");
  await page.clock.runFor(3000);
  await expect(page.locator("#I01")).toHaveValue(
    "Personagem fictício preservado",
  );
  await page.reload();
  await expect(page.locator("#I01")).toHaveValue(
    "Personagem fictício preservado",
  );
});
