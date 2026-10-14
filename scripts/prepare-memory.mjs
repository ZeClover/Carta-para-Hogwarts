import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const cache = process.argv[2];
if (!cache)
  throw new Error("Pass the verified source cache from prepare-memory.py");
const input = path.join(cache, "source.jpg");
const m = await sharp(input).metadata();
const out = "public/assets/memory-forest.jpg";
await sharp(input)
  .extract({
    left: Math.round(m.width * 0.28),
    top: Math.round(m.height * 0.28),
    width: Math.round(m.width * 0.22),
    height: Math.round(m.height * 0.4),
  })
  .resize(512, 512, { fit: "cover" })
  .modulate({ saturation: 0.25 })
  .tint("#a99a79")
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(out);
const data = await fs.readFile(out);
const meta = JSON.parse(
  await fs.readFile(path.join(cache, "source.json"), "utf8"),
);
Object.assign(meta, {
  path: "/assets/memory-forest.jpg",
  bytes: data.length,
  sha256: crypto.createHash("sha256").update(data).digest("hex"),
  processing:
    "Recorte de paisagem anônima, 512px, tonalidade sépia. Ambientação artística; não define a infância do jogador.",
});
await fs.writeFile(
  "src/content/memory-asset.json",
  JSON.stringify(meta, null, 2) + "\n",
);
console.log(
  `CC0 photograph: ${data.length} bytes, source verified by downloader.`,
);
