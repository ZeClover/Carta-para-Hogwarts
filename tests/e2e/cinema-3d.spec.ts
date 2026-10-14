import { chromium, expect, test } from "@playwright/test";
test("cena fullscreen 3D vira páginas, mantém campos e adapta viewport", async ({
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  try {
    const mobile = info.project.name === "mobile";
    const page = await browser.newPage({
      deviceScaleFactor: mobile ? 2 : 1,
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 720 },
    });
    if (mobile)
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "deviceMemory", { get: () => 4 });
        Object.defineProperty(navigator, "hardwareConcurrency", {
          get: () => 4,
        });
      });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (message.type() === "error")
        errors.push(`${message.text()} (${message.location().url})`);
    });
    await page.addInitScript(() =>
      localStorage.setItem("hogwarts-scene", "light"),
    );
    await page.clock.install();
    await page.goto(`${baseURL}/experiencia`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 20000 },
    );
    // The first drawn mesh precedes the intro and its final camera cut. Let the
    // real reading state settle before freezing timers for page-curl assertions.
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 20000 },
    );
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 30000));
    await page.locator("#I01").fill("Estudante do Registro Mágico");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator(".cinema")).toHaveAttribute("data-phase", "turn");
    await page.clock.fastForward(120);
    const canvas = page.locator(".study-scene canvas");
    if (mobile)
      await expect
        .poll(() =>
          canvas.evaluate(
            (el) => (el as HTMLCanvasElement).width / el.clientWidth,
          ),
        )
        .toBe(1);
    await expect(canvas).toHaveAttribute("data-page-direction", "1");
    expect(Number(await canvas.getAttribute("data-page-curl"))).toBeGreaterThan(
      0.1,
    );
    await page.screenshot({ path: info.outputPath("page-turn-forward.png") });
    await page.clock.fastForward(2300);
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-active",
      "true",
      { timeout: 20000 },
    );
    await expect(page.locator("#I02")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".cinema-writing")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: info.outputPath("cinema-3d.png"),
    });
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator(".cinema")).toHaveAttribute("data-phase", "turn");
    await page.clock.fastForward(120);
    await expect(canvas).toHaveAttribute("data-page-direction", "-1");
    expect(Number(await canvas.getAttribute("data-page-curl"))).toBeGreaterThan(
      0.1,
    );
    await page.screenshot({ path: info.outputPath("page-turn-back.png") });
    await page.getByRole("button", { name: "Pular animações" }).click();
    await expect(page.locator("#I01")).toHaveValue(
      "Estudante do Registro Mágico",
    );
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#I02")).toBeVisible();
    await page.clock.resume();
    await page.locator("#I02").fill("Registro");
    await page.setViewportSize({ width: mobile ? 390 : 800, height: 350 });
    await expect(page.locator(".cinema")).toHaveCSS("height", "350px", {
      timeout: 20000,
    });
    await expect(page.locator("#I02")).toBeVisible({ timeout: 20000 });
    await page
      .getByRole("button", { name: "Continuar", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: info.outputPath("cinema-keyboard.png"),
    });
    await page
      .locator(".study-scene canvas")
      .evaluate((canvas) =>
        (canvas as HTMLCanvasElement)
          .getContext("webgl2")
          ?.getExtension("WEBGL_lose_context")
          ?.loseContext(),
      );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await expect(page.locator("#I02")).toHaveValue("Registro");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#I03")).toBeVisible({ timeout: 20000 });
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
