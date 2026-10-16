import { chromium, expect, test } from "@playwright/test";
import ink from "../../src/content/ink-quill.json" with { type: "json" };
import { goTo } from "./navigation";

test("um GET de modelo que falhou não fica preso no cache ao tentar novamente", async ({
  baseURL,
}, info) => {
  test.setTimeout(120000);
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
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "light"),
  );
  let downloads = 0;
  await context.route("**" + ink.path, async (route) => {
    if (route.request().method() === "GET" && ++downloads === 1)
      await route.fulfill({
        status: 503,
        contentType: "text/plain",
        body: "Temporary model failure injected by audit",
      });
    else await route.continue();
  });
  const page = await context.newPage();
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=III`);
    await page.locator("#III01").selectOption("incerto");
    await page
      .getByRole("button", { name: "Ativar cenário 3D", exact: true })
      .click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-fallback-reason",
      "error",
      { timeout: 30000 },
    );
    await expect(page.locator("#III01")).toBeEnabled();
    await expect(page.locator("#III01")).toHaveValue("incerto");
    await page.screenshot({
      path: info.outputPath("temporary-model-failure.png"),
      scale: "css",
    });
    await page
      .getByRole("button", { name: "Ativar cenário 3D", exact: true })
      .click();
    await expect.poll(() => downloads, { timeout: 10000 }).toBeGreaterThan(1);
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 45000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-ink-asset",
      ink.sha256,
    );
    await expect(page.locator("#III01")).toHaveValue("incerto");
    await page
      .getByRole("button", { name: "Ver animação", exact: true })
      .click();
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-replay-version",
      "1",
    );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 45000 },
    );
    await expect(page.locator("#III01")).toBeEnabled();
    await expect(page.locator("#III01")).toHaveValue("incerto");
    await page.screenshot({
      path: info.outputPath("model-retry-recovered.png"),
      scale: "css",
    });
  } finally {
    await context.close();
    await browser.close();
  }
});
