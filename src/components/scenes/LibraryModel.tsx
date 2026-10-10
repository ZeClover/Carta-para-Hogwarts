"use client";
import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Box3, Mesh, Vector3 } from "three";
import library from "@/content/generated-assets.json";
type ModelId =
  | "ClassicConsole_01"
  | "ArmChair_01"
  | "fancy_picture_frame_01"
  | "ornate_mirror_01"
  | "mantel_clock_01";
class ModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function LoadedModel({
  id,
  size,
  at,
  rotation = 0,
}: {
  id: ModelId;
  size: [number, number, number];
  at: [number, number, number];
  rotation?: number;
}) {
  const path = library.find((a) => a.id === id)!.path;
  const gltf = useLoader(GLTFLoader, path);
  const model = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(scene),
      actual = bounds.getSize(new Vector3()),
      center = bounds.getCenter(new Vector3());
    const factors = new Vector3(
      size[0] / actual.x,
      size[1] / actual.y,
      size[2] / actual.z,
    );
    scene.scale.copy(factors);
    scene.position.set(
      -center.x * factors.x,
      -bounds.min.y * factors.y,
      -center.z * factors.z,
    );
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return scene;
  }, [gltf, size]);
  return (
    <group
      position={at}
      rotation={[0, rotation, 0]}
      dispose={null}
      userData={{ assetId: id }}
    >
      <primitive object={model} dispose={null} />
    </group>
  );
}
export function LibraryModel(
  props: Parameters<typeof LoadedModel>[0] & { fallback: ReactNode },
) {
  return (
    <ModelBoundary fallback={props.fallback}>
      <Suspense fallback={props.fallback}>
        <LoadedModel {...props} />
      </Suspense>
    </ModelBoundary>
  );
}
