import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld, quantize } from "@gltf-transform/functions";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const assets = JSON.parse(
  await readFile("src/content/redesign-assets.json", "utf8"),
);
for (const asset of assets) {
  const doc = await io.read("public" + asset.path);
  await doc.transform(
    weld(),
    dedup(),
    prune(),
    quantize({ quantizePosition: 14, quantizeNormal: 10 }),
  );
  const data = await io.writeBinary(doc);
  const previousPath = asset.path;
  asset.bytes = data.byteLength;
  asset.sha256 = createHash("sha256").update(data).digest("hex");
  asset.path = `/assets/redesign/chapter-${asset.chapter.toLowerCase()}-${asset.sha256.slice(0, 12)}.glb`;
  await writeFile("public" + asset.path, data);
  if (previousPath !== asset.path) await unlink("public" + previousPath);
  asset.triangles = doc
    .getRoot()
    .listMeshes()
    .reduce(
      (s, m) =>
        s +
        m
          .listPrimitives()
          .reduce(
            (n, p) =>
              n +
              (p.getIndices()?.getCount() ||
                p.getAttribute("POSITION").getCount()) /
                3,
            0,
          ),
      0,
    );
  asset.primitiveCount = doc
    .getRoot()
    .listMeshes()
    .reduce((s, m) => s + m.listPrimitives().length, 0);
  console.log(
    asset.chapter,
    asset.bytes,
    asset.triangles,
    asset.primitiveCount,
  );
}
await writeFile(
  "src/content/redesign-assets.json",
  JSON.stringify(assets, null, 2) + "\n",
);
