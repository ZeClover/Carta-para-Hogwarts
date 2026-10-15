/** Retain two adjoining architectural walls and the floor of the supplied room.
 * No furniture, paintings, invented memories, or new surface artwork. */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  prune,
  quantize,
  simplify,
  weld,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const input = process.argv[2];
if (!input) throw Error("Supply the original Victorian_Hallway.gltf");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
await MeshoptSimplifier.ready;
const variants = [];
for (const mobile of [false, true]) {
  const doc = await io.read(input);
  const root = doc.getRoot(),
    scene = root.listScenes()[0];
  root.setDefaultScene(scene);
  scene
    .listChildren()[0]
    .setTranslation([0, 0, 0])
    .setRotation([-Math.SQRT1_2, 0, 0, Math.SQRT1_2]);
  const glass = doc
    .createMaterial("Window exterior")
    .setBaseColorFactor([0.44, 0.61, 0.69, 1])
    .setDoubleSided(true)
    .setRoughnessFactor(1);
  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    if (
      !/^(Interior_Interior|Floor_|Window_|Glass_|Door_Frame_1_|Door_1_)/.test(
        node.getName(),
      )
    ) {
      node.setMesh(null);
      continue;
    }
    if (/^Glass_/.test(node.getName()))
      for (const p of mesh.listPrimitives()) p.setMaterial(glass);
    if (node.getName() !== "Interior_Interior_0") continue;
    const m = node.getWorldMatrix();
    for (const p of mesh.listPrimitives()) {
      const positions = p.getAttribute("POSITION"),
        indices = p.getIndices();
      if (!positions || !indices)
        throw Error("Expected indexed architectural mesh");
      const kept = [],
        v = [0, 0, 0];
      for (let i = 0; i < indices.getCount(); i += 3) {
        let x = 0,
          z = 0;
        for (let j = 0; j < 3; j++) {
          positions.getElement(indices.getScalar(i + j), v);
          x += m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
          z += m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
        }
        // Window wall and its adjoining wood-panel wall. The camera side is open.
        if (x / 3 < -3.43 || z / 3 > 2.48)
          kept.push(
            indices.getScalar(i),
            indices.getScalar(i + 1),
            indices.getScalar(i + 2),
          );
      }
      p.setIndices(
        doc
          .createAccessor("Backdrop shell indices", indices.getBuffer())
          .setType("SCALAR")
          .setArray(new Uint32Array(kept)),
      );
    }
  }
  for (const material of root.listMaterials())
    if (material.getName() === "Interior")
      material
        .setAlphaMode("MASK")
        .setAlphaCutoff(0.12)
        .setEmissiveFactor([0.025, 0.025, 0.025]);
  await doc.transform(
    prune(),
    flatten(),
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.65, error: 0.001 }),
    dedup(),
    join({ keepNamed: false }),
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 14,
    }),
    prune(),
  );
  for (const texture of root.listTextures()) {
    const alpha = texture.getName().includes("rgba"),
      normal = root
        .listMaterials()
        .some((m) => m.getNormalTexture() === texture);
    let image = sharp(texture.getImage()).resize(
      mobile ? 512 : 1024,
      mobile ? 512 : 1024,
      { fit: "inside", withoutEnlargement: true },
    );
    if (!alpha) image = image.removeAlpha();
    texture
      .setImage(
        await (
          alpha
            ? image.png({ compressionLevel: 9 })
            : image.jpeg({ quality: normal ? 93 : 90 })
        ).toBuffer(),
      )
      .setMimeType(alpha ? "image/png" : "image/jpeg");
  }
  const binary = await io.writeBinary(doc),
    sha256 = createHash("sha256").update(binary).digest("hex");
  const path = `/assets/hallway-backdrop/architecture-${mobile ? "mobile" : "desktop"}-${sha256.slice(0, 12)}.glb`;
  await mkdir("public/assets/hallway-backdrop", { recursive: true });
  await writeFile("public" + path, binary);
  variants.push({
    path,
    sha256,
    bytes: binary.byteLength,
    triangles: root
      .listMeshes()
      .reduce(
        (s, m) =>
          s +
          m
            .listPrimitives()
            .reduce((a, p) => a + p.getIndices().getCount() / 3, 0),
        0,
      ),
    textureLimit: mobile ? 512 : 1024,
  });
}
const source = JSON.parse(await readFile("src/content/hallway.json", "utf8"));
await writeFile(
  "src/content/hallway-backdrop.json",
  JSON.stringify(
    {
      id: "victorian-architecture",
      desktop: variants[0],
      mobile: variants[1],
      sourceArchiveSha256: source.sourceArchiveSha256,
      author: source.author,
      license: source.license,
      source: "Architectural sections of the user-supplied Victorian Hallway",
      changes: [
        "Two original adjoining walls, window, door and floor; other geometry removed",
        "Original UVs and texture artwork retained, resized for desktop/mobile",
        "No photographs, paintings, personal objects or narrative content",
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(variants));
