/** Capture actual local 3D scenes; no AI art, no external rendering service.
 * Run against a production server: CHROMIUM_PATH=/usr/bin/chromium node scripts/redesign/capture-posters.mjs
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const out = process.env.HOGWARTS_VISUAL_DIR || "/tmp/hogwarts-redesign-visual";
const base = process.env.HOGWARTS_TEST_URL || "http://127.0.0.1:3000";
await mkdir(out, { recursive: true });
await mkdir("public/assets/redesign", { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH,
  args: [
    "--enable-unsafe-swiftshader",
    "--use-angle=swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const assets = JSON.parse(
    await readFile("src/content/redesign-assets.json", "utf8"),
  ),
  report = [],
  selected = process.env.HOGWARTS_CHAPTERS?.split(","),
  posters = selected
    ? JSON.parse(
        await readFile("src/content/redesign-posters.json", "utf8"),
      ).filter((p) => !selected.includes(p.chapter))
    : [];
if (selected?.some((c) => !assets.some((a) => a.chapter === c)))
  throw new Error("Unknown chapter filter");
try {
  for (const mobile of [false, true]) {
    const device = mobile ? "mobile" : "desktop";
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
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    for (const { chapter } of assets.filter(
      (a) => !selected || selected.includes(a.chapter),
    )) {
      await page.goto(`${base}/experiencia?capitulo=${chapter}`);
      await page.locator(".cinema-writing").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Ativar cenário 3D" }).click();
      await page.waitForFunction(
        () =>
          document
            .querySelector(".study-scene")
            ?.getAttribute("data-renderer") === "3d",
        {},
        { timeout: 30000 },
      );
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: `${out}/${device}-${chapter}.png`,
        timeout: 60000,
      });
      report.push({
        device,
        chapter,
        metrics: await page
          .locator("canvas")
          .evaluate((el) => ({ ...el.dataset })),
        document: await page.locator(".cinema-writing").boundingBox(),
        errors: [...errors],
      });
      await page.addStyleTag({
        content:
          ".cinema-header,.cinema-document-layout,.study-controls,.cinema-ink,.intro-skip{display:none!important}",
      });
      await page.waitForTimeout(250);
      const png = await page.screenshot({
        path: `${out}/${device}-${chapter}-scene.png`,
        timeout: 60000,
      });
      const binary = await sharp(png)
        .resize({ width: mobile ? 390 : 1440 })
        .webp({ quality: 82 })
        .toBuffer();
      const hash = createHash("sha256").update(binary).digest("hex");
      const path = `/assets/redesign/poster-${chapter.toLowerCase()}-${device}-${hash.slice(0, 12)}.webp`;
      await writeFile("public" + path, binary);
      posters.push({
        chapter,
        device,
        path,
        bytes: binary.byteLength,
        sha256: createHash("sha256").update(binary).digest("hex"),
        source:
          "Local production scene capture; same chapter models and camera",
        license: "Same licenses as the chapter model and credited assets",
      });
      console.log(
        device,
        chapter,
        binary.byteLength + " poster bytes",
        errors.length + " errors",
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
await writeFile(
  "src/content/redesign-posters.json",
  JSON.stringify(posters, null, 2) + "\n",
);
if (report.some((r) => r.errors.length)) process.exitCode = 1;
