import { chromium, expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("sete composições reconhecíveis, leitura acessível e viagem real de câmera", async ({
  baseURL,
}, info) => {
  test.setTimeout(480000);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const mobile = info.project.name === "mobile";
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "light"),
  );
  let page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    const objects = [
      "correspondence",
      "album",
      "ink-quill",
      "window-letter",
      "mirror",
      "armillary-sphere",
      "victorian-desk",
    ];
    const poses: string[] = [];
    for (const [i, chapter] of [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
    ].entries()) {
      await page.goto(`${baseURL}/experiencia?capitulo=${chapter}`);
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-chapter",
        chapter,
      );
      await expect(page.locator(`.chapter-art-${chapter}`)).toBeVisible();
      await page.screenshot({ path: info.outputPath(`light-${chapter}.png`) });
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
      await expect(page.locator(".study-scene")).toHaveAttribute(
        "data-renderer",
        "3d",
        { timeout: 20000 },
      );
      const canvas = page.locator("canvas");
      await expect(canvas).toHaveAttribute("data-protagonist", objects[i]);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: info.outputPath(`chapter-${chapter}.png`),
        timeout: 90000,
      });
      poses.push((await canvas.getAttribute("data-camera"))!);
      const writing = await page.locator(".cinema-writing").boundingBox();
      expect(writing!.x).toBeGreaterThanOrEqual(0);
      expect(writing!.x + writing!.width).toBeLessThanOrEqual(
        page.viewportSize()!.width,
      );
      await page
        .locator(".cinema-actions .button")
        .last()
        .scrollIntoViewIfNeeded();
      await expect(
        page.locator(".cinema-actions .button").last(),
      ).toBeInViewport();
    }
    expect(new Set(poses).size).toBe(7);
    await page.close();
    const filmed = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      reducedMotion: "reduce",
      recordVideo: {
        dir: info.outputPath("camera-video"),
        size: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
      },
    });
    page = await filmed.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(`${baseURL}/experiencia?capitulo=II`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 20000 },
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-protagonist",
      "album",
    );
    // A live menu transition retains the canvas instead of replacing it or reloading.
    const from = (await page.locator("canvas").getAttribute("data-camera"))!
      .split(",")
      .map(Number);
    await page
      .locator("canvas")
      .evaluate((el) => el.setAttribute("data-same-canvas", "yes"));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page
      .getByRole("button", { name: /V — Quem Você Realmente É/ })
      .click();
    await expect(page.locator(".cinema")).toHaveAttribute("data-chapter", "V", {
      timeout: 20000,
    });
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-protagonist",
      "mirror",
      { timeout: 20000 },
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-same-canvas",
      "yes",
    );
    await expect
      .poll(
        async () =>
          Number(
            (await page.locator("canvas").getAttribute("data-camera"))!.split(
              ",",
            )[0],
          ),
        { timeout: 20000 },
      )
      .toBeGreaterThan(from[0] + 45);
    await page.getByRole("button", { name: "Pular animações" }).click();
    const end = (await page.locator("canvas").getAttribute("data-camera"))!
      .split(",")
      .map(Number);
    expect(Math.abs(end[0] - from[0])).toBeGreaterThan(45);
    await page.screenshot({
      path: info.outputPath("camera-destination.png"),
      timeout: 90000,
    });
    await filmed.close();
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});
