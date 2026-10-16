import { useLoader } from "@react-three/fiber";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { assetsManifest } from "@/content/assets-manifest";
import { chapterScenes } from "./chapterScenes";
import hallway from "@/content/hallway.json";
const registry = new Map<
  string,
  { users: number; asset: GLTF; timer?: ReturnType<typeof setTimeout> }
>();
/** Suspense also caches rejected loads. A new renderer is an explicit attempt;
 * preserve retained successes, but let unmounted/failed resources load again. */
export function prepareChapterAssetAttempt() {
  const paths = new Set([
    ...assetsManifest.rebuilt.map((asset) => asset.path),
    ...assetsManifest.imported.map((asset) => asset.path),
    hallway.mobile.path,
    ...Object.values(chapterScenes).flatMap((scene) => [
      ...scene.criticalAssets,
      ...scene.optionalAssets,
      ...(scene.environment ? Object.values(scene.environment) : []),
    ]),
  ]);
  for (const path of paths)
    if (path.endsWith(".glb") && !registry.has(path))
      useLoader.clear(GLTFLoader, path);
  useLoader.clear(THREE.TextureLoader, "/assets/memory-forest.jpg");
}
/** Reference-counted GLBs, bounded to mounted scenes. Grace protects StrictMode and overlapping exits. */
export function retainChapterAsset(path: string, asset: GLTF) {
  const entry = registry.get(path) ?? { users: 0, asset };
  if (entry.timer) clearTimeout(entry.timer);
  entry.users++;
  registry.set(path, entry);
  return () => {
    entry.users--;
    entry.timer = setTimeout(() => {
      if (entry.users || registry.get(path) !== entry) return;
      registry.delete(path);
      useLoader.clear(GLTFLoader, path);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>();
      asset.scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        geometries.add(node.geometry);
        for (const material of Array.isArray(node.material)
          ? node.material
          : [node.material]) {
          materials.add(material);
          for (const value of Object.values(material))
            if (value instanceof THREE.Texture) textures.add(value);
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    }, 250);
  };
}
