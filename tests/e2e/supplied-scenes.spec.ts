import { goTo, reloadPage } from "./navigation";
import { chromium, expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import mirror from "../../src/content/mirror.json" with { type: "json" };
import armillary from "../../src/content/armillary.json" with { type: "json" };
const gpuArgs = [
  "--enable-unsafe-swiftshader",
  "--use-angle=swiftshader",
  "--ignore-gpu-blocklist",
];

test("V: moldura original, reflexo arquitetônico legível e câmera parada durante a edição", async ({
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const mobile = info.project.name === "mobile";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: gpuArgs,
  });
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    localStorage.setItem("hogwarts-scene", "light");
    const samples: { p: number; camera: string | null }[] = [];
    Object.assign(window, { mirrorSamples: samples });
    new MutationObserver(() => {
      const el = document.querySelector("canvas[data-mirror-progress]");
      if (el && samples.length < 300)
        samples.push({
          p: Number(el.getAttribute("data-mirror-progress")),
          camera: el.getAttribute("data-camera"),
        });
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-mirror-progress"],
    });
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=V`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const canvas = page.locator("canvas");
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-mirror-asset", mirror.sha256);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute(
      "data-mirror-reflection",
      "planar-room",
    );
    await expect(canvas).toHaveAttribute("data-mirror-progress", "1.000");
    const pose = await canvas.getAttribute("data-camera");
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            mirrorSamples: { p: number; camera: string }[];
          }
        ).mirrorSamples,
    );
    expect(
      samples.some((s) => s.p > 0.1 && s.p < 0.9 && s.camera !== pose),
    ).toBe(true);
    await page.waitForTimeout(400);
    const bounds = JSON.parse(
      (await canvas.getAttribute("data-mirror-bounds"))!,
    );
    const image = await page.screenshot({
      path: info.outputPath("mirror-reflection.png"),
      timeout: 60000,
    });
    const crop = {
      left: Math.round(bounds.x + bounds.width * 0.2),
      top: Math.round(bounds.y + bounds.height * 0.2),
      width: Math.round(bounds.width * 0.6),
      height: Math.round(bounds.height * 0.6),
    };
    const stats = await sharp(image).extract(crop).stats();
    // Actual reflected pixels must be bright and contain architectural variation.
    expect(
      stats.channels.slice(0, 3).reduce((sum, c) => sum + c.mean, 0) / 3,
    ).toBeGreaterThan(45);
    expect(
      Math.max(...stats.channels.slice(0, 3).map((c) => c.stdev)),
    ).toBeGreaterThan(5);
    const curious = page.getByRole("checkbox", {
      name: "Curioso",
      exact: true,
    });
    await expect(curious).not.toBeChecked();
    await curious.check();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#V02")).toHaveValue("");
    const reflections = await canvas.getAttribute("data-mirror-reflections");
    await page
      .locator("#V02")
      .fill("Esta qualidade foi escolhida por mim, não pelo espelho.");
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    expect(await canvas.getAttribute("data-mirror-reflections")).toBe(
      reflections,
    );
    await page.setViewportSize({
      width: mobile ? 390 : 1440,
      height: mobile ? 520 : 750,
    });
    await expect(page.locator("#V02")).toBeFocused();
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    await reloadPage(page);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(page.locator("#V02")).toHaveValue(
      "Esta qualidade foi escolhida por mim, não pelo espelho.",
    );
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(curious).toBeChecked();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("VI: anel separado, base fixa, ampulheta clara e respostas preservadas", async ({
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const mobile = info.project.name === "mobile";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: gpuArgs,
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
      p: number;
      ring: string | null;
      base: string | null;
      camera: string | null;
    }[] = [];
    Object.assign(window, { armillarySamples: samples });
    new MutationObserver(() => {
      const el = document.querySelector("canvas[data-armillary-progress]");
      if (el && samples.length < 300)
        samples.push({
          p: Number(el.getAttribute("data-armillary-progress")),
          ring: el.getAttribute("data-armillary-ring"),
          base: el.getAttribute("data-armillary-base"),
          camera: el.getAttribute("data-camera"),
        });
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-armillary-progress"],
    });
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=VI`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const canvas = page.locator("canvas");
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute(
      "data-armillary-asset",
      armillary.sha256,
    );
    await expect(canvas).toHaveAttribute(
      "data-protagonist",
      "armillary-sphere",
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-armillary-progress", "1.000");
    const pose = await canvas.getAttribute("data-camera"),
      ring = await canvas.getAttribute("data-armillary-ring"),
      base = await canvas.getAttribute("data-armillary-base");
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            armillarySamples: {
              p: number;
              ring: string;
              base: string;
              camera: string;
            }[];
          }
        ).armillarySamples,
    );
    const middle = samples.find(
      (s) => s.p > 0.15 && s.p < 0.85 && s.ring && s.camera,
    );
    expect(middle).toBeDefined();
    expect(middle!.ring).not.toBe(ring);
    expect(middle!.camera).not.toBe(pose);
    expect(samples.filter((s) => s.base).every((s) => s.base === base)).toBe(
      true,
    );
    const glass = JSON.parse(
      (await canvas.getAttribute("data-hourglass-glass"))!,
    );
    expect(glass.color.every((channel: number) => channel > 0.8)).toBe(true);
    expect(glass.transmission).toBe(0);
    expect(glass.opacity).toBe(0.2);
    for (const attribute of ["data-hero-bounds", "data-secondary-bounds"]) {
      const b = JSON.parse((await canvas.getAttribute(attribute))!);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    }
    await page.screenshot({
      path: info.outputPath("sphere-and-hourglass.png"),
      timeout: 60000,
    });
    await expect(page.locator("#VI01")).toHaveValue("");
    await page
      .locator("#VI01")
      .fill("Este sonho fictício é meu, não um símbolo imposto.");
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    expect(await canvas.getAttribute("data-armillary-ring")).toBe(ring);
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#VI02")).toHaveValue("");
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator("#VI01")).toHaveValue(
      "Este sonho fictício é meu, não um símbolo imposto.",
    );
    await page.getByRole("button", { name: "Pular animações" }).click();
    await expect(canvas).toHaveAttribute("data-armillary-state", "settled");
    await page.getByRole("button", { name: "Usar cenário leve" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await page.getByRole("button", { name: "Sair e continuar depois" }).click();
    await goTo(page, `${baseURL}/experiencia`);
    await expect(page.locator("#VI01")).toHaveValue(
      "Este sonho fictício é meu, não um símbolo imposto.",
    );
    // Evaluate reading contrast after the question's entrance fade has settled.
    await expect(page.locator("#VI01")).toBeEnabled();
    await expect(page.locator(".cinema-writing")).toHaveCSS("opacity", "1");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});
