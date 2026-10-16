import { goTo, reloadPage } from "./navigation";
import { chromium, expect, test } from "@playwright/test";

const gpu = [
  "--enable-unsafe-swiftshader",
  "--use-angle=swiftshader",
  "--ignore-gpu-blocklist",
];

test("replay IV anima mesmo se o driver nunca confirmar a compilação assíncrona", async ({
  baseURL,
}, info) => {
  test.setTimeout(110000);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: gpu,
  });
  const context = await browser.newContext({
    viewport:
      info.project.name === "mobile"
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    recordVideo: { dir: info.outputPath("replay-video") },
  });
  await context.addInitScript(() => {
    localStorage.setItem("hogwarts-scene", "light");
    const samples: number[] = [];
    Object.assign(window, { deliverySamples: samples });
    const originalExtension = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (
      this: WebGL2RenderingContext,
      name: string,
    ) {
      if (name === "KHR_parallel_shader_compile")
        return { COMPLETION_STATUS_KHR: 0x91b1 };
      return Reflect.apply(originalExtension, this, [name]);
    } as typeof originalExtension;
    const originalParameter =
      WebGL2RenderingContext.prototype.getProgramParameter;
    WebGL2RenderingContext.prototype.getProgramParameter = function (
      program: WebGLProgram,
      parameter: number,
    ) {
      if (parameter === 0x91b1) return false;
      return originalParameter.call(this, program, parameter);
    };
    new MutationObserver(() => {
      const canvas = document.querySelector("canvas[data-hallway-progress]");
      if (canvas)
        samples.push(Number(canvas.getAttribute("data-hallway-progress")));
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-hallway-progress"],
    });
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=IV`);
    await page.locator("#IV01").selectOption({ label: "Coruja" });
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
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 45000 },
    );
    const samples = await page.evaluate(
      () =>
        (window as unknown as { deliverySamples: number[] }).deliverySamples,
    );
    expect(
      samples.some((p) => p > 0.05 && p < 0.95),
      "A carta deve voar de verdade, sem saltar da espera para a posição final",
    ).toBe(true);
    await expect(page.locator("#IV01")).toHaveValue("Coruja");
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-hallway-state",
      "settled",
    );
    await page.screenshot({
      path: info.outputPath("driver-replay-completed.png"),
      scale: "css",
    });
    const pose = await page.locator("canvas").getAttribute("data-camera");
    await page.waitForTimeout(300);
    expect(await page.locator("canvas").getAttribute("data-camera")).toBe(pose);
    await reloadPage(page);
    await expect(page.locator("#IV01")).toHaveValue("Coruja");
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("download travado libera perguntas, explica a falha e permite tentar a animação novamente", async ({
  baseURL,
}, info) => {
  test.setTimeout(110000);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: gpu,
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
    await goTo(page, `${baseURL}/experiencia?capitulo=IV`);
    await page.locator("#IV01").selectOption({ label: "Coruja" });
    await page
      .getByRole("button", { name: "Ver animação", exact: true })
      .click();
    await request;
    // Use real timers through renderer teardown/recreation. Fast-forwarding
    // that lifecycle also jumps Three's clock and can strand its demand loop.
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 35000 },
    );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-fallback-reason",
      "timeout",
    );
    await expect(page.locator("#IV01")).toHaveValue("Coruja");
    await page.locator(".scene-support summary").click();
    await expect(page.locator(".scene-support p")).toContainText(
      "suas respostas continuam salvas",
    );
    await page.screenshot({
      path: info.outputPath("timeout-explained.png"),
      scale: "css",
    });
    await page.locator(".scene-support summary").click();
    release();
    await page
      .getByRole("button", { name: "Ativar cenário 3D", exact: true })
      .click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-entrance-phase",
      "playing",
      { timeout: 45000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-fallback-reason",
      "none",
    );
    await expect(page.locator("#IV01")).toHaveValue("Coruja");
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
    );
  } finally {
    release();
    await context.close();
    await browser.close();
  }
});

for (const mode of ["unavailable", "throws"] as const) {
  test(`WebGL ${mode}: replay explica a limitação e mantém respostas utilizáveis`, async ({
    baseURL,
  }, info) => {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
    const context = await browser.newContext({
      viewport:
        info.project.name === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
    });
    await context.addInitScript((mode) => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...args: unknown[]
      ) {
        if (kind.includes("webgl")) {
          if (mode === "throws") throw new Error("Browser policy denied WebGL");
          return null;
        }
        return original.apply(this, [kind, ...args] as Parameters<
          typeof original
        >);
      } as typeof original;
    }, mode);
    const page = await context.newPage(),
      errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    try {
      await goTo(page, `${baseURL}/experiencia?capitulo=IV`);
      await page.locator("#IV01").selectOption({ label: "Coruja" });
      await page
        .getByRole("button", { name: "Ver animação", exact: true })
        .click();
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-replay-version",
        "1",
      );
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-interaction-ready",
        "true",
      );
      await expect(
        page.getByText("3D indisponível neste navegador", { exact: true }),
      ).toBeVisible();
      await expect(page.locator("#IV01")).toBeEnabled();
      await expect(page.locator("#IV01")).toHaveValue("Coruja");
      await page.locator(".scene-support summary").click();
      await expect(page.locator(".scene-support p")).toContainText(
        "aceleração gráfica",
      );
      await page.screenshot({
        path: info.outputPath(`webgl-${mode}.png`),
        scale: "css",
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await reloadPage(page);
      await expect(page.locator("#IV01")).toHaveValue("Coruja");
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      await browser.close();
    }
  });
}
