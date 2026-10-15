import { chromium, expect, test } from "@playwright/test";

const gpu = [
  "--enable-unsafe-swiftshader",
  "--use-angle=swiftshader",
  "--ignore-gpu-blocklist",
];

test("abertura aguarda download lento, exibe a aba abrindo e retoma a resposta salva", async ({
  baseURL,
}, info) => {
  test.setTimeout(120000);
  const mobile = info.project.name === "mobile";
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: gpu,
  });
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 900 },
    reducedMotion: "no-preference",
    recordVideo: {
      dir: info.outputPath("letter-video"),
      size: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    },
  });
  await context.addInitScript(() => {
    if (!localStorage.getItem("hogwarts-scene"))
      localStorage.setItem("hogwarts-scene", "3d");
    const samples: number[] = [];
    const paper: number[] = [];
    Object.assign(window, { flapSamples: samples, paperSamples: paper });
    new MutationObserver(() => {
      const el = document.querySelector("canvas[data-envelope-flap]");
      if (el && samples.length < 500) {
        samples.push(Number(el.getAttribute("data-envelope-flap")));
        paper.push(Number(el.getAttribute("data-letter-emergence")));
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-envelope-flap", "data-letter-emergence"],
    });
  });
  let release!: () => void, requested!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const request = new Promise<void>((r) => {
    requested = r;
  });
  await context.route("**/assets/redesign/chapter-i-*.glb", async (route) => {
    if (route.request().method() === "GET") {
      requested();
      await gate;
    }
    await route.continue();
  });
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  try {
    await page.goto(baseURL!);
    await request;
    // This exceeded the old four-second fallback and consumed the opening.
    await page.waitForTimeout(5500);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-entry",
      "opening",
    );
    await expect(page.locator(".study-webgl")).toHaveCount(1);
    await expect(
      page.getByText("Preparando a carta e o cenário…", { exact: true }),
    ).toBeVisible();
    release();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-entrance-phase", "settling", {
      timeout: 45000,
    });
    await expect(canvas).toHaveAttribute("data-envelope-flap", "0.000");
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
    );
    try {
      await expect(page.locator("#I01")).toBeVisible({ timeout: 30000 });
    } catch (error) {
      await info.attach("opening-state", {
        body: JSON.stringify(
          await page.evaluate(() => ({
            now: performance.now(),
            hidden: document.hidden,
            root: document.querySelector(".cinema")?.outerHTML.slice(0, 1000),
            canvas: document.querySelector("canvas")?.outerHTML.slice(0, 3000),
          })),
        ),
        contentType: "application/json",
      });
      throw error;
    }
    const samples = await page.evaluate(
      () => (window as unknown as { flapSamples: number[] }).flapSamples,
    );
    expect(samples.some((x) => x < -0.15 && x > -2.8)).toBe(true);
    const paper = await page.evaluate(
      () => (window as unknown as { paperSamples: number[] }).paperSamples,
    );
    expect(paper.some((x) => x > 0.1 && x < 0.9)).toBe(true);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
      { timeout: 30000 },
    );
    await page.locator("#I01").fill("Nome fictício após a animação");
    await expect(page.locator(".cinema-save")).toHaveText(
      "Salvo neste navegador.",
    );
    await page.screenshot({
      path: info.outputPath("letter-reading.png"),
      timeout: 60000,
    });
    await page.reload();
    await expect(page.locator("#I01")).toHaveValue(
      "Nome fictício após a animação",
      { timeout: 30000 },
    );
    await expect(
      page.getByRole("button", { name: "Pular abertura", exact: true }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    release();
    await context.close();
    await browser.close();
  }
});

test("entrada de capítulo aguarda a cena visível e um travamento não consome a animação", async ({
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
  const page = await context.newPage(),
    errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(`${baseURL}/experiencia?capitulo=II`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
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
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: /III — O Despertar/ }).click();
    const canvas = page.locator("canvas");
    await expect(canvas).toHaveAttribute("data-entrance-phase", "settling", {
      timeout: 45000,
    });
    await expect(canvas).toHaveAttribute("data-ink-progress", "0.000");
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeDisabled();
    // Inject a real main-thread stall during the entrance. The next rendered
    // sample must advance one bounded frame, rather than a second of wall time.
    const jump = await page.evaluate(async () => {
      const c = document.querySelector("canvas")!;
      while (c.getAttribute("data-entrance-phase") !== "playing")
        await new Promise(requestAnimationFrame);
      const before = Number(c.getAttribute("data-ink-progress"));
      const start = performance.now();
      while (performance.now() - start < 1100) {
        /* simulate shader/CPU stall */
      }
      let after = before;
      for (let i = 0; i < 2; i++) {
        await new Promise(requestAnimationFrame);
        after = Number(c.getAttribute("data-ink-progress"));
      }
      return { before, after };
    });
    expect(jump.after - jump.before).toBeLessThan(0.1);
    expect(jump.after).toBeLessThan(1);
    await expect(canvas).toHaveAttribute("data-ink-progress", "1.000", {
      timeout: 30000,
    });
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-interaction-ready",
      "true",
    );
    const pose = await canvas.getAttribute("data-camera");
    await page.locator("#III01").selectOption("incerto");
    await page.waitForTimeout(400);
    expect(await canvas.getAttribute("data-camera")).toBe(pose);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await browser.close();
  }
});
