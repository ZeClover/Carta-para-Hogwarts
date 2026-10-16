import { goTo, reloadPage } from "./navigation";
import { chromium, expect, test } from "@playwright/test";

const gpu = [
  "--enable-unsafe-swiftshader",
  "--use-angle=swiftshader",
  "--ignore-gpu-blocklist",
];
for (const chapter of ["I", "IV", "VII"] as const) {
  test(`Ver animação em ${chapter} preserva pergunta, resposta e retomada`, async ({
    baseURL,
  }, info) => {
    test.setTimeout(150000);
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
      args: gpu,
    });
    const context = await browser.newContext({
      viewport:
        info.project.name === "mobile"
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
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    try {
      await goTo(page, `${baseURL}/experiencia?capitulo=${chapter}`);
      if (chapter === "I") {
        await page.locator("#I01").fill("Nome fictício preservado");
        await page
          .getByRole("button", { name: "Continuar", exact: true })
          .click();
        await page.locator("#I02").fill("Apelido de teste preservado");
      } else if (chapter === "IV") {
        await page.locator("#IV01").selectOption({ label: "Coruja" });
      } else {
        await page
          .getByRole("navigation", {
            name: "Fotografias do capítulo",
            exact: true,
          })
          .locator('[data-photo-question="VII06"]')
          .click();
        await page
          .locator("#VII06")
          .fill("Resposta fictícia preservada ao rever a caixa.");
      }
      await expect(page.locator(".cinema-save")).toHaveText(
        "Salvo neste navegador.",
      );
      await reloadPage(page);
      const field = page.locator(
        chapter === "I" ? "#I02" : chapter === "IV" ? "#IV01" : "#VII06",
      );
      const value = await field.inputValue();
      await expect(
        page.getByRole("button", { name: "Ver animação", exact: true }),
      ).toBeEnabled();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page
        .getByRole("button", { name: "Ver animação", exact: true })
        .click();
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-replay-version",
        "1",
      );
      if (chapter === "I") {
        await expect(page.locator(".cinema")).toHaveAttribute(
          "data-entry",
          "opening",
        );
        await expect(page.locator(".chapter-cover")).toHaveCount(0);
        await expect
          .poll(
            async () =>
              Number(
                await page.locator("canvas").getAttribute("data-envelope-flap"),
              ),
            { timeout: 45000 },
          )
          .toBeLessThan(-0.1);
        await page
          .getByRole("button", { name: "Pular abertura", exact: true })
          .click();
      } else {
        await expect(page.locator("canvas")).toHaveAttribute(
          chapter === "IV" ? "data-hallway-state" : "data-photo-box-state",
          chapter === "IV" ? "delivering" : "opening",
          { timeout: 45000 },
        );
        await expect(
          page.getByRole("button", { name: "Ver animação", exact: true }),
        ).toBeDisabled();
        if (chapter === "IV")
          await expect(page.locator("canvas")).toHaveAttribute(
            "data-hallway-resumed",
            "false",
          );
        await page
          .getByRole("button", { name: "Pular animações", exact: true })
          .click();
      }
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-interaction-ready",
        "true",
        { timeout: 30000 },
      );
      await expect(field).toHaveValue(value);
      await expect(page.locator(".study-scene")).toHaveAttribute(
        "data-renderer",
        "3d",
      );
      await expect(
        page.getByRole("button", { name: "Ver animação", exact: true }),
      ).toBeEnabled();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: info.outputPath(`replay-${chapter}.png`),
        timeout: 60000,
      });
      // Repeating the command is safe, including after a previous skip.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page
        .getByRole("button", { name: "Ver animação", exact: true })
        .click();
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-replay-version",
        "2",
      );
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-interaction-ready",
        "true",
        { timeout: 30000 },
      );
      await expect(field).toHaveValue(value);
      await reloadPage(page);
      await expect(field).toHaveValue(value);
      await expect(page.locator(".cinema")).toHaveAttribute(
        "data-entry",
        "reading",
      );
      expect(errors).toEqual([]);
    } finally {
      await context.close();
      await browser.close();
    }
  });
}
