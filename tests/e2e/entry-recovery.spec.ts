import { chromium, expect, test } from "@playwright/test";

test("recarregar durante a preparação não consome a abertura da primeira carta", async ({
  baseURL,
}, info) => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const context = await browser.newContext({
    viewport:
      info.project.name === "mobile"
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "3d"),
  );
  let release!: () => void, requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const request = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await context.route("**/assets/redesign/chapter-i-*.glb", async (route) => {
    requested();
    await gate;
    // Reload cancels the old scene's HEAD request.
    if (!route.request().failure()) await route.continue();
  });
  const page = await context.newPage();
  try {
    await page.goto(baseURL!);
    await page
      .getByRole("button", { name: "Iniciar experiência", exact: true })
      .click();
    await request;
    await page.waitForTimeout(900);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-entry",
      "opening",
    );
    await expect(
      page.getByText("Preparando a carta e o cenário…", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-entry",
      "waiting",
    );
    await expect(
      page.getByRole("button", { name: "Iniciar experiência", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Continuar minha história",
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(page.locator("canvas, .cinema-fields")).toHaveCount(0);
    release();
    await page
      .getByRole("button", { name: "Entrar no cenário leve", exact: true })
      .click();
    await expect(page.locator("#I01")).toBeEnabled();
  } finally {
    release();
    await context.close();
    await browser.close();
  }
});
