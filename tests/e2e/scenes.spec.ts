import { chromium, expect, test } from "@playwright/test";

test("cenário sem WebGL mantém carta, álbum, formulário e salvamento", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(page.locator('[data-scene="letter"]')).toHaveAttribute(
    "data-renderer",
    "2.5d",
  );
  await page.getByRole("button", { name: "Abrir a carta de Hogwarts" }).click();
  await expect(page.locator('[data-scene="letter"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(
    page.getByRole("link", { name: "Preencher meu registro" }),
  ).toHaveAttribute("href", "/experiencia");
  await page.goto("/criar/I");
  await page.getByLabel("Nome completo").fill("Livia da Cena Leve");
  await expect(page.getByRole("status")).toHaveText("Salvo neste navegador.");
  await page.reload();
  await expect(page.getByLabel("Nome completo")).toHaveValue(
    "Livia da Cena Leve",
  );
  await page.goto("/criar/II");
  await page.getByRole("button", { name: "Virar página do álbum" }).click();
  await expect(page.locator('[data-scene="II"]')).toHaveAttribute(
    "data-active",
    "true",
  );
  await page
    .getByRole("button", { name: "Pular animação / reduzir movimento" })
    .click();
  await expect(page.locator('[data-scene="II"]')).toHaveAttribute(
    "data-motion",
    "reduced",
  );
  await page.locator("#II02").fill("Uma sala cheia de livros.");
  await expect(page.getByRole("status")).toHaveText("Salvo neste navegador.");
  await page.reload();
  await expect(page.locator("#II02")).toHaveValue("Uma sala cheia de livros.");
});

test("objetos dos capítulos e movimento reduzido funcionam pelo teclado", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scenes = [
    ["III", "Tocar a fotografia"],
    ["IV", "Receber a carta"],
    ["V", "Iluminar o espelho"],
    ["VI", "Virar a ampulheta"],
    ["VII", "Abrir ou fechar a gaveta"],
    ["final", "Selar o livro"],
  ];
  for (const [kind, action] of scenes) {
    await page.goto(kind === "final" ? "/revisao" : `/criar/${kind}`);
    const scene = page.locator(`[data-scene="${kind}"]`);
    await expect(scene).toHaveAttribute("data-motion", "reduced");
    await page.getByRole("button", { name: action }).focus();
    await page.keyboard.press("Enter");
    await expect(scene).toHaveAttribute("data-active", "true");
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("3D real: travelling, carta, álbum, espelho e perda de contexto", async ({
  baseURL,
}, testInfo) => {
  test.setTimeout(90000);
  // Software WebGL is deliberate here; performance measurements do not represent a phone GPU.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  try {
    const page = await browser.newPage({
      viewport:
        testInfo.project.name === "mobile"
          ? { width: 390, height: 844 }
          : { width: 1280, height: 720 },
    });
    const errors: string[] = [],
      missing: string[] = [],
      external: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400) missing.push(response.url());
    });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (
        ["http:", "https:"].includes(url.protocol) &&
        url.origin !== new URL(baseURL!).origin
      )
        external.push(request.url());
    });
    await page.goto(baseURL!);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const scene = page.locator('[data-scene="letter"]');
    await expect(scene).toHaveAttribute("data-renderer", "3d", {
      timeout: 20000,
    });
    const canvas = scene.locator("canvas");
    const before = await canvas.getAttribute("data-camera");
    await page
      .getByRole("button", { name: "Abrir a carta de Hogwarts" })
      .click();
    await expect(scene).toHaveAttribute("data-active", "true");
    // Observe a deliberate camera transition, even if initial loading finished before polling.
    await expect
      .poll(() => canvas.getAttribute("data-camera"), { timeout: 20000 })
      .not.toBe(before);
    await expect(
      page.getByRole("link", { name: "Preencher meu registro" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Pular animação / reduzir movimento" })
      .click();
    await expect(scene).toHaveAttribute("data-motion", "reduced");
    await page.screenshot({
      path: testInfo.outputPath("letter-open.png"),
      fullPage: true,
    });
    await page.goto(`${baseURL}/criar/II`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const album = page.locator('[data-scene="II"]');
    await expect(album).toHaveAttribute("data-renderer", "3d", {
      timeout: 20000,
    });
    await page.getByRole("button", { name: "Virar página do álbum" }).click();
    await expect(album).toHaveAttribute("data-active", "true");
    await page
      .getByRole("button", { name: "Pular animação / reduzir movimento" })
      .click();
    await album.screenshot({ path: testInfo.outputPath("album.png") });
    await page.locator("#II02").fill("A mesma casa, sob a luz das velas.");
    await expect(page.getByRole("status")).toHaveText("Salvo neste navegador.");
    await page.reload();
    await expect(page.locator("#II02")).toHaveValue(
      "A mesma casa, sob a luz das velas.",
    );
    await page.goto(`${baseURL}/criar/V`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    const mirror = page.locator('[data-scene="V"]');
    await expect(mirror).toHaveAttribute("data-renderer", "3d", {
      timeout: 20000,
    });
    await page.getByRole("button", { name: "Iluminar o espelho" }).click();
    await page
      .getByRole("button", { name: "Pular animação / reduzir movimento" })
      .click();
    await mirror.screenshot({ path: testInfo.outputPath("mirror.png") });
    await page.getByRole("button", { name: "Usar cenário leve" }).click();
    await expect(mirror).toHaveAttribute("data-renderer", "2.5d");
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(mirror).toHaveAttribute("data-renderer", "3d");
    await mirror.locator("canvas").evaluate((canvas) => {
      (canvas as HTMLCanvasElement)
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
    });
    await expect(mirror).toHaveAttribute("data-renderer", "2.5d");
    await expect(page.locator("#V01-title")).toBeVisible();
    expect(errors).toEqual([]);
    expect(missing).toEqual([]);
    expect(external).toEqual([]);
  } finally {
    await browser.close();
  }
});
