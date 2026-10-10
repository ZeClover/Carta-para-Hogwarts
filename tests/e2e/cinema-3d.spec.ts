import { chromium, expect, test } from "@playwright/test";
test("cena fullscreen 3D vira páginas, mantém campos e adapta viewport", async ({
  baseURL,
}, info) => {
  test.setTimeout(90000);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    args: [
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
    ],
  });
  try {
    const mobile = info.project.name === "mobile";
    const page = await browser.newPage({
      viewport: mobile
        ? { width: 390, height: 844 }
        : { width: 1280, height: 720 },
    });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${baseURL}/experiencia`);
    await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "3d",
      { timeout: 20000 },
    );
    await page.locator("#I01").fill("Estudante do Registro Mágico");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-active",
      "true",
      { timeout: 20000 },
    );
    await expect(page.locator("#I02")).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".cinema-writing")).toHaveCSS("opacity", "1");
    await page.screenshot({
      path: info.outputPath("cinema-3d.png"),
    });
    await page
      .getByRole("button", { name: "Pular animação / reduzir movimento" })
      .click();
    await page.locator("#I02").fill("Registro");
    await page.setViewportSize({ width: mobile ? 390 : 800, height: 350 });
    await expect(page.locator(".cinema")).toHaveCSS("height", "350px", {
      timeout: 20000,
    });
    await expect(page.locator("#I02")).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByRole("button", { name: "Continuar", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: info.outputPath("cinema-keyboard.png"),
    });
    await page
      .locator(".study-scene canvas")
      .evaluate((canvas) =>
        (canvas as HTMLCanvasElement)
          .getContext("webgl2")
          ?.getExtension("WEBGL_lose_context")
          ?.loseContext(),
      );
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-renderer",
      "2.5d",
    );
    await expect(page.locator("#I02")).toHaveValue("Registro");
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await expect(page.locator("#I03")).toBeVisible({ timeout: 20000 });
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
