import { expect, test } from "@playwright/test";
test("abre a carta, salva três folhas e recupera o registro após reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir a carta de Hogwarts" }).click();
  await page.getByRole("link", { name: "Preencher meu registro" }).click();
  await page.getByLabel("Nome completo").fill("Eleanor Whitmore");
  await page.getByLabel("Data de nascimento").fill("1879-03-15");
  await page.getByRole("button", { name: "Próxima folha" }).click();
  await page.getByLabel("Lugar de nascimento").fill("Edimburgo");
  await page.getByLabel("Residência antes de Hogwarts").fill("Yorkshire");
  await expect(page.getByRole("status")).toHaveText("Salvo neste navegador.");
  await page.reload();
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
  await page.goto("/criar/I");
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
  await page.goto("/");
  await page
    .getByRole("button", { name: "Pular animação / reduzir movimento" })
    .click();
  await page.getByRole("link", { name: "Preencher meu registro" }).click();
  await page.getByRole("button", { name: "Folha 3: Seu retrato" }).click();
  await page
    .getByRole("button", { name: "Concluir Registro de Admissão" })
    .click();
  await expect(
    page.getByText("Revise os campos indicados antes de concluir."),
  ).toBeVisible();
  await expect(page.getByLabel("Nome completo")).toBeFocused();
  await page.getByLabel("Data de nascimento").fill("1870-03-15");
  await expect(page.getByText(/terá 20 anos/)).toBeVisible();
  await page
    .getByRole("button", { name: "Recomeçar história", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByLabel("Data de nascimento")).toHaveValue("1870-03-15");
});
test("restaura um backup legado e rejeita arquivo inválido sem apagar respostas", async ({
  page,
}) => {
  await page.goto("/criar/I");
  await page.getByLabel("Nome completo").fill("Registro preservado");
  await expect(page.getByRole("status")).toHaveText("Salvo neste navegador.");
  await page.getByText("Backup do registro da primeira versão").click();
  await page
    .getByLabel("Restaurar backup", { exact: true })
    .setInputFiles({
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
  await page
    .getByLabel("Restaurar backup", { exact: true })
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await expect(page.getByText("Cópia restaurada.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Nome completo")).toHaveValue(
    "Registro restaurado",
  );
});
test("falha de armazenamento é explícita e ainda permite baixar uma cópia", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.goto("/criar/I");
  await expect(
    page.getByText(/Nenhum dado existente foi substituído/),
  ).toBeVisible();
  await page.getByLabel("Nome completo").fill("Ainda posso preservar");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  expect((await download).suggestedFilename()).toContain("backup.json");
});
test("abre pelo teclado, transfere foco e não depende de animações", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Abrir a carta de Hogwarts" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("link", { name: "Preencher meu registro" }),
  ).toBeFocused();
});
