import type { Page } from "@playwright/test";

/** Exercise the actual entry button when a test is focused on the scene/form. */
export async function enterExperience(page: Page) {
  if (!["/", "/experiencia"].includes(new URL(page.url()).pathname)) return;
  await page
    .locator('[data-entry="waiting"], .recovery-screen')
    .waitFor({ state: "visible" });
  if (await page.locator('[data-entry="waiting"]').count())
    await page
      .getByRole("button", {
        name: /^(Iniciar experiência|Continuar minha história)$/,
      })
      .click();
}

export async function goTo(page: Page, ...args: Parameters<Page["goto"]>) {
  const response = await page.goto(...args);
  await enterExperience(page);
  return response;
}

export async function reloadPage(
  page: Page,
  ...args: Parameters<Page["reload"]>
) {
  const response = await page.reload(...args);
  await enterExperience(page);
  return response;
}
