import { NodeIO } from "@gltf-transform/core";
import { dedup, prune } from "@gltf-transform/functions";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const cache = resolve(process.argv[2] || "/tmp/hogwarts-polyhaven");
const entries = JSON.parse(
  await readFile(resolve(cache, "manifest.json"), "utf8"),
);
const io = new NodeIO();
await mkdir("public/assets", { recursive: true });
for (const entry of entries) {
  const doc = await io.read(resolve(cache, entry.id, entry.id + ".gltf"));
  await doc.transform(dedup(), prune());
  for (const texture of doc.getRoot().listTextures()) {
    const image = texture.getImage();
    if (!image) continue;
    const metadata = await sharp(image).metadata();
    const operation = sharp(image).resize({
      width: 1024,
      height: 1024,
      fit: "inside",
      withoutEnlargement: true,
    });
    const data = metadata.hasAlpha
      ? await operation.png({ compressionLevel: 9 }).toBuffer()
      : await operation.jpeg({ quality: 78 }).toBuffer();
    texture
      .setImage(data)
      .setMimeType(metadata.hasAlpha ? "image/png" : "image/jpeg");
  }
  const binary = await io.writeBinary(doc);
  const path = "/assets/" + entry.id + ".glb";
  await writeFile("public" + path, binary);
  entry.path = path;
  entry.bytes = binary.byteLength;
  entry.sha256 = createHash("sha256").update(binary).digest("hex");
  console.log(entry.id + ": " + entry.bytes + " bytes bundled");
}
await writeFile(
  "src/content/generated-assets.json",
  JSON.stringify(entries, null, 2) + "\n",
);
