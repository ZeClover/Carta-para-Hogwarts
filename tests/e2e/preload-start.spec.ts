import { chromium, expect, test } from "@playwright/test";

for (const chapter of ["I", "IV", "VII"]) {
  test(`${chapter}: prepara o 3D antes do clique sem consumir a animação ou remontar o Canvas`, async ({
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
      reducedMotion: "no-preference",
    });
    await context.addInitScript(() => {
      localStorage.setItem("hogwarts-scene", "3d");
      Object.assign(window, { preloadSamples: [] });
      new MutationObserver(() => {
        const canvas = document.querySelector("canvas");
        if (!canvas) return;
        (
          window as unknown as { preloadSamples: unknown[] }
        ).preloadSamples.push({
          flap: Number(canvas.getAttribute("data-envelope-flap")),
          flight: Number(canvas.getAttribute("data-hallway-progress")),
          lid: Number(canvas.getAttribute("data-photo-box-time")),
        });
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeFilter: [
          "data-envelope-flap",
          "data-hallway-progress",
          "data-photo-box-time",
        ],
      });
    });
    const page = await context.newPage(),
      models: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".glb") && request.method() === "GET")
        models.push(request.url());
    });
    try {
      await page.goto(`${baseURL}/experiencia?capitulo=${chapter}`);
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-entry",
        "waiting",
      );
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-preload-ready",
        "true",
        { timeout: 45000 },
      );
      await expect(page.locator(".study-scene")).toHaveAttribute(
        "data-renderer",
        "3d",
      );
      expect(models.length).toBeGreaterThan(0);
      const canvas = page.locator("canvas"),
        attribute =
          chapter === "I"
            ? "data-envelope-flap"
            : chapter === "IV"
              ? "data-hallway-progress"
              : "data-photo-box-time";
      await expect(page.locator(".study-scene")).toHaveAttribute("inert", "");
      await expect(canvas).toHaveAttribute("data-camera-state", "waiting");
      expect(Number(await canvas.getAttribute(attribute))).toBe(0);
      const camera = await canvas.getAttribute("data-camera");
      await info.attach("preloaded-scene-state", {
        body: JSON.stringify(
          await canvas.evaluate((el) => ({ ...el.dataset })),
          null,
          2,
        ),
        contentType: "application/json",
      });
      if (chapter === "IV")
        await expect(canvas).toHaveAttribute(
          "data-delivery-actual-position",
          "-3.4000,1.8500,0.3500",
        );
      await canvas.evaluate((el) =>
        el.setAttribute("data-preloaded-canvas", "same"),
      );
      await page.waitForTimeout(1200);
      expect(await canvas.getAttribute("data-camera")).toBe(camera);
      expect(Number(await canvas.getAttribute(attribute))).toBe(0);
      await expect(page.locator(".cinema-fields")).not.toBeVisible();
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).some((key) =>
            key.startsWith("hogwarts-hallway-entry:"),
          ),
        ),
      ).toBe(false);
      await page.screenshot({
        path: info.outputPath("preloaded-waiting.png"),
        scale: "css",
      });
      await page.evaluate(() => Object.assign(window, { preloadSamples: [] }));
      await page
        .getByRole("button", { name: "Iniciar experiência", exact: true })
        .click();
      await expect(page.locator(".study-scene")).not.toHaveAttribute("inert", "");
      await expect
        .poll(
          () =>
            page.evaluate((id) => {
              const samples = (
                window as unknown as {
                  preloadSamples: {
                    flap: number;
                    flight: number;
                    lid: number;
                  }[];
                }
              ).preloadSamples;
              return samples.some((sample) =>
                id === "I"
                  ? sample.flap < -0.1 && sample.flap > -2.8
                  : id === "IV"
                    ? sample.flight > 0.05 && sample.flight < 0.95
                    : sample.lid > 0.15 && sample.lid < 1.8,
              );
            }, chapter),
          { timeout: 45000 },
        )
        .toBe(true);
      await page.screenshot({
        path: info.outputPath("after-click-animation.png"),
        scale: "css",
      });
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-interaction-ready",
        "true",
        { timeout: 45000 },
      );
      await expect(canvas).toHaveAttribute("data-preloaded-canvas", "same");
      await expect(page.locator(".cinema-fields")).toBeEnabled();
    } finally {
      await context.close();
      await browser.close();
    }
  });
}
