import { chromium, expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import ink from "../../src/content/ink-quill.json" with { type: "json" };

test("pena se manifesta uma vez; leitura, edição e retomada preservam respostas", async ({
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const mobile = info.project.name === "mobile";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    localStorage.setItem("hogwarts-scene", "light");
    const samples: {
      progress: number;
      pose: string | null;
      camera: string | null;
    }[] = [];
    Object.assign(window, { inkSamples: samples });
    new MutationObserver(() => {
      const canvas = document.querySelector("canvas[data-ink-progress]");
      if (canvas && samples.length < 400)
        samples.push({
          progress: Number(canvas.getAttribute("data-ink-progress")),
          pose: canvas.getAttribute("data-ink-quill-pose"),
          camera: canvas.getAttribute("data-camera"),
        });
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-ink-progress"],
    });
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await page.goto(`${baseURL}/experiencia?capitulo=III`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const canvas = page.locator("canvas");
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-ink-asset", ink.sha256);
    await expect(canvas).toHaveAttribute("data-protagonist", "ink-quill");
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-ink-state", "settled");
    await expect(canvas).toHaveAttribute("data-ink-progress", "1.000");
    const pose = await canvas.getAttribute("data-ink-quill-pose"),
      camera = await canvas.getAttribute("data-camera");
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            inkSamples: { progress: number; pose: string; camera: string }[];
          }
        ).inkSamples,
    );
    const middle = samples.find(
      (s) => s.progress > 0.15 && s.progress < 0.85 && s.camera,
    );
    expect(middle).toBeDefined();
    expect(middle!.pose).not.toBe(pose);
    expect(middle!.camera).not.toBe(camera);
    const bounds = JSON.parse((await canvas.getAttribute("data-hero-bounds"))!);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await page.locator("#III01").selectOption("incerto");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#III02")).toHaveValue("");
    await page
      .locator("#III02")
      .fill("Esta lembrança foi criada por mim depois da animação.");
    await page.locator("#III02").focus();
    await page.waitForTimeout(700);
    expect(await canvas.getAttribute("data-camera")).toBe(camera);
    expect(await canvas.getAttribute("data-ink-quill-pose")).toBe(pose);
    await page.screenshot({
      path: info.outputPath("ink-quill-reading.png"),
      timeout: 60000,
    });
    await page.setViewportSize({
      width: mobile ? 390 : 1440,
      height: mobile ? 520 : 750,
    });
    await expect(page.locator("#III02")).toBeFocused();
    expect(await canvas.getAttribute("data-camera")).toBe(camera);
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    await page.reload();
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(page.locator("#III02")).toHaveValue(
      "Esta lembrança foi criada por mim depois da animação.",
    );
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator("#III01")).toHaveValue("incerto");
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /VII — Laços/ }).click();
    // Automatic cold-start limits can select the light scene on software GPUs.
    // Both modes must keep the box; explicit 3D retries have the existing longer budget.
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    const retry = page.getByRole("button", { name: "Ativar cenário 3D" });
    if (await retry.isVisible()) await retry.click();
    await expect(canvas).toHaveAttribute(
      "data-photo-box-clip",
      "Open and Close",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-photo-box-state", "open", {
      timeout: 30000,
    });
    await expect(
      page
        .getByRole("navigation", {
          name: "Fotografias do capítulo",
          exact: true,
        })
        .locator("button"),
    ).toHaveCount(10);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("pular manifestação assenta a pena e mantém o Canvas ao sair e voltar", async ({
  baseURL,
}, info) => {
  test.setTimeout(90000);
  const mobile = info.project.name === "mobile";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "light"),
  );
  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/experiencia?capitulo=II`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await page
      .locator("canvas")
      .evaluate((el) => el.setAttribute("data-retained-canvas", "yes"));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /III — O Despertar/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-ink-state",
      "manifesting",
      { timeout: 30000 },
    );
    await page.getByRole("button", { name: "Pular animações" }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-ink-state",
      "settled",
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-ink-progress",
      "1.000",
      { timeout: 30000 },
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-retained-canvas",
      "yes",
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
    );
    await page.locator("#III01").selectOption("sim");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.locator("#III02").fill("Texto preservado no cenário leve.");
    await page.getByRole("button", { name: "Usar cenário leve" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await expect(page.locator("#III02")).toHaveValue(
      "Texto preservado no cenário leve.",
    );
    await page.getByRole("button", { name: "Sair e continuar depois" }).click();
    await page.goto(`${baseURL}/experiencia`);
    await expect(page.locator("#III02")).toHaveValue(
      "Texto preservado no cenário leve.",
    );
  } finally {
    await context.close();
    await browser.close();
  }
});

test("III mantém perguntas sem WebGL; movimento reduzido e campos reais", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/experiencia?capitulo=III");
  await expect(page.locator(".cinema")).toHaveAttribute(
    "data-interaction-ready",
    "true",
  );
  await page.locator("#III01").selectOption("nao");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#III02")).toHaveValue("");
  await page.locator("#III02").fill("Memória livre, sem história automática.");
  await expect(page.locator(".cinema-save")).toHaveText(
    "Salvo neste navegador.",
  );
  await page.reload();
  await expect(page.locator("#III02")).toHaveValue(
    "Memória livre, sem história automática.",
  );
  await expect(page.locator(".study-scene")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
