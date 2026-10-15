import { chromium, expect, test } from "@playwright/test";

test("modelo carregado sem primeiro frame não prende o replay nem as respostas", async ({
  baseURL,
}, info) => {
  test.setTimeout(75000);
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
    localStorage.setItem("hogwarts-scene", "light"),
  );
  let release!: () => void, requested!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const request = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await context.route("**/assets/hallway/*.glb", async (route) => {
    if (route.request().method() === "GET") {
      requested();
      await gate;
    }
    await route.continue();
  });
  const page = await context.newPage();
  try {
    await page.clock.install();
    await page.goto(`${baseURL}/experiencia?capitulo=IV`);
    await page.locator("#IV01").selectOption({ label: "Coruja" });
    await page
      .getByRole("button", { name: "Ver animação", exact: true })
      .click();
    await request;
    // Drain the empty suspense frame, then simulate a stopped graphical loop
    // while downloads, decoding, React effects and ordinary timers still work.
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      Object.assign(window, {
        resumeSceneFrames: window.requestAnimationFrame,
      });
      window.requestAnimationFrame = () => 1;
    });
    release();
    // The director mounts only after the critical model has been decoded.
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-hallway-state",
      "delivering",
      { timeout: 30000 },
    );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-first-frame-ready",
      "false",
    );
    await page.clock.fastForward(31000);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
    );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-fallback-reason",
      "timeout",
    );
    await expect(page.locator("#IV01")).toBeEnabled();
    await expect(page.locator("#IV01")).toHaveValue("Coruja");
    await page.evaluate(() => {
      window.requestAnimationFrame = (
        window as unknown as { resumeSceneFrames: typeof requestAnimationFrame }
      ).resumeSceneFrames;
    });
    await page.screenshot({
      path: info.outputPath("frame-stall-recovered.png"),
      scale: "css",
    });
    await page.reload();
    await expect(page.locator("#IV01")).toHaveValue("Coruja");
  } finally {
    release();
    await context.close();
    await browser.close();
  }
});
