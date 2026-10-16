import { goTo, reloadPage } from "./navigation";
import { chromium, expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("entrada aguarda o cenário e mantém câmera parada ao liberar a escrita", async ({
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
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() =>
    localStorage.setItem("hogwarts-scene", "3d"),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await context.route("**/assets/photo-box/**", async (route) => {
    await gate;
    await route.continue();
  });
  const page = await context.newPage();
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=VII`);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-archive-loading",
      "true",
    );
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeDisabled();
    release();
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await page
      .getByRole("navigation", { name: "Fotografias do capítulo", exact: true })
      .locator('[data-photo-question="VII06"]')
      .click();
    await page
      .locator("#VII06")
      .fill("Registro fictício escrito depois da entrada.");
    const canvas = page.locator("canvas");
    const pose = (await canvas.count())
      ? await canvas.getAttribute("data-camera")
      : null;
    await page.waitForTimeout(1000);
    if (pose) expect(await canvas.getAttribute("data-camera")).toBe(pose);
    await expect(page.locator("#VII06")).toHaveValue(
      "Registro fictício escrito depois da entrada.",
    );
    expect(await page.locator("#VII06").isEnabled()).toBe(true);
  } finally {
    release();
    await context.close();
    await browser.close();
  }
});

test("caixa original abre, aproxima câmera, revela perguntas e preserva respostas", async ({
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
    recordVideo: {
      dir: info.outputPath("opening-video"),
      size: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    },
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("hogwarts-scene"))
      localStorage.setItem("hogwarts-scene", "light");
    const samples: {
      time: number;
      camera: string | null;
      lid: string | null;
      drawer: string | null;
    }[] = [];
    Object.assign(window, { photoBoxSamples: samples });
    new MutationObserver((changes) => {
      if (
        !changes.some(
          (change) => change.attributeName === "data-photo-box-time",
        )
      )
        return;
      const canvas = document.querySelector("canvas[data-photo-box-time]");
      if (canvas && samples.length < 300)
        samples.push({
          time: Number(canvas.getAttribute("data-photo-box-time")),
          camera: canvas.getAttribute("data-camera"),
          lid: canvas.getAttribute("data-photo-box-lid"),
          drawer: canvas.getAttribute("data-desk-drawer"),
        });
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-photo-box-time"],
    });
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await goTo(page, `${baseURL}/experiencia?capitulo=VII`);
    await expect(page.locator("#VII01-title")).toBeVisible();
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const canvas = page.locator("canvas");
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await expect(canvas).toHaveAttribute(
      "data-photo-box-clip",
      "Open and Close",
    );
    await expect(canvas).toHaveAttribute("data-photo-box-state", "open", {
      timeout: 30000,
    });
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
    );
    await expect(canvas).toHaveAttribute("data-photo-box-time", "1.984");
    await expect(canvas).toHaveAttribute("data-camera-state", "arrived");
    const pose = await canvas.getAttribute("data-camera"),
      lid = await canvas.getAttribute("data-photo-box-lid");
    expect(Math.abs(Number(lid!.split(",")[2]))).toBeGreaterThan(0.98);
    const samples = await page.evaluate(
      () =>
        (
          window as unknown as {
            photoBoxSamples: {
              time: number;
              camera: string | null;
              lid: string | null;
              drawer: string | null;
            }[];
          }
        ).photoBoxSamples,
    );
    expect(samples.some((s) => s.time > 0.1 && s.time < 1.8)).toBe(true);
    const middle = samples.find(
      (s) => s.time > 0.1 && s.time < 1.8 && s.camera,
    );
    expect(middle).toBeDefined();
    expect(middle!.camera).not.toBe(pose);
    expect(middle!.lid).not.toBe(lid);
    await expect(canvas).toHaveAttribute("data-protagonist", "victorian-desk");
    await expect(canvas).toHaveAttribute("data-desk-progress", "1.000");
    expect(middle!.drawer).not.toBe(
      await canvas.getAttribute("data-desk-drawer"),
    );
    await expect(canvas).toHaveAttribute("data-photo-anchor-camera", pose!);
    await expect(page.locator(".cinema-document-layout")).toHaveCSS(
      "opacity",
      "1",
    );
    const points = JSON.parse(
      (await canvas.getAttribute("data-photo-anchors"))!,
    );
    expect(points.every((p: { visible: boolean }) => p.visible)).toBe(true);
    await page.screenshot({
      path: info.outputPath("photo-box-open.png"),
      timeout: 60000,
    });
    const seventh = points.find((p: { id: string }) => p.id === "VII07");
    const hideHotspots = await page.addStyleTag({
      content: ".photo-hotspots { visibility:hidden!important }",
    });
    await page.mouse.click(seventh.x, seventh.y);
    await expect(page.locator("#VII07")).toBeVisible();
    await hideHotspots.evaluate((el) => (el as Element).remove());
    const nativePhotos = page.getByRole("navigation", {
      name: "Fotografias do capítulo",
      exact: true,
    });
    await expect(nativePhotos.locator("button")).toHaveCount(10);
    if (!mobile) {
      await expect(canvas).toHaveAttribute("data-desk-drawer-anchor", /"x":/);
      const drawerAnchor = JSON.parse(
        (await canvas.getAttribute("data-desk-drawer-anchor"))!,
      );
      expect(
        await page.evaluate(
          ({ x, y }) => document.elementFromPoint(x, y)?.tagName,
          drawerAnchor,
        ),
      ).toBe("CANVAS");
      await page.mouse.click(drawerAnchor.x, drawerAnchor.y);
      await expect(page.locator("#VII10-title")).toBeVisible();
      const hotspotRects = await page
        .getByRole("navigation", { name: "Fotografias na cena", exact: true })
        .locator("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => {
            const { x, y, width, height } = button.getBoundingClientRect();
            return { x, y, width, height };
          }),
        );
      for (let i = 0; i < hotspotRects.length; i++)
        for (const other of hotspotRects.slice(i + 1)) {
          const rect = hotspotRects[i];
          expect(
            rect.x < other.x + other.width &&
              rect.x + rect.width > other.x &&
              rect.y < other.y + other.height &&
              rect.y + rect.height > other.y,
          ).toBe(false);
        }
      // A real projected HTML hotspot, in the scene, selects the existing question.
      await page
        .getByRole("navigation", { name: "Fotografias na cena", exact: true })
        .locator('[data-photo-question="VII06"]')
        .click();
    } else await nativePhotos.locator('[data-photo-question="VII06"]').click();
    await expect(page.locator("#VII06")).toBeVisible();
    await page
      .locator("#VII06")
      .fill("Eu escolho esta memória fictícia, sem fatos impostos.");
    await page.locator("#VII06").focus();
    await page.waitForTimeout(500);
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    expect(await canvas.getAttribute("data-photo-box-lid")).toBe(lid);
    await nativePhotos.locator('[data-photo-question="VII05"]').click();
    await page.locator("#VII05").selectOption("sim");
    const explanation = page.getByLabel("Conte mais");
    await explanation.fill("Segredo fictício preservado.");
    await page.locator("#VII05").selectOption("nao");
    await expect(explanation).not.toBeVisible();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#VII06")).toHaveValue(
      "Eu escolho esta memória fictícia, sem fatos impostos.",
    );
    if (mobile) {
      await page.setViewportSize({ width: 320, height: 844 });
      const targets = await nativePhotos
        .locator("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().width),
        );
      expect(targets.every((width) => width >= 44)).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await reloadPage(page);
    await expect(page.locator("#VII06")).toHaveValue(
      "Eu escolho esta memória fictícia, sem fatos impostos.",
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    await page.locator("#VII05").selectOption("sim");
    await expect(page.getByLabel("Conte mais")).toHaveValue(
      "Segredo fictício preservado.",
    );
    await page.getByRole("button", { name: "Pular animações" }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-photo-box-state",
      "open",
    );
    await nativePhotos.locator('[data-photo-question="VII10"]').click();
    await expect(page.locator("#VII10-title")).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole("button", { name: "Usar cenário leve" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await nativePhotos.locator('[data-photo-question="VII06"]').click();
    await expect(page.locator("#VII06")).toHaveValue(
      "Eu escolho esta memória fictícia, sem fatos impostos.",
    );
    await page.getByRole("button", { name: "Sair e continuar depois" }).click();
    await goTo(page, `${baseURL}/experiencia`);
    await expect(page.locator("#VII06")).toHaveValue(
      "Eu escolho esta memória fictícia, sem fatos impostos.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("entrada de VII mantém o Canvas e pular assenta tampa e câmera", async ({
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
    await goTo(page, `${baseURL}/experiencia?capitulo=VI`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 30000 },
    );
    await page
      .locator("canvas")
      .evaluate((canvas) => canvas.setAttribute("data-retained-canvas", "yes"));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /VII — Laços/ }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-photo-box-state",
      "opening",
      { timeout: 30000 },
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-travelling",
      "true",
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-handoff-visible",
      "false",
    );
    await page.getByRole("button", { name: "Pular animações" }).click();
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-retained-canvas",
      "yes",
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-photo-box-time",
      "1.984",
    );
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
    );
    const photos = page.getByRole("navigation", {
      name: "Fotografias do capítulo",
      exact: true,
    });
    await photos.locator('[data-photo-question="VII06"]').click();
    await page.locator("#VII06").fill("Texto em edição com a câmera parada.");
    const field = page.locator("#VII06");
    await field.evaluate((el) => {
      (el as HTMLTextAreaElement).focus();
      (el as HTMLTextAreaElement).setSelectionRange(0, 5);
    });
    const pose = await page.locator("canvas").getAttribute("data-camera");
    await page.setViewportSize({
      width: mobile ? 390 : 1440,
      height: mobile ? 520 : 750,
    });
    expect(
      await field.evaluate(
        (el) =>
          document.activeElement === el &&
          (el as HTMLTextAreaElement).selectionEnd === 5,
      ),
    ).toBe(true);
    expect(await page.locator("canvas").getAttribute("data-camera")).toBe(pose);
  } finally {
    await context.close();
    await browser.close();
  }
});

test("fotografias funcionam sem WebGL e com movimento reduzido", async ({
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
  await goTo(page, "/experiencia?capitulo=VII");
  const photos = page.getByRole("navigation", {
    name: "Fotografias do capítulo",
    exact: true,
  });
  await expect(photos.locator("button")).toHaveCount(10);
  await photos.locator('[data-photo-question="VII07"]').click();
  await page.locator("#VII07").fill("Nenhum arrependimento inventado.");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator("#VII08-title")).toBeVisible();
  await reloadPage(page);
  await expect(page.locator("#VII08-title")).toBeVisible();
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(page.locator("#VII07")).toHaveValue(
    "Nenhum arrependimento inventado.",
  );
  await expect(page.locator(".study-scene")).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
