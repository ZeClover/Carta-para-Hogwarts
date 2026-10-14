import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const validator = require(
  process.env.GLTF_VALIDATOR_MODULE || "gltf-validator",
);
const assets = JSON.parse(
  await readFile("src/content/redesign-assets.json", "utf8"),
);
const results = [];
for (const asset of assets) {
  const result = await validator.validateBytes(
    new Uint8Array(await readFile("public" + asset.path)),
    { uri: asset.path },
  );
  results.push({
    chapter: asset.chapter,
    errors: result.issues.numErrors,
    warnings: result.issues.numWarnings,
    messages: result.issues.messages,
  });
  console.log(
    asset.chapter,
    result.issues.numErrors + " errors",
    result.issues.numWarnings + " warnings",
  );
}
await writeFile(
  process.env.GLTF_VALIDATION_REPORT || "/tmp/hogwarts-glb-validation.json",
  JSON.stringify(results, null, 2),
);
if (results.some((r) => r.errors || r.warnings)) process.exitCode = 1;
