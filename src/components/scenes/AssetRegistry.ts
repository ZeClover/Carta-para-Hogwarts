import { useLoader } from "@react-three/fiber";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
const registry = new Map<
  string,
  { users: number; asset: GLTF; timer?: ReturnType<typeof setTimeout> }
>();
/** Exclusive chapter GLBs, bounded to mounted scenes. Grace protects StrictMode and overlapping exits. */
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
