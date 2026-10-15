/** Convert the supplied II/IV glTF exports without repainting their original atlases. */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  weld,
  prune,
  simplify,
  metalRough,
  getBounds,
  quantize,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
const [kind, input] = process.argv.slice(2);
if (!["scroll", "hallway"].includes(kind) || !input)
  throw Error("Supply scroll|hallway and original glTF");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const records = [];
for (const mobile of kind === "hallway" ? [false, true] : [false]) {
  const doc = await io.read(input),
    scene = doc.getRoot().listScenes()[0];
  doc.getRoot().setDefaultScene(scene);
  scene
    .listChildren()[0]
    .setTranslation([0, 0, 0])
    .setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
  const bounds = getBounds(scene),
    features = {};
  for (const node of doc.getRoot().listNodes())
    if (
      node.getMesh() &&
      /^(Window_|Glass_|Side_Table_1_|Floor_)/.test(node.getName())
    )
      features[node.getName()] = getBounds(node);
  if (kind === "hallway") {
    const glass = doc
      .createMaterial("Window exterior")
      .setBaseColorFactor([0.44, 0.61, 0.69, 1])
      .setRoughnessFactor(1)
      .setEmissiveFactor([0.06, 0.09, 0.12])
      .setDoubleSided(true);
    for (const node of doc.getRoot().listNodes()) {
      if (/^Glass_/.test(node.getName()))
        for (const p of node.getMesh()?.listPrimitives() ?? [])
          p.setMaterial(glass);
      if (
        (/^Plant_/.test(node.getName()) ||
          (mobile &&
            /^(Painting_|Book_|Book_Pile_|Paper_|Candle_Holder_)/.test(
              node.getName(),
            ))) &&
        !node.getMesh()
      )
        node.dispose();
    }
    for (const material of doc.getRoot().listMaterials()) {
      if (material.getName() === "Interior")
        material
          .setAlphaMode("MASK")
          .setAlphaCutoff(0.12)
          .setEmissiveFactor([0.05, 0.05, 0.05]);
      else if (material.getAlphaMode() === "BLEND")
        material.setAlphaMode("MASK").setAlphaCutoff(0.15);
    }
  } else await doc.transform(metalRough());
  await doc.transform(
    flatten(),
    weld(),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: kind === "scroll" ? 0.45 : 0.65,
      error: 0.001,
    }),
    dedup(),
    join({ keepNamed: false }),
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 14,
    }),
    prune(),
  );
  const textures = [];
  for (const texture of doc.getRoot().listTextures()) {
    const normal = doc
      .getRoot()
      .listMaterials()
      .some((m) => m.getNormalTexture() === texture);
    const alpha = texture.getName().includes("rgba");
    const limit = mobile
      ? 512
      : kind === "scroll"
        ? 1024
        : /Interior|Wooden|Grand_Victorian/.test(texture.getName())
          ? 1024
          : 512;
    let pipeline = sharp(texture.getImage()).resize(limit, limit, {
      fit: "inside",
      withoutEnlargement: true,
    });
    if (!alpha) pipeline = pipeline.removeAlpha();
    const data = alpha
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.jpeg({ quality: normal ? 95 : 92 }).toBuffer();
    texture.setImage(data).setMimeType(alpha ? "image/png" : "image/jpeg");
    textures.push({
      name: texture.getName(),
      maxSize: limit,
      bytes: data.length,
    });
  }
  const data = await io.writeBinary(doc),
    hash = createHash("sha256").update(data).digest("hex");
  const path = `/assets/${kind}/${kind}${mobile ? "-mobile" : ""}-${hash.slice(0, 12)}.glb`;
  await mkdir(`public/assets/${kind}`, { recursive: true });
  await writeFile("public" + path, data);
  records.push({
    path,
    sha256: hash,
    bytes: data.length,
    triangles: doc
      .getRoot()
      .listMeshes()
      .reduce(
        (sum, m) =>
          sum +
          m
            .listPrimitives()
            .reduce((a, p) => a + (p.getIndices()?.getCount() ?? 0) / 3, 0),
        0,
      ),
    textures,
    bounds,
    features,
  });
  console.log(
    kind,
    mobile ? "mobile" : "desktop",
    data.length,
    records.at(-1).triangles,
  );
}
const original = await readFile(input);
const archive = await readFile(`${dirname(input)}/../original.zip`).catch(
  () => null,
);
await writeFile(
  `src/content/${kind}.json`,
  JSON.stringify(
    {
      id: kind,
      chapter: kind === "scroll" ? "II" : "IV",
      ...records[0],
      mobile: records[1] ?? null,
      sourceSha256: createHash("sha256").update(original).digest("hex"),
      sourceArchiveSha256: archive
        ? createHash("sha256").update(archive).digest("hex")
        : null,
      sourceArchiveBytes: archive?.length ?? null,
      originalAnimations: [],
      author: null,
      license: null,
      source: "User-supplied original ZIP, preserved privately",
      changes: [
        "Original UVs and texture artwork retained; textures resized/compressed",
        "Presentation root levelled to authored Z-up, then converted to Y-up",
        kind === "scroll"
          ? "Legacy specular-glossiness converted to supported metallic-roughness"
          : "Fixed original window geometry; clear neutral exterior replaces white panes; foreground plants removed; mobile omits background decor",
      ],
    },
    null,
    2,
  ) + "\n",
);
