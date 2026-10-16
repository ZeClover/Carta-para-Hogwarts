import { goTo, reloadPage } from "./navigation";
import { expect, test } from "@playwright/test";
test("abre a carta, salva três folhas e recupera o registro após reload", async ({
  page,
}) => {
  await goTo(page, "/");
  await expect(page.getByLabel("Nome completo", { exact: true })).toBeVisible({
    timeout: 10000,
  });
  await goTo(page, "/criar/I");
  await page.getByLabel("Nome completo").fill("Eleanor Whitmore");
  await page.getByLabel("Data de nascimento").fill("1879-03-15");
  await page.getByRole("button", { name: "Próxima folha" }).click();
  await page.getByLabel("Lugar de nascimento").fill("Edimburgo");
  await page.getByLabel("Residência antes de Hogwarts").fill("Yorkshire");
  await expect(page.locator(".save-status")).toHaveText(
    "Salvo neste navegador.",
  );
  await reloadPage(page);
  await expect(page.getByLabel("Residência antes de Hogwarts")).toHaveValue(
    "Yorkshire",
  );
  await page.getByRole("button", { name: "Próxima folha" }).click();
  await page
    .getByLabel("Aparência")
    .fill("Casaco largo e mãos manchadas de tinta.");
  await page
    .getByRole("button", { name: "Concluir Registro de Admissão" })
    .click();
  await expect(page).toHaveURL(/criar\/II/);
  await goTo(page, "/criar/I");
  await expect(page.getByLabel("Aparência")).toHaveValue(
    "Casaco largo e mãos manchadas de tinta.",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  expect((await download).suggestedFilename()).toBe(
    "hogwarts-1890-historia-backup.json",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("validação, data excepcional e animação reduzida", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goTo(page, "/");
  await page.getByRole("button", { name: "Pular animações" }).click();
  await expect(page.getByLabel("Nome completo", { exact: true })).toBeVisible();
  await goTo(page, "/criar/I");
  await page.getByRole("button", { name: "Folha 3: Seu retrato" }).click();
  await page
    .getByRole("button", { name: "Concluir Registro de Admissão" })
    .click();
  await expect(
    page.getByText("Revise os campos indicados antes de concluir."),
  ).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toBeFocused();
  await page.getByLabel("Data de nascimento").fill("1870-03-15");
  await expect(page.getByText(/1890: 20 anos/)).toBeVisible();
  await expect(page.getByText(/Combine a exceção com o Mestre/)).toBeVisible();
  await page
    .getByRole("button", { name: "Recomeçar história", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByLabel("Data de nascimento")).toHaveValue("1870-03-15");
});
test("restaura um backup legado e rejeita arquivo inválido sem apagar respostas", async ({
  page,
}) => {
  await goTo(page, "/criar/I");
  await page.getByLabel("Nome completo").fill("Registro preservado");
  await expect(page.locator(".save-status")).toHaveText(
    "Salvo neste navegador.",
  );
  await page.getByText("Backup do registro da primeira versão").click();
  await page.getByLabel("Restaurar backup", { exact: true }).setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":9}'),
  });
  await expect(page.getByText(/não é um backup válido/)).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toHaveValue(
    "Registro preservado",
  );
  const backup = {
    format: "hogwarts-admission-draft",
    version: 1,
    id: "restored-id",
    updatedAt: new Date().toISOString(),
    sheet: 0,
    completed: false,
    admission: {
      fullName: "Registro restaurado",
      preferredName: "",
      birthDate: "1879-01-01",
      birthPlace: "",
      residence: "",
      pronouns: "",
      appearance: "",
      distinctiveFeature: "",
    },
  };
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Restaurar backup", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.getByText("Cópia restaurada.")).toBeVisible();
  await reloadPage(page);
  await expect(page.getByLabel("Nome completo")).toHaveValue(
    "Registro restaurado",
  );
});
test("falha de armazenamento é explícita e oferece recuperação sem criar outro registro", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await goTo(page, "/criar/I");
  await expect(
    page.getByText(/Nenhum dado existente foi substituído/),
  ).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toHaveCount(0);
  await expect(page.getByLabel("Restaurar backup completo")).toBeVisible();
});
test("abre pelo teclado, transfere foco e não depende de animações", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Iniciar experiência", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Pular abertura" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Nome completo", { exact: true })).toBeVisible();
  await expect(
    page.getByLabel("Nome completo", { exact: true }),
  ).not.toBeFocused();
});
