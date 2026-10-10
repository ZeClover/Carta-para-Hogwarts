import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { parseCharacter } from "../../src/lib/story";
import { chapterIds, chapters } from "../../src/content/chapters";
import { buildExport } from "../../src/lib/story";
import { fixture, hook } from "../fixtures";
async function startCharacter(page: Page) {
  await page.goto("/criar/I");
  await page.getByLabel("Nome completo").fill("Eleanor Whitmore");
  await page.getByLabel("Data de nascimento").fill("1879-03-15");
  await page.getByRole("button", { name: "Próxima folha" }).click();
  await page.getByLabel("Lugar de nascimento").fill("Edimburgo");
  await page.getByLabel("Residência antes de Hogwarts").fill("Yorkshire");
  await page.getByRole("button", { name: "Próxima folha" }).click();
  await page
    .getByRole("button", { name: "Concluir Registro de Admissão" })
    .click();
  await expect(page).toHaveURL(/criar\/II/);
}
test("jogador percorre os sete capítulos, reutiliza pessoas e exporta revisões seguras", async ({
  page,
}) => {
  test.setTimeout(120000);
  await startCharacter(page);
  await page
    .getByLabel("Família / linhagem", { exact: true })
    .selectOption("black");
  await expect(page.getByText(/não descreve toda pessoa Black/)).toBeVisible();
  await page
    .getByLabel("Essas tendências se aplicam ao seu ramo?")
    .selectOption("Não");
  await page.screenshot({
    path: `test-results/capitulo-II-${test.info().project.name}.png`,
    animations: "disabled",
  });
  const caregivers = page.locator('section[aria-labelledby="II01-title"]');
  await caregivers.getByRole("button", { name: "Adicionar pessoa" }).click();
  await caregivers.getByLabel("Nome da pessoa").fill("Agnes Whitmore");
  await caregivers
    .getByLabel("Fatos conhecidos")
    .fill("Me criou em Yorkshire.");
  await caregivers
    .getByLabel("Crenças do personagem")
    .fill("Acho que gostaria de voltar à Escócia.");
  await caregivers.getByRole("button", { name: "Salvar pessoa" }).click();
  await expect(
    caregivers.getByRole("checkbox", { name: /Agnes/ }),
  ).toBeChecked();
  await page
    .getByRole("button", {
      name: "Alguma tradição familiar que nunca compreendeu?",
    })
    .click();
  await page.getByLabel("Título da oportunidade").fill("Cartas de inverno");
  await page
    .getByLabel("1. O que aconteceu")
    .fill("Agnes recebia uma carta todos os invernos.");
  await page
    .getByLabel("2. O que o personagem")
    .fill("Talvez fosse de um velho amigo.");
  await page.getByLabel("3. O que ainda").fill("Quem enviava?");
  await page.getByLabel("4. Quer que").selectOption("yes");
  await page.getByLabel("5. Com quanta").selectOption("explanation");
  await page.getByLabel("6. O que não").fill("Não transformar Agnes em vilã.");
  await page.getByRole("button", { name: "Salvar oportunidade" }).click();
  await page
    .getByRole("button", { name: "Revisar capítulo e continuar" })
    .click();
  await expect(page).toHaveURL(/criar\/III/);
  await page
    .getByLabel("Cresceu sabendo que o mundo mágico existia?", { exact: true })
    .selectOption("nao");
  await page
    .getByRole("button", { name: "Revisar capítulo e continuar" })
    .click();
  await expect(page).toHaveURL(/criar\/IV/);
  await expect(page.getByText(/quem explicou a notícia/)).toBeVisible();
  await page
    .locator('section[aria-labelledby="IV02-title"]')
    .getByRole("checkbox", { name: /Agnes/ })
    .check();
  await page
    .getByRole("button", { name: "Revisar capítulo e continuar" })
    .click();
  await expect(page).toHaveURL(/criar\/V/);
  await page
    .getByRole("button", { name: "Revisar capítulo e continuar" })
    .click();
  await expect(page).toHaveURL(/criar\/VI/);
  await page
    .getByLabel("Maior sonho ou ambição", { exact: true })
    .fill("Entender as criaturas da floresta.");
  await page
    .getByRole("button", { name: "Revisar capítulo e continuar" })
    .click();
  await expect(page).toHaveURL(/criar\/VII/);
  const secret = page.locator('section[aria-labelledby="VII05-title"]');
  await secret
    .getByLabel("Guarda algum segredo?", { exact: true })
    .selectOption("sim");
  await secret
    .getByLabel("Conte mais sobre sua resposta")
    .fill("Texto que não deve ser exportado após mudar a escolha.");
  await secret
    .getByLabel("Guarda algum segredo?", { exact: true })
    .selectOption("nao");
  await expect(secret.getByText(/não será exportada/)).toBeVisible();
  await page.getByRole("button", { name: "Revisar minha história" }).click();
  await expect(page).toHaveURL(/revisao/);
  await page.getByRole("button", { name: "4. Limites narrativos" }).click();
  await page
    .getByLabel("Não explorar", { exact: true })
    .fill("Crueldade com animais");
  await page.getByLabel("Prefiro discutir em particular").check();
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Concluir minha história", exact: true })
    .click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe(
    "hogwarts-1890-personagem-eleanor-whitmore-v1.json",
  );
  const raw = await readFile((await download.path())!, "utf8");
  const data = parseCharacter(raw);
  expect(data.relationships).toHaveLength(1);
  expect(data.answers.II01.value).toEqual(data.answers.IV02.value);
  expect(data.answers.VII05.explanation).toBe("");
  expect(raw).not.toContain("Texto que não deve");
  expect(data.narrativeHooks[0].permission).toBe("explanation");
  expect(data.narrativeHooks[0].confirmedFacts).toEqual([
    "Agnes recebia uma carta todos os invernos.",
  ]);
  expect(data.narrativeHooks[0].characterBeliefs).toEqual([
    "Talvez fosse de um velho amigo.",
  ]);
  expect(data.preferences.avoid).toEqual(["Crueldade com animais"]);
  expect(data.completion.chaptersReviewed).toHaveLength(7);
  const secondDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Reexportar minha história" }).click();
  const second = parseCharacter(
    await readFile((await (await secondDownload).path())!, "utf8"),
  );
  expect(second.character.id).toBe(data.character.id);
  expect(second.revision).toBe(2);
  await expect(page.getByText("Nos encontraremos em Hogwarts.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("famílias não determinam criação e todos os capítulos têm as perguntas previstas", async ({
  page,
}) => {
  await page.goto("/criar/II");
  await page
    .getByLabel("Família / linhagem", { exact: true })
    .selectOption("desconhecida");
  await expect(
    page.getByText(/responsáveis conhecidos e próximos/),
  ).toBeVisible();
  await page
    .getByLabel("Família / linhagem", { exact: true })
    .selectOption("outra");
  await page.getByLabel("Nome da família original").fill("Clover");
  await page
    .getByLabel("Cultura, atividade e reputação")
    .fill("Oficina familiar");
  await page
    .getByLabel("Família / linhagem", { exact: true })
    .selectOption("black");
  await expect(
    page.getByText(/nome e contexto não serão exportados/),
  ).toBeVisible();
  for (const id of chapterIds.slice(1)) {
    await page.goto(`/criar/${id}`);
    for (const question of chapters[id].questions)
      await expect(page.locator(`#${question.id}-title`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pular animação / reduzir movimento" }),
    ).toBeVisible();
  }
  await page.goto("/criar/INVALID");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});
test("backup completo preserva respostas entre contextos e a conclusão permite zero oportunidades", async ({
  page,
  browser,
}) => {
  await startCharacter(page);
  await page
    .getByLabel("Família / linhagem", { exact: true })
    .selectOption("scamander");
  await page
    .getByLabel("Uma lembrança feliz", { exact: true })
    .fill("Um hipogrifo descansava à sombra.");
  const getting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar backup completo" }).click();
  const backup = await readFile((await (await getting).path())!);
  const context = await browser.newContext();
  const other = await context.newPage();
  await other.goto("/revisao");
  other.on("dialog", (dialog) => dialog.accept());
  await other.getByLabel("Restaurar história", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: backup,
  });
  await expect(other.getByText("História restaurada.")).toBeVisible();
  await other.goto("/criar/II");
  await expect(
    other.getByLabel("Uma lembrança feliz", { exact: true }),
  ).toHaveValue("Um hipogrifo descansava à sombra.");
  await other.goto("/criar/III");
  await other
    .getByLabel("Cresceu sabendo que o mundo mágico existia?", { exact: true })
    .selectOption("incerto");
  await other
    .getByRole("button", { name: "Revisar capítulo e continuar" })
    .click();
  await other.goto("/revisao");
  for (const id of chapterIds)
    await other.getByRole("checkbox", { name: new RegExp(`^${id} ·`) }).check();
  await other
    .getByRole("button", { name: "Concluir minha história", exact: true })
    .click();
  await expect(
    other.getByText(/não deixou oportunidades autorizadas/),
  ).toBeVisible();
  const downloading = other.waitForEvent("download");
  await other
    .getByRole("button", { name: "Confirmar e concluir sem oportunidades" })
    .click();
  const data = parseCharacter(
    await readFile((await (await downloading).path())!, "utf8"),
  );
  expect(data.narrativeHooks).toHaveLength(0);
  await context.close();
});
test("Arquivo do Mestre importa, resolve revisões, planeja e restaura backups sem vazar notas", async ({
  page,
  browser,
}) => {
  test.setTimeout(120000);
  const characters = ["Eleanor Whitmore", "Theo Whitmore", "Clara Green"].map(
    (name) => {
      const p = fixture(name);
      p.story.narrativeHooks = [hook];
      p.story.relationships = [
        {
          id: "agnes",
          name: "Agnes Whitmore",
          role: "familiar",
          relationshipLevel: "proximo",
          knownFacts: [
            "Vive em Yorkshire",
            '<img src=x onerror="window.fixtureExecuted=true">',
          ],
          characterBeliefs: [],
          openQuestions: [],
          canReappear: "yes",
          notes: "Uma pessoa importante",
          qualifiers: [],
        },
      ];
      p.story.preferences.avoid = ["Crueldade"];
      return buildExport(p.draft, p.story);
    },
  );
  await page.goto("/mestre");
  await expect(
    page.getByText("Nenhum personagem importado.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Selecionar JSONs", { exact: true }).setInputFiles([
    ...characters.map((data, i) => ({
      name: `char-${i}.json`,
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(data, null, 2)),
    })),
    {
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"schemaVersion":"9"}'),
    },
  ]);
  await expect(
    page.getByText("Importado: Eleanor Whitmore, revisão 1."),
  ).toBeVisible();
  await expect(page.getByText(/Personagem inválido/)).toBeVisible();
  await expect(
    page.locator(".stats-grid").getByText("3", { exact: true }),
  ).toHaveCount(3);
  await page.getByLabel("Selecionar JSONs", { exact: true }).setInputFiles({
    name: "repeat.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(characters[0])),
  });
  await expect(
    page.getByRole("region", { name: "Conflito de revisão" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Manter anterior" }).click();
  const updated = { ...characters[0], revision: 2 };
  await page.getByLabel("Selecionar JSONs", { exact: true }).setInputFiles({
    name: "revision-2.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(updated)),
  });
  await page.getByRole("button", { name: "Substituir revisão" }).click();
  await page.screenshot({
    path: `test-results/mestre-${test.info().project.name}.png`,
    animations: "disabled",
  });
  const nav = page.getByRole("navigation", {
    name: "Áreas do Arquivo do Mestre",
  });
  await nav.getByRole("button", { name: "Personagens", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Comparar Eleanor Whitmore" })
    .check();
  await page.getByRole("checkbox", { name: "Comparar Theo Whitmore" }).check();
  await expect(
    page.getByRole("region", { name: "Comparação de personagens" }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Comparar Eleanor Whitmore" })
    .uncheck();
  await page
    .getByRole("checkbox", { name: "Comparar Theo Whitmore" })
    .uncheck();
  await page
    .getByLabel("Buscar personagens, famílias, locais ou pessoas")
    .fill("Eleanor");
  await page
    .getByRole("button", { name: "Abrir ficha de Eleanor Whitmore" })
    .click();
  await expect(page.getByText(/Revisão 2 · Importado/)).toBeVisible();
  await page.getByText("JSON original preservado").click();
  await expect(page.locator(".json-view")).toContainText("Eleanor Whitmore");
  expect(
    await page.evaluate(() => Object.hasOwn(window, "fixtureExecuted")),
  ).toBe(false);
  await expect(page.locator("img")).toHaveCount(0);
  await nav
    .getByRole("button", { name: "Pontas abertas", exact: true })
    .click();
  await page.getByLabel("Permissão", { exact: true }).selectOption("closed");
  await expect(page.getByText("0 oportunidades encontradas.")).toBeVisible();
  await page
    .getByLabel("Permissão", { exact: true })
    .selectOption("explanation");
  await expect(page.getByText("3 oportunidades encontradas.")).toBeVisible();
  await nav
    .getByRole("button", { name: "Linha do tempo", exact: true })
    .click();
  await expect(
    page.getByText("Época não definida", { exact: true }),
  ).toHaveCount(3);
  await nav
    .getByRole("button", { name: "Possíveis conexões", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Possível conexão: Whitmore" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar conexão no planejamento" })
    .first()
    .click();
  await nav.getByRole("button", { name: "Planejamento", exact: true }).click();
  await page
    .getByRole("button", { name: "Adicionar anotação privada" })
    .click();
  await page.getByLabel("Título da anotação").fill("Hipótese privada do teste");
  await page
    .getByLabel("Conteúdo privado")
    .fill("Uma proposta que não altera o passado do jogador.");
  await page.getByLabel("Tipo de anotação").selectOption("hipotese");
  await page.getByRole("button", { name: "Salvar anotação" }).click();
  await expect(
    page.getByRole("heading", { name: "Hipótese privada do teste" }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Limites", exact: true }).click();
  await expect(page.getByText("Crueldade", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mostrar limites privados" }).click();
  await expect(page.getByText("Crueldade", { exact: true })).toHaveCount(3);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar backup do Mestre" }).click();
  const backup = await readFile((await (await downloading).path())!);
  const context = await browser.newContext();
  const restored = await context.newPage();
  await restored.goto("/mestre");
  restored.on("dialog", (dialog) => dialog.accept());
  await restored
    .getByLabel("Restaurar backup do Mestre", { exact: true })
    .setInputFiles({
      name: "master-backup.json",
      mimeType: "application/json",
      buffer: backup,
    });
  await expect(restored.getByText(/Backup restaurado\./)).toBeVisible();
  await restored
    .getByRole("navigation", { name: "Áreas do Arquivo do Mestre" })
    .getByRole("button", { name: "Planejamento", exact: true })
    .click();
  await expect(
    restored.getByRole("heading", { name: "Hipótese privada do teste" }),
  ).toBeVisible();
  await context.close();
  await page.goto("/");
  await expect(page.getByText("Hipótese privada do teste")).toHaveCount(0);
  const response = await page.request.get("/");
  expect(await response.text()).not.toContain("Hipótese privada do teste");
});
test("acessibilidade da carta, capítulo narrativo, revisão e arquivo vazio", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Pular animação / reduzir movimento" })
    .click();
  let result = await new AxeBuilder({ page }).analyze();
  expect(result.violations).toEqual([]);
  for (const path of [
    "/criar/I",
    "/criar/II",
    "/criar/III",
    "/revisao",
    "/mestre",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    result = await new AxeBuilder({ page }).analyze();
    expect(result.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
