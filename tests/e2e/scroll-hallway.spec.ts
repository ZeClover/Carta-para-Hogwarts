import { goTo, reloadPage } from "./navigation";
import { chromium, expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import scroll from "../../src/content/scroll.json" with { type: "json" };
import hallway from "../../src/content/hallway.json" with { type: "json" };
const gpu = [
  "--enable-unsafe-swiftshader",
  "--use-angle=swiftshader",
  "--ignore-gpu-blocklist",
];
test("IV: entrada vinda de III aguarda o modelo antes de voar e liberar a pergunta", async ({
  baseURL,
}, info) => {
  test.setTimeout(150000);
  const mobile = info.project.name === "mobile";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: gpu,
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
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  await context.route("**/assets/hallway/*.glb", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    const page = await context.newPage();
    await goTo(page, `${baseURL}/experiencia?capitulo=III`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /IV — O Chamado/ }).click();
    await expect(page.locator(".cinema")).toHaveAttribute("data-chapter", "IV");
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeDisabled();
    await expect(page.locator(".cinema-document-layout")).toHaveCSS(
      "opacity",
      "0",
    );
    release();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-hallway-state", "delivering", {
      timeout: 30000,
    });
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeDisabled();
    await expect(canvas).toHaveAttribute("data-hallway-progress", "1.000", {
      timeout: 30000,
    });
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(page.locator("#IV01")).toBeEnabled();
    const pose = await canvas.getAttribute("data-camera");
    await page.waitForTimeout(250);
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
  } finally {
    release();
    await context.close();
    await browser.close();
  }
});
test("II: pergaminho original, família e respostas preservadas com câmera estável", async ({
  baseURL,
}, info) => {
  test.setTimeout(180000);
  const mobile = info.project.name === "mobile",
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: gpu,
    });
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "light"),
  );
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=II`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-scroll-asset", scroll.sha256);
    await expect(canvas).toHaveAttribute("data-protagonist", "ancient-scroll");
    await expect(canvas).toHaveAttribute("data-scroll-progress", "1.000");
    const pose = await canvas.getAttribute("data-camera");
    await expect(page.locator("#family")).toHaveValue("");
    await page.locator("#family").selectOption("black");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#II01-title")).toBeVisible();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#II02")).toHaveValue("");
    await page
      .locator("#II02")
      .fill(
        "Este lugar fictício é uma escolha minha, não uma memória imposta.",
      );
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    await page.locator("#II02").focus();
    await page.setViewportSize({
      width: mobile ? 390 : 1440,
      height: mobile ? 520 : 750,
    });
    await expect(page.locator("#II02")).toBeFocused();
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    await reloadPage(page);
    await expect(page.locator("#II02")).toHaveValue(
      "Este lugar fictício é uma escolha minha, não uma memória imposta.",
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator("#II01-title")).toBeVisible();
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator("#family")).toHaveValue("black");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});
test("IV: carta voa de verdade, câmera para e chegada não se repete na retomada", async ({
  baseURL,
}, info) => {
  test.setTimeout(210000);
  const mobile = info.project.name === "mobile",
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: gpu,
    });
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    recordVideo: {
      dir: info.outputPath("arrival-video"),
      size: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    },
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("hogwarts-scene"))
      localStorage.setItem("hogwarts-scene", "light");
    const samples: {
      p: number;
      position: string | null;
      camera: string | null;
    }[] = [];
    Object.assign(window, { hallwaySamples: samples });
    new MutationObserver(() => {
      const c = document.querySelector("canvas[data-hallway-progress]");
      if (c && samples.length < 400)
        samples.push({
          p: Number(c.getAttribute("data-hallway-progress")),
          position: c.getAttribute("data-delivery-position"),
          camera: c.getAttribute("data-camera"),
        });
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-hallway-progress"],
    });
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=IV`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute(
      "data-protagonist",
      "victorian-hallway",
    );
    await expect(canvas).toHaveAttribute("data-hallway-progress", "1.000");
    await expect(canvas).toHaveAttribute(
      "data-hallway-asset",
      (mobile ? hallway.mobile : hallway).sha256,
    );
    const pose = await canvas.getAttribute("data-camera"),
      position = await canvas.getAttribute("data-delivery-position");
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            hallwaySamples: { p: number; position: string; camera: string }[];
          }
        ).hallwaySamples,
    );
    expect(
      samples.some(
        (s) =>
          s.p > 0.45 &&
          s.p < 0.9 &&
          s.position !== position &&
          s.camera !== pose,
      ),
    ).toBe(true);
    const bounds = JSON.parse(
      (await canvas.getAttribute("data-delivery-bounds"))!,
    );
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
    await page.screenshot({ path: info.outputPath("arrival-settled.png") });
    await expect(page.locator("#IV01")).toHaveValue("");
    await page.locator("#IV01").selectOption("Outra forma");
    await page
      .getByLabel("Conte mais sobre sua resposta", { exact: true })
      .fill("Escolha fictícia do jogador preservada depois da chegada.");
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    // Existing progress suppresses arrival even without its new display-only flag.
    await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k.startsWith("hogwarts-hallway-entry:"))
        .forEach((k) => localStorage.removeItem(k)),
    );
    await reloadPage(page);
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute("data-hallway-resumed", "true");
    await expect(canvas).toHaveAttribute("data-hallway-progress", "1.000");
    expect(
      await page.evaluate(() =>
        (
          window as unknown as { hallwaySamples: { p: number }[] }
        ).hallwaySamples.every((s) => s.p === 1),
      ),
    ).toBe(true);
    await expect(page.locator("#IV01")).toHaveValue("Outra forma");
    await expect(
      page.getByLabel("Conte mais sobre sua resposta", { exact: true }),
    ).toHaveValue("Escolha fictícia do jogador preservada depois da chegada.");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#IV02-title")).toBeVisible();
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await expect(page.locator("#IV01")).toHaveValue("Outra forma");
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /III — O Despertar/ }).click();
    await expect(canvas).toHaveAttribute("data-protagonist", "ink-quill", {
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Pular animações" }).click();
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /VII — Laços/ }).click();
    await expect(canvas).toHaveAttribute("data-protagonist", "victorian-desk", {
      timeout: 30000,
    });
    await expect(canvas).toHaveAttribute(
      "data-photo-box-clip",
      "Open and Close",
    );
    await page.getByRole("button", { name: "Pular animações" }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});
test("IV: pular assenta a carta; movimento reduzido e ausência de WebGL mantêm perguntas", async ({
  baseURL,
}, info) => {
  test.setTimeout(90000);
  const mobile = info.project.name === "mobile",
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: gpu,
    });
  try {
    const context = await browser.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      reducedMotion: "no-preference",
    });
    await context.addInitScript(() =>
      localStorage.setItem("hogwarts-scene", "3d"),
    );
    const page = await context.newPage();
    await goTo(page, `${baseURL}/experiencia?capitulo=IV`);
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-hallway-state", "delivering", {
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Pular animações" }).click();
    await expect(canvas).toHaveAttribute("data-hallway-progress", "1.000");
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
    );
    await expect(page.locator("#IV01")).toBeEnabled();
    await page.emulateMedia({ reducedMotion: "reduce" });
    const pose = await canvas.getAttribute("data-camera");
    await page.waitForTimeout(200);
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    await context.close();
  } finally {
    await browser.close();
  }
  const fallback = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: ["--disable-webgl", "--disable-webgl2"],
  });
  try {
    const context = await fallback.newContext({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await goTo(page, `${baseURL}/experiencia?capitulo=IV`);
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await expect(page.locator("#IV01")).toBeEnabled();
    await page.locator("#IV01").selectOption("Familiar");
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    await reloadPage(page);
    await expect(page.locator("#IV01")).toHaveValue("Familiar");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  } finally {
    await fallback.close();
  }
});
