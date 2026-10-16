/** Optional production-server regression: owned GPU resources, real mesh picking and responsive focus. */
import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const report =
  process.env.HOGWARTS_STABILITY_REPORT ||
  "/tmp/hogwarts-redesign-stability.json";
const base = process.env.HOGWARTS_TEST_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: [
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
await context.addInitScript(() =>
  localStorage.setItem("hogwarts-scene", "light"),
);
const page = await context.newPage(),
  errors = [],
  samples = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(base + "/experiencia?capitulo=VII");
  await page
    .getByRole("button", {
      name: /^(Iniciar experiência|Continuar minha história)$/,
    })
    .click();
  await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
  await expect(page.locator(".study-scene")).toHaveAttribute(
    "data-renderer",
    "3d",
    { timeout: 20000 },
  );
  await page
    .locator("canvas")
    .evaluate((el) => el.setAttribute("data-same-canvas", "yes"));
  const labels = { III: /III — O Despertar da Magia/, VII: /VII — Laços/ };
  const visit = async (chapter) => {
    await page.getByRole("button", { name: "Capítulos e opções" }).click();
    await page.getByRole("button", { name: labels[chapter] }).click();
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-chapter",
      chapter,
    );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 20000 },
    );
    await expect(page.locator("canvas")).toHaveAttribute(
      "data-camera-state",
      "arrived",
    );
    await page.waitForTimeout(800);
    const beforeRefresh = await page
      .locator("canvas")
      .evaluate((el) => ({ ...el.dataset }));
    // R3F intentionally disposes declarative resources at scheduler IdlePriority.
    // Reading stops the demand loop, so await idle and refresh its last-frame
    // counters. A genuine retained resource must still fail within eight seconds.
    const settling = [];
    const refresh = async () => {
      await page.evaluate(
        () => new Promise((resolve) => requestIdleCallback(resolve, { timeout: 1000 })),
      );
      await page.setViewportSize({ width: 1439, height: 900 });
      await page.waitForTimeout(100);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(300);
      const measured = await page
        .locator("canvas")
        .evaluate((el) => ({ ...el.dataset }));
      settling.push({
        geometries: Number(measured.geometries),
        textures: Number(measured.textures),
      });
      return measured;
    };
    let data = await refresh();
    const baseline = samples.find((row) => row.chapter === chapter);
    const released = () =>
      !baseline ||
      (Number(data.geometries) <= baseline.geometries + 2 &&
        Number(data.textures) <= baseline.textures + 2);
    if (!released())
      await expect
        .poll(async () => {
          data = await refresh();
          return released();
        }, { timeout: 8000 })
        .toBe(true);
    samples.push({
      chapter,
      geometries: Number(data.geometries),
      textures: Number(data.textures),
      sameCanvas: data.sameCanvas,
      settling,
      beforeRefresh: {
        geometries: Number(beforeRefresh.geometries),
        textures: Number(beforeRefresh.textures),
      },
    });
    // Preserve every measurement even if an assertion later fails.
    await writeFile(report, JSON.stringify({ samples, errors }, null, 2));
  };
  // 20 complete round trips after warming the two chapters; a single live renderer.
  await visit("III");
  await visit("VII");
  for (let i = 0; i < 20; i++) {
    await visit("III");
    await visit("VII");
    console.log("round trip", i + 1);
  }
  for (const chapter of ["III", "VII"]) {
    const rows = samples.filter((x) => x.chapter === chapter);
    const base = rows[0];
    for (const row of rows) {
      expect(row.sameCanvas).toBe("yes");
      expect(row.geometries).toBeLessThanOrEqual(base.geometries + 2);
      expect(row.textures).toBeLessThanOrEqual(base.textures + 2);
    }
  }
  await writeFile(
    report,
    JSON.stringify(
      {
        roundTrips: 20,
        samples,
        stage: "resources passed; editor and resize checks pending",
      },
      null,
      2,
    ),
  );
  // The current desk drawer selects VII10; photography selects existing pages.
  // Click the actual mesh, then use the native index and existing editor.
  const drawer = JSON.parse(
    await page.locator("canvas").getAttribute("data-desk-drawer-anchor"),
  );
  expect(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.tagName,
      drawer,
    ),
  ).toBe("CANVAS");
  await page.mouse.click(drawer.x, drawer.y);
  await expect(page.locator("#VII10-title")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Fotografias do capítulo", exact: true })
    .locator('[data-photo-question="VII01"]')
    .click();
  await page
    .getByRole("button", { name: "Adicionar pessoa", exact: true })
    .click();
  await expect(page.locator(".entity-editor")).toBeVisible();
  await expect(
    page.getByLabel("Nome da pessoa *", { exact: true }),
  ).toHaveValue("");
  await page.getByRole("button", { name: "Cancelar pessoa" }).click();
  await page
    .getByRole("button", { name: "Adicionar pessoa", exact: true })
    .click();
  await expect(page.locator(".entity-editor")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar pessoa" }).click();
  await page.getByRole("button", { name: "Capítulos e opções" }).click();
  await page.getByRole("button", { name: /V — Quem Você Realmente É/ }).click();
  await expect(page.locator(".study-scene")).toHaveAttribute(
    "data-renderer",
    "3d",
    { timeout: 20000 },
  );
  const text = page.locator(".cinema-writing textarea").first();
  await text.fill("Texto de teste para foco e seleção.");
  await text.focus();
  await text.evaluate((el) => el.setSelectionRange(3, 10));
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(text).toBeFocused();
  expect(
    await text.evaluate((el) => [el.selectionStart, el.selectionEnd]),
  ).toEqual([3, 10]);
  const rect = await page.locator(".cinema-writing").boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(800);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await writeFile(
    report,
    JSON.stringify(
      {
        roundTrips: 20,
        samples,
        meshAndNativeEditor: "passed",
        resizeAndSelection: "passed",
        errors,
        hardware: "Chromium SwiftShader; resource counts, not actual GPU bytes",
      },
      null,
      2,
    ),
  );
  console.log("stability, mesh picking and resize passed");
} finally {
  await browser.close();
}
