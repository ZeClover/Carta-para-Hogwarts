"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { memo, Suspense, useEffect, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import type { SceneKind } from "./config";
import {
  Room,
  Envelope,
  Frame,
  Mirror,
  StarMap,
  Hourglass,
  Drawer,
} from "./StudyObjects";
import { ChapterWorld } from "./ChapterWorld";
import { LibraryModel } from "./LibraryModel";
import { EnchantedBook } from "./EnchantedBook";
import { AtmosphericDetails, ChapterProps } from "./StudyDetails";

type Props = {
  opening?: boolean;
  open?: boolean;
  immersive?: boolean;
  turnSerial?: number;
  turnDirection?: number;
  turning?: boolean;
  limited?: boolean;
  writtenText?: string;
  kind: SceneKind;
  active: boolean;
  still: boolean;
  onAction: () => void;
  onJourney?: (moving: boolean) => void;
  onFailure: () => void;
  onReady: (phase?: "assets") => void;
};
function CameraAndLife({
  kind,
  active,
  still,
  onFailure,
  onReady,
  immersive,
  environmentOnly = false,
}: Props & { environmentOnly?: boolean }) {
  const { camera, gl, invalidate, get, size } = useThree();
  const previousKind = useRef<SceneKind | null>(null);
  useEffect(() => {
    const canvas = gl.domElement;
    const lose = (e: Event) => {
      e.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lose);
    if (!environmentOnly) onReady();
    return () => canvas.removeEventListener("webglcontextlost", lose);
  }, [gl, onFailure, onReady, environmentOnly]);
  useEffect(() => {
    if (environmentOnly) return;
    const start: [number, number, number] =
      kind === "I"
        ? [1.8, 2.8, 3.4]
        : kind === "II"
          ? [3.9, 4.6, 6.1]
          : kind === "V"
            ? [4.6, 3.9, 7]
            : [5.4, 5.3, 6.8];
    const end: [number, number, number] =
      kind === "V"
        ? [2.5, 3.2, 5.5]
        : kind === "II"
          ? [2.8, 3.7, 5.0]
          : kind === "letter" && !active
            ? [2.1, 3.3, 4.2]
            : [3.9, 4.6, 6.1];
    if (immersive) {
      const portrait = size.width < size.height;
      const offset =
        kind === "V"
          ? -0.45
          : kind === "II"
            ? -0.2
            : kind === "IV"
              ? 0.28
              : kind === "VI"
                ? 0.12
                : 0;
      end[0] = (portrait ? 0.55 : 2.0) + offset + (active ? 0.08 : 0);
      end[1] = portrait ? 4.65 : 4.05;
      end[2] = (portrait ? 8.6 : 6.5) + (active ? 0.12 : 0);
      start[0] = end[0] + (portrait ? 0.4 : 1.2);
      start[1] = end[1] + 0.8;
      start[2] = end[2] + 2;
    }
    const firstEntrance = previousKind.current === null;
    const entering = previousKind.current !== kind;
    previousKind.current = kind;
    if (still) camera.position.set(...end);
    else if (entering && (!immersive || firstEntrance))
      camera.position.set(...start);
    const target = new THREE.Vector3(
      kind === "II" && entering && !still ? 1.8 : 0,
      immersive ? 1.45 : kind === "V" ? 1 : 0.55,
      0,
    );
    camera.lookAt(target);
    const markCamera = () => {
      gl.domElement.setAttribute(
        "data-camera",
        camera.position
          .toArray()
          .map((n) => n.toFixed(3))
          .join(","),
      );
    };
    markCamera();
    invalidate();
    const tween = gsap.to(camera.position, {
      x: end[0],
      y: end[1],
      z: end[2],
      duration: still ? 0 : 1.8,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(target);
        markCamera();
        invalidate();
      },
    });
    const lookTween = gsap.to(target, {
      x: 0,
      duration: still ? 0 : 1.8,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(target);
        invalidate();
      },
    });
    return () => {
      tween.kill();
      lookTween.kill();
    };
  }, [
    kind,
    active,
    still,
    camera,
    gl,
    invalidate,
    immersive,
    size.width,
    size.height,
    environmentOnly,
  ]);
  useEffect(() => {
    // Generate once per renderer, not for each camera/object interaction.
    // Generate a small warm environment in memory: mirror reflects the study palette.
    const generator = new THREE.PMREMGenerator(gl);
    const environmentScene = new THREE.Scene();
    environmentScene.background = new THREE.Color("#7c8e87");
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({ color: "#47554e", side: THREE.BackSide }),
    );
    environmentScene.add(walls);
    const windowLight = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 6),
      new THREE.MeshBasicMaterial({ color: "#d6dac0" }),
    );
    windowLight.position.set(0, 0, 4);
    windowLight.rotation.y = Math.PI;
    environmentScene.add(windowLight);
    const env = generator.fromScene(environmentScene, 0, 0.1, 100);
    get().scene.environment = env.texture;
    return () => {
      get().scene.environment = null;
      env.dispose();
      generator.dispose();
      walls.geometry.dispose();
      (walls.material as THREE.Material).dispose();
      windowLight.geometry.dispose();
      (windowLight.material as THREE.Material).dispose();
    };
  }, [gl, get]);
  return null;
}
function Study(props: Props & { label?: string }) {
  const { kind, active, still, onAction } = props;
  if (props.immersive)
    return (
      <>
        <Suspense fallback={null}>
          <ChapterWorld {...props} />
        </Suspense>
        <CameraAndLife {...props} environmentOnly />
      </>
    );
  return (
    <>
      <color attach="background" args={["#10272b"]} />
      <fog attach="fog" args={["#10272b", 11, 24]} />
      <hemisphereLight args={["#a9c2cf", "#644631", 0.9]} />
      <directionalLight
        name="study-key"
        position={[2, 7, 4]}
        intensity={2.1}
        color="#ffd29d"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.018}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight
        name="window-light"
        position={[2, 2.5, -3]}
        intensity={7}
        color="#a3cdd6"
        distance={10}
      />
      <Room />
      <AtmosphericDetails still={still} limited={props.limited} kind={kind} />
      <ChapterProps kind={kind} />
      <group
        onClick={(e) => {
          e.stopPropagation();
          onAction();
        }}
      >
        {kind === "letter" || kind === "IV" ? (
          <group position={props.immersive ? [-2.5, 0.1, -1] : [0, 0, 0]}>
            <Envelope
              open={active}
              still={still}
              onAction={onAction}
              arriving={kind === "IV"}
            />
          </group>
        ) : null}
        {props.immersive ||
        kind === "I" ||
        kind === "II" ||
        kind === "final" ? (
          <EnchantedBook
            active={active}
            still={still}
            onAction={onAction}
            final={kind === "final"}
            label={props.label}
            registration={props.immersive}
            album={kind === "II"}
            writtenText={props.writtenText}
            turnSerial={props.turnSerial}
            turnDirection={props.turnDirection}
            turning={props.turning}
          />
        ) : null}
        <group position={props.immersive ? [-2.8, 0, -1] : [0, 0, 0]}>
          {kind === "III" ? <Frame at={[0, 1, 0.1]} magic={active} /> : null}
          {kind === "V" ? (
            <group>
              <LibraryModel
                id="ornate_mirror_01"
                at={[0, 0.25, -0.4]}
                size={[1.9, 2.9, 0.12]}
                fallback={<Mirror active={active} />}
              />
              {active && (
                <pointLight
                  position={[0, 1.7, 0.6]}
                  intensity={5}
                  color="#b3ede2"
                  distance={5}
                />
              )}
            </group>
          ) : null}
          {kind === "VI" ? (
            <>
              <StarMap />
              <Hourglass active={active} still={still} />
            </>
          ) : null}
          {kind === "VII" ? <Drawer active={active} still={still} /> : null}
        </group>
      </group>
      <CameraAndLife {...props} />
    </>
  );
}
const MemoStudy = memo(Study);
export default function StudyCanvas(props: Props & { label?: string }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, props.limited ? 1 : 1.5]}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [4, 5, 6], fov: 43, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      fallback={null}
    >
      <MemoStudy {...props} />
    </Canvas>
  );
}
