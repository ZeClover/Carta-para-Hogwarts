import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/", "/experiencia?capitulo=IV"]) {
  test(`entrada ${path} em modo leve aguarda clique sem baixar modelos ou liberar perguntas`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("hogwarts-scene", "light");
      Object.assign(window, { webglProbes: 0 });
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        kind: string,
        ...args: unknown[]
      ) {
        if (kind.includes("webgl"))
          (window as unknown as { webglProbes: number }).webglProbes++;
        return Reflect.apply(original, this, [kind, ...args]);
      } as typeof original;
    });
    const models: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith(".glb"))
        models.push(request.url());
    });
    await page.goto(path);
    const start = page.getByRole("button", {
      name: "Iniciar experiência",
      exact: true,
    });
    await expect(start).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.locator(".cinema")).toHaveAttribute(
      "data-entry",
      "waiting",
    );
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.locator(".cinema-fields")).not.toBeVisible();
    await expect(page.locator(".study-scene")).toHaveAttribute(
      "data-playback",
      "waiting",
    );
    expect(models).toEqual([]);
    await page.screenshot({
      path: info.outputPath("waiting-for-click.png"),
      scale: "css",
    });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await start.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(path === "/" ? "#I01" : "#IV01")).toBeEnabled();
    await expect(page.locator(".experience-entry")).toHaveCount(0);
  });
}

test("cenário leve inicia por escolha e retomada espera clique preservando a resposta", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Entrar no cenário leve", exact: true })
    .click();
  await expect(page.locator("#I01")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Pular abertura", exact: true }),
  ).toHaveCount(0);
  await page.locator("#I01").fill("Estudante fictício da tela de entrada");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.locator("#I02").fill("Resposta preservada ao retornar");
  await expect(page.locator(".cinema-save")).toHaveText(
    "Salvo neste navegador.",
  );
  await page.reload();
  const resume = page.getByRole("button", {
    name: "Continuar minha história",
    exact: true,
  });
  await expect(resume).toBeVisible();
  await expect(page.locator("#I02")).not.toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 350 });
  await resume.scrollIntoViewIfNeeded();
  await expect(resume).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("resume-short-screen.png"),
    scale: "css",
  });
  await resume.click();
  await expect(page.locator("#I02")).toHaveValue(
    "Resposta preservada ao retornar",
  );
  await expect(page.locator(".study-scene")).toHaveAttribute(
    "data-renderer",
    "2.5d",
  );
  await expect(
    page.getByRole("button", { name: "Pular abertura", exact: true }),
  ).toHaveCount(0);
});
