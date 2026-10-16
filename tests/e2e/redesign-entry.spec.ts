import { goTo, reloadPage } from "./navigation";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("após iniciar, pular é idempotente e a raiz retoma o cursor salvo", async ({
  page,
}) => {
  await goTo(page, "/");
  await expect(page.locator(".cinema")).toHaveAttribute(
    "data-entry",
    "opening",
  );
  await expect(
    page.getByRole("button", { name: "Pular abertura" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Abrir a carta de Hogwarts" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Pular abertura" }).click();
  await expect(page.locator("#I01")).toBeVisible();
  await expect(page.locator("#I01")).not.toBeFocused();
  await page
    .getByRole("button", { name: "Pular animações", exact: true })
    .click();
  await page.locator("#I01").fill("Registro de teste — sem história inventada");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#I02")).toBeVisible();
  await goTo(page, "/");
  await expect(page.locator("#I02")).toBeVisible();
  await expect(page.locator(".cinema")).toHaveAttribute(
    "data-entry",
    "reading",
  );
  await expect(
    page.getByRole("button", { name: "Pular abertura" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator("#I01")).toHaveValue(
    "Registro de teste — sem história inventada",
  );
});

test("após iniciar, movimento reduzido mostra a pergunta e retomada não repete abertura", async ({
  page,
}) => {
  await goTo(page, "/");
  await expect(page.locator("#I01")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".cinema")).toHaveAttribute(
    "data-entry",
    "reading",
  );
  await expect(page.locator("#I01")).not.toBeFocused();
  await reloadPage(page);
  await expect(page.locator("#I01")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pular abertura" }),
  ).toHaveCount(0);
});

test("falha na leitura bloqueia gravação e preserva o registro existente", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goTo(page, "/");
  await page.locator("#I01").fill("Registro anterior protegido");
  await expect(page.locator(".cinema-save")).toHaveText(
    "Salvo neste navegador.",
  );
  await page.addInitScript(() => {
    const original = IDBDatabase.prototype.transaction;
    (window as unknown as { writes: number }).writes = 0;
    IDBDatabase.prototype.transaction = function (
      this: IDBDatabase,
      ...args: Parameters<typeof original>
    ) {
      if (args[1] === "readwrite")
        (window as unknown as { writes: number }).writes++;
      if (args[1] === undefined || args[1] === "readonly")
        throw new Error("Simulated read failure");
      return original.apply(this, args);
    } as typeof original;
  });
  await reloadPage(page);
  await expect(page.locator("main [role=alert]")).toContainText(
    "Nenhum dado existente foi substituído",
  );
  await expect(page.locator("#I01")).toHaveCount(0);
  await page.waitForTimeout(650);
  expect(
    await page.evaluate(() => (window as unknown as { writes: number }).writes),
  ).toBe(0);
  await expect(page.getByLabel("Restaurar backup completo")).toBeVisible();
});

test("reflow 320px, redução persistente, navegação por teclado e texto longo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 680 });
  await goTo(page, "/experiencia?capitulo=VI");
  await page
    .locator("#VI01")
    .fill("Uma resposta inteiramente editável. ".repeat(70));
  await page.locator("#VI01").focus();
  await page.keyboard.press("End");
  const selection = await page.locator("#VI01").evaluate((e) => ({
    start: (e as HTMLTextAreaElement).selectionStart,
    end: (e as HTMLTextAreaElement).selectionEnd,
  }));
  await page.setViewportSize({ width: 320, height: 350 });
  await expect(page.locator("#VI01")).toBeFocused();
  expect(
    await page.locator("#VI01").evaluate((e) => ({
      start: (e as HTMLTextAreaElement).selectionStart,
      end: (e as HTMLTextAreaElement).selectionEnd,
    })),
  ).toEqual(selection);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".cinema-save")).toHaveText(
    "Salvo neste navegador.",
  );
  await page
    .getByRole("button", { name: "Reduzir movimento", exact: true })
    .click();
  await reloadPage(page);
  await expect(
    page.getByRole("button", { name: "Reduzir movimento", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#VI01")).toHaveValue(
    "Uma resposta inteiramente editável. ".repeat(70),
  );
  await page.setViewportSize({ width: 320, height: 680 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("áudio negado continua silencioso e não bloqueia a resposta", async ({
  page,
}) => {
  await page.addInitScript(() => {
    AudioContext.prototype.resume = () =>
      Promise.reject(new DOMException("Denied", "NotAllowedError"));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goTo(page, "/");
  await page.getByRole("button", { name: "Capítulos e opções" }).click();
  await page.getByRole("button", { name: "Ativar som de papel" }).click();
  await expect(
    page.getByText(
      "O som não está disponível. Você pode continuar em silêncio.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ativar som de papel" }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Voltar à cena" }).click();
  await page.locator("#I01").fill("Resposta sem áudio");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#I02")).toBeVisible();
});

test("modelo crítico 404 mantém cenário leve, edição e salvamento", async ({
  baseURL,
}, info) => {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  try {
    const context = await browser.newContext({
      viewport:
        info.project.name === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(() =>
      localStorage.setItem("hogwarts-scene", "light"),
    );
    const page = await context.newPage();
    await page.route("**/assets/redesign/chapter-i-*.glb", (route) =>
      route.fulfill({ status: 404, body: "Missing asset" }),
    );
    await goTo(page, baseURL!);
    await page.locator("#I01").fill("Registro preservado sem modelo");
    const missing = page.waitForResponse(
      (response) =>
        response.url().includes("/assets/redesign/chapter-i-") &&
        response.status() === 404,
    );
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await missing;
    await expect(
      page.getByRole("button", { name: "Usar cenário leve" }),
    ).toHaveCount(0);
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await expect(page.locator("#I01")).toHaveValue(
      "Registro preservado sem modelo",
    );
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#I02")).toBeVisible();
    await reloadPage(page);
    await expect(page.locator("#I02")).toBeVisible();
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator("#I01")).toHaveValue(
      "Registro preservado sem modelo",
    );
  } finally {
    await browser.close();
  }
});
