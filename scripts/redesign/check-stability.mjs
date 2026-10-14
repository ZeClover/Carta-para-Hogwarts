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
    const data = await page
      .locator("canvas")
      .evaluate((el) => ({ ...el.dataset }));
    samples.push({
      chapter,
      geometries: Number(data.geometries),
      textures: Number(data.textures),
      sameCanvas: data.sameCanvas,
    });
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
  // Real mesh picking opens the existing relation editor; native action remains available.
  const bounds = JSON.parse(
    await page.locator("canvas").getAttribute("data-hero-bounds"),
  );
  for (const [fx, fy] of [
    [0.5, 0.5],
    [0.3, 0.65],
    [0.6, 0.7],
    [0.4, 0.4],
  ]) {
    if (await page.locator(".entity-editor").count()) break;
    await page.mouse.click(
      bounds.x + bounds.width * fx,
      bounds.y + bounds.height * fy,
    );
  }
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
