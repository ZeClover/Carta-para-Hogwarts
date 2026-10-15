/** Import supplied V/VI/VII assets, keeping source UVs and author/license metadata.
 * node scripts/import-supplied-model.mjs mirror|armillary|hourglass|desk /path/original.glb */
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { NodeIO } from "@gltf-transform/core";
import {
  getBounds,
  dedup,
  prune,
  weld,
  flatten,
  join,
  simplify,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const [kind, input] = process.argv.slice(2);
if (!["mirror", "armillary", "hourglass", "desk"].includes(kind) || !input)
  throw Error("Supply mirror|armillary|hourglass|desk and source GLB");
const original = await readFile(input),
  jsonSize = original.readUInt32LE(12);
const source = JSON.parse(original.subarray(20, 20 + jsonSize).toString()).asset
  .extras;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS),
  doc = await io.read(input);
if (kind === "hourglass") {
  for (const m of doc.getRoot().listMaterials()) {
    if (m.getName() === "Material.042") {
      m.setBaseColorFactor([0.9, 0.97, 1, 0.2])
        .setMetallicFactor(0)
        .setRoughnessFactor(0.1);
      m.listExtensions()
        .find((e) => e.extensionName === "KHR_materials_transmission")
        ?.dispose();
    }
    if (m.getName() === "Material.004")
      m.setBaseColorFactor([0.65, 0.52, 0.33, 1])
        .setMetallicFactor(0)
        .setRoughnessFactor(1);
  }
}
if (kind === "mirror")
  await doc.transform(
    flatten(),
    weld(),
    dedup(),
    join({ keepNamed: false }),
    prune(),
  );
else if (kind === "desk") await doc.transform(weld(), dedup(), prune());
else {
  await MeshoptSimplifier.ready;
  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.28, error: 0.001 }),
    dedup(),
    prune(),
  );
}
const textures = [];
for (const texture of doc.getRoot().listTextures()) {
  const slots = [];
  for (const m of doc.getRoot().listMaterials()) {
    if (m.getBaseColorTexture() === texture) slots.push([m.getName(), "color"]);
    if (m.getNormalTexture() === texture) slots.push([m.getName(), "normal"]);
    if (m.getMetallicRoughnessTexture() === texture)
      slots.push([m.getName(), "roughness-metal"]);
  }
  const normal = slots.some((x) => x[1] === "normal");
  const limit =
    kind === "mirror" || kind === "desk" || slots.some((x) => x[0] === "brass")
      ? 1024
      : slots.some((x) => x[0] === "moon")
        ? 256
        : 512;
  const image = sharp(texture.getImage())
    .resize({
      width: limit,
      height: limit,
      fit: "inside",
      withoutEnlargement: true,
    })
    .removeAlpha();
  const bytes = normal
    ? await image.png({ compressionLevel: 9 }).toBuffer()
    : await image.jpeg({ quality: 94, mozjpeg: true }).toBuffer();
  texture.setImage(bytes).setMimeType(normal ? "image/png" : "image/jpeg");
  textures.push({
    slots,
    bytes: bytes.length,
    dimensions: (await sharp(bytes).metadata()).width,
  });
}
const bytes = await io.writeBinary(doc),
  sha256 = createHash("sha256").update(bytes).digest("hex");
const path = `/assets/${kind}/${kind}-${sha256.slice(0, 12)}.glb`;
await mkdir(`public/assets/${kind}`, { recursive: true });
await writeFile("public" + path, bytes);
const manifest = {
  id: kind,
  chapter: kind === "mirror" ? "V" : kind === "desk" ? "VII" : "VI",
  path,
  bytes: bytes.length,
  sha256,
  sourceBytes: original.length,
  sourceSha256: createHash("sha256").update(original).digest("hex"),
  ...source,
  textures,
  triangles: doc
    .getRoot()
    .listMeshes()
    .reduce(
      (s, m) =>
        s +
        m
          .listPrimitives()
          .reduce((n, p) => n + p.getIndices().getCount() / 3, 0),
      0,
    ),
  originalAnimations: doc
    .getRoot()
    .listAnimations()
    .map((a) => a.getName()),
  changes: {
    mirror: [
      "Frame consolidated without changing silhouette/UVs; glass retained separately",
      "Original 1K artwork compressed without repainting",
      "Runtime planar architectural reflection proxy, 256/512 target; cache during reading",
    ],
    armillary: [
      "Separate nodes and pivots retained",
      "Geometry simplified with maximum source-space error .001",
      "Original maps compressed; brass at 1K and planets at 256/512",
    ],
    hourglass: [
      "Original ornate maps compressed to 512",
      "Geometry simplified with maximum source-space error .001",
      "Black glass tint corrected; transmission disabled, clear alpha .20; sand geometry colored aged beige",
    ],
    desk: [
      "All eight original pieces and original 4,762 triangles retained",
      "Original 1K artwork compressed without repainting",
      "Separate center drawer translates from closed to authored open pose; no source clip exists",
      "Other drawers and door retain source open positions",
    ],
  }[kind],
  ...(kind === "desk"
    ? {
        drawer: {
          sourceNode: "desk:polySurface13",
          runtimeNode: "deskpolySurface13",
          distance: 23.633079528808594,
          duration: 2.2,
        },
      }
    : {}),
};
if (kind === "desk") {
  const bounds = getBounds(doc.getRoot().listScenes()[0]);
  manifest.sourceProportions = {
    width: bounds.max[2] - bounds.min[2],
    height: bounds.max[1] - bounds.min[1],
  };
}
await writeFile(
  `src/content/${kind}.json`,
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    kind,
    bytes: manifest.bytes,
    triangles: manifest.triangles,
    primitives: doc.getRoot().listMeshes().length,
  }),
);
