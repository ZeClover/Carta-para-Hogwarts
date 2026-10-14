/** Import the user-supplied GLTF. Original artwork and animation keys are retained.
 * Usage: node scripts/import-photo-box.mjs /path/to/Antique_Photo_Album.gltf */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld } from "@gltf-transform/functions";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

const input = process.argv[2];
if (!input)
  throw new Error("Supply the original Antique_Photo_Album.gltf path");
const json = JSON.parse(await readFile(input, "utf8"));
const resources = {};
for (const item of [...json.buffers, ...json.images]) {
  resources[item.uri] = new Uint8Array(
    await readFile(resolve(dirname(input), item.uri)),
  );
}
// Remove the presentation wrapper's arbitrary Sketchfab orientation. The authoring
// coordinates already have Y up. Keep the real hinge and every animation key.
const wrapper = json.nodes.find((n) => n.name === "Sketchfab_model");
wrapper.rotation = [0, 0, 0, 1];
wrapper.translation = [0, 0, 0];
json.nodes.find((n) => n.name === "GLTF_SceneRootNode").rotation = [0, 0, 0, 1];
// Three's current loader uses metallic/roughness. The supplied obsolete spec/gloss
// extension also mistakes an AO map for metal. Use its original albedo, AO, normal.
json.extensionsUsed = (json.extensionsUsed ?? []).filter(
  (x) => x !== "KHR_materials_pbrSpecularGlossiness",
);
for (const m of json.materials) {
  delete m.extensions?.KHR_materials_pbrSpecularGlossiness;
  m.pbrMetallicRoughness.metallicFactor = 0;
  m.pbrMetallicRoughness.roughnessFactor =
    m.name === "PhotoAlbumBox" ? 0.78 : 0.96;
  delete m.pbrMetallicRoughness.metallicRoughnessTexture;
  if (m.occlusionTexture)
    m.occlusionTexture.strength = m.name === "PhotoAlbumBox" ? 0.5 : 0;
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.readJSON({ json, resources });
await doc.transform(weld(), dedup(), prune());
const textures = [];
for (const t of doc.getRoot().listTextures()) {
  const normal = /normal/i.test(t.getName());
  const max = normal ? 1024 : /Box_albedo/i.test(t.getName()) ? 1536 : 1024;
  const image = sharp(t.getImage()).resize({
    width: max,
    height: max,
    fit: "inside",
    withoutEnlargement: true,
  });
  const bytes = normal
    ? await image.removeAlpha().png({ compressionLevel: 9 }).toBuffer()
    : await image.removeAlpha().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  t.setImage(bytes).setMimeType(normal ? "image/png" : "image/jpeg");
  textures.push({
    name: t.getName(),
    bytes: bytes.length,
    dimensions: (await sharp(bytes).metadata()).width,
  });
}
const binary = await io.writeBinary(doc);
const sha256 = createHash("sha256").update(binary).digest("hex");
const path = `/assets/photo-box/antique-photo-box-${sha256.slice(0, 12)}.glb`;
await mkdir("public/assets/photo-box", { recursive: true });
await writeFile("public" + path, binary);
const manifest = {
  id: "antique-photo-box",
  chapter: "VII",
  path,
  bytes: binary.length,
  sha256,
  source: "Antique_Photo_Album.zip — supplied by the project owner",
  authors: [],
  license: "Not specified in the supplied archive",
  sourceSha256: createHash("sha256")
    .update(await readFile(input))
    .digest("hex"),
  triangles: 1539,
  textures,
  animation: {
    name: "Open and Close",
    openingEnd: 1.9835,
    duration: 3.9670000076293945,
    target: "Cover_2",
    use: "Original opening only; held open during reading",
  },
  changes: [
    "Authoring coordinates restored",
    "Original textures compressed without repainting",
    "Obsolete spec/gloss converted to rough paper and wood",
    "Original hinge keyframes preserved",
  ],
};
await writeFile(
  "src/content/photo-box.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify(manifest, null, 2));
