"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ChapterId } from "@/content/chapters";
import type { SceneKind } from "./config";
import { chapterDirection, chapterOrder } from "./chapterDirection";
import { DocumentHandoff } from "./DocumentHandoff";
import { SceneDiagnostics } from "./SceneDiagnostics";
import { CameraDirector } from "./CameraDirector";
import { ChapterModel } from "./ChapterModel";
import { LibraryModel } from "./LibraryModel";
import { EnchantedBook } from "./EnchantedBook";
import { createPageGeometry, deformPage } from "./pageGeometry";
import { VictorianDesk } from "./VictorianDesk";
import { OrnateHourglass } from "./OrnateHourglass";
import { OrnateMirror } from "./OrnateMirror";
import { ArmillarySphere } from "./ArmillarySphere";
import { InkQuill } from "./InkQuill";
import { SceneEntrancePlayback } from "./sceneEntrancePlayback";
import { PhotoBox } from "./PhotoBox";
import { PhotoBoxPlayback } from "./photoBoxMotion";

type Props = {
  onReady?: (phase?: "assets") => void;
  opening?: boolean;
  open?: boolean;
  kind: SceneKind;
  still: boolean;
  active: boolean;
  turning?: boolean;
  turnSerial?: number;
  turnDirection?: number;
  writtenText?: string;
  limited?: boolean;
  onAction: () => void;
  onJourney?: (moving: boolean) => void;
  onPhotoSelect?: (id: string) => void;
  selectedPhoto?: string;
  archivePlayback?: PhotoBoxPlayback;
  inkPlayback?: SceneEntrancePlayback;
  mirrorPlayback?: SceneEntrancePlayback;
  armillaryPlayback?: SceneEntrancePlayback;
  deskPlayback?: SceneEntrancePlayback;
};
function useSurface(kind: "wood" | "wall" | "letter" | "paper") {
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle =
      kind === "wood" ? "#765337" : kind === "wall" ? "#aea084" : "#e5d0a4";
    ctx.fillRect(0, 0, 512, 512);
    // Deterministic material grain, independent of player data.
    for (let i = 0; i < 1400; i++) {
      ctx.strokeStyle = `rgba(45,27,15,${kind === "wood" ? 0.03 + (i % 11) * 0.003 : 0.003})`;
      ctx.beginPath();
      const y = (i * 37) % 512;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(130, y + (i % 13), 380, y - (i % 17), 512, y);
      ctx.stroke();
    }
    if (kind === "wall") {
      ctx.strokeStyle = "rgba(74,64,47,.28)";
      for (let x = 32; x < 512; x += 64)
        for (let y = 32; y < 512; y += 64) {
          ctx.beginPath();
          ctx.ellipse(x, y, 12, 23, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
    }
    if (kind === "letter") {
      ctx.strokeStyle = "#a78a57";
      ctx.lineWidth = 2;
      ctx.strokeRect(29, 29, 454, 454);
      ctx.fillStyle = "#663e27";
      ctx.textAlign = "center";
      ctx.font = "italic 52px Georgia";
      ctx.fillText("H", 256, 104);
      ctx.font = "22px Georgia";
      ctx.fillText("HOGWARTS", 256, 151);
      ctx.font = "16px Georgia";
      ctx.fillText("Registro de admissão · 1890", 256, 187);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = "rgba(85,58,30,.4)";
        ctx.fillRect(73, 235 + i * 24, 340 - (i % 3) * 30, 2);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 2;
    return t;
  }, [kind]);
  useEffect(() => () => map.dispose(), [map]);
  return map;
}
function Document({
  turning,
  still,
  turnSerial,
  turnDirection = 1,
  opening,
  open,
}: Pick<
  Props,
  "turning" | "still" | "turnSerial" | "turnDirection" | "opening" | "open"
>) {
  const map = useSurface("letter"),
    g = useMemo(() => createPageGeometry(), []);
  const { invalidate, gl } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
  const emerging = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!emerging.current) return;
    const group = emerging.current;
    group.visible = !opening || !!open;
    if (opening && !still) gsap.set(group.position, { z: -0.8, y: 0.05 });
    const timeline = gsap.timeline();
    timeline.to(group.position, {
      z: 0,
      y: 0,
      duration: opening && !still ? 1.5 : 0,
      ease: "power2.out",
      onUpdate: invalidate,
    });
    return () => {
      timeline.kill();
    };
  }, [opening, open, still, invalidate]);
  useEffect(() => () => g.dispose(), [g]);
  useEffect(() => {
    const state = { p: 0 };
    const paint = () => {
      deformPage(g, state.p, turnDirection);
      invalidate();
      gl.domElement.setAttribute("data-page-direction", String(turnDirection));
      gl.domElement.setAttribute(
        "data-page-curl",
        (Math.sin(state.p * Math.PI) * 1.2).toFixed(3),
      );
    };
    paint();
    if (!turning || still) return;
    const t = gsap.to(state, {
      p: 1,
      duration: 0.28,
      ease: "power1.inOut",
      onUpdate: paint,
      onComplete: () => {
        state.p = 0;
        paint();
      },
    });
    return () => {
      t.kill();
    };
  }, [turning, turnSerial, turnDirection, still, g, invalidate, gl]);
  return (
    <group ref={emerging}>
      <group position={[-0.75, -0.15, 0]} scale={1.25}>
        <mesh ref={mesh} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial
            map={map}
            roughness={0.94}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
function usePhotograph() {
  const original = useLoader(THREE.TextureLoader, "/assets/memory-forest.jpg");
  const photo = useMemo(() => {
    const copy = original.clone();
    copy.colorSpace = THREE.SRGBColorSpace;
    copy.needsUpdate = true;
    return copy;
  }, [original]);
  useEffect(() => () => photo.dispose(), [photo]);
  return photo;
}
function Photograph({
  at,
  rotation = 0,
  scale = 1,
}: {
  at: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const photo = usePhotograph();
  return (
    <group position={at} rotation={[-Math.PI / 2, 0, rotation]} scale={scale}>
      <mesh castShadow>
        <planeGeometry args={[1, 1.1]} />
        <meshStandardMaterial
          map={photo}
          roughness={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
function Beveled({
  at,
  size,
  color = "#69452f",
  map,
}: {
  at: [number, number, number];
  size: [number, number, number];
  color?: string;
  map?: THREE.Texture;
}) {
  const geometry = useMemo(
    () => new RoundedBoxGeometry(...size, 3, Math.min(...size) / 5),
    [size],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={at} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial map={map} color={color} roughness={0.76} />
    </mesh>
  );
}
function Correspondence({
  open,
  still,
  onAction,
  rebuilt = false,
  onReady,
}: {
  rebuilt?: boolean;
  onReady?: (phase?: "assets") => void;
  open: boolean;
  still: boolean;
  onAction: () => void;
}) {
  const paper = useSurface("paper"),
    flap = useRef<THREE.Group>(null),
    { invalidate } = useThree();
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.08, 0);
    s.quadraticCurveTo(-1.12, -0.02, -1.05, -0.07);
    s.lineTo(-0.05, -0.76);
    s.quadraticCurveTo(0, -0.79, 0.05, -0.76);
    s.lineTo(1.05, -0.07);
    s.quadraticCurveTo(1.12, -0.02, 1.08, 0);
    s.closePath();
    return s;
  }, []);
  const wax = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i <= 64; i++) {
      const a = (i * Math.PI) / 32,
        r = 0.15 + Math.sin(i * 1.9) * 0.006;
      if (i) s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.moveTo(r, 0);
    }
    return s;
  }, []);
  useEffect(() => {
    if (!flap.current) return;
    const t = gsap.to(flap.current.rotation, {
      x: open ? -Math.PI * 0.94 : 0,
      duration: still ? 0 : 0.9,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [open, still, invalidate]);
  return (
    <group
      position={[0, 0.065, 0]}
      rotation={[-Math.PI / 2, 0, -0.07]}
      onClick={(e) => {
        e.stopPropagation();
        onAction();
      }}
    >
      {rebuilt ? (
        <group rotation={[Math.PI / 2, 0, 0]}>
          <ChapterModel
            chapter="I"
            sealOpen={open}
            still={still}
            onReady={onReady}
          />
        </group>
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.2, 1.45, 0.025]} />
            <meshStandardMaterial map={paper} roughness={0.94} />
          </mesh>
          <mesh position={[0, 0, 0.022]}>
            <planeGeometry args={[2.16, 1.4]} />
            <meshStandardMaterial map={paper} roughness={0.94} />
          </mesh>
        </>
      )}
      <group position={[0, 0.72, 0.03]} ref={flap}>
        <mesh castShadow>
          <extrudeGeometry
            args={[
              shape,
              {
                depth: 0.012,
                bevelEnabled: true,
                bevelSegments: 2,
                steps: 1,
                bevelSize: 0.005,
                bevelThickness: 0.005,
              },
            ]}
          />
          <meshStandardMaterial
            map={paper}
            roughness={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {!rebuilt && (
        <>
          <mesh position={[0, -0.19, 0.04]} castShadow>
            <extrudeGeometry
              args={[
                wax,
                {
                  depth: 0.027,
                  bevelEnabled: true,
                  bevelSegments: 3,
                  steps: 1,
                  bevelSize: 0.007,
                  bevelThickness: 0.009,
                },
              ]}
            />
            <meshStandardMaterial color="#812c38" roughness={0.38} />
          </mesh>
          <mesh position={[0, -0.19, 0.083]}>
            <torusGeometry args={[0.108, 0.009, 8, 48]} />
            <meshStandardMaterial color="#b96759" roughness={0.45} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.023, -0.19, 0.083]}>
              <boxGeometry args={[0.012, 0.082, 0.008]} />
              <meshStandardMaterial color="#b96759" roughness={0.45} />
            </mesh>
          ))}
          <mesh position={[0, -0.19, 0.083]}>
            <boxGeometry args={[0.05, 0.012, 0.008]} />
            <meshStandardMaterial color="#b96759" roughness={0.45} />
          </mesh>
        </>
      )}
    </group>
  );
}
function WindowDelivery({ turning, still, onAction, onReady }: Props) {
  return (
    <group>
      <group position={[0, 0, -0.7]}>
        <ChapterModel chapter="IV" onReady={onReady} />
      </group>
      <group position={[0, 0.16, 0.7]} scale={1.2}>
        <Correspondence open={!turning} still={still} onAction={onAction} />
      </group>
    </group>
  );
}
function Protagonist({ chapter, ...props }: Props & { chapter: ChapterId }) {
  const singlePage = useThree((state) => state.size.width <= 700);
  const { turning, still, onAction } = props;
  if (chapter === "I")
    return (
      <>
        <group
          position={[0.85, 0.05, -0.85]}
          rotation={[0, 0.3, 0]}
          scale={0.85}
        >
          <Correspondence
            onReady={props.onReady}
            rebuilt
            open={props.open ?? !turning}
            still={still}
            onAction={onAction}
          />
        </group>
        <Document {...props} />
      </>
    );
  if (chapter === "II")
    return (
      <group scale={1.25} rotation={[0, -0.18, 0]}>
        <EnchantedBook
          {...props}
          registration
          album
          rebuilt
          singlePage={singlePage}
        />
      </group>
    );
  if (chapter === "III")
    return <InkQuill playback={props.inkPlayback!} onReady={props.onReady} />;
  if (chapter === "IV") return <WindowDelivery {...props} />;
  if (chapter === "V")
    return (
      <OrnateMirror playback={props.mirrorPlayback!} onReady={props.onReady} />
    );
  if (chapter === "VI")
    return (
      <ArmillarySphere
        playback={props.armillaryPlayback!}
        onReady={props.onReady}
      />
    );
  return (
    <>
      <VictorianDesk
        playback={props.deskPlayback!}
        onSelect={props.onPhotoSelect}
      />
      <PhotoBox
        secondary
        playback={props.archivePlayback!}
        onReady={props.onReady}
        onSelect={props.onPhotoSelect}
        selected={props.selectedPhoto}
      />
    </>
  );
}
function Bay({ chapter, props }: { chapter: ChapterId; props: Props }) {
  const mobile = useThree((state) => state.size.width <= 700);
  const d = chapterDirection[chapter],
    wood = useSurface("wood");
  return (
    <group
      position={[chapterOrder.indexOf(chapter) * 18, 0, 0]}
      name={`chapter-${chapter}`}
    >
      <mesh position={[0, 1, -2.3]} receiveShadow>
        <planeGeometry args={[13, 10]} />
        <meshStandardMaterial color={d.wall} roughness={0.95} />
      </mesh>
      <mesh
        position={[0, chapter === "VII" && mobile ? -0.7 : -1.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[13, 10]} />
        <meshStandardMaterial map={wood} color="#74523e" roughness={0.86} />
      </mesh>
      {chapter === "VII" ? null : chapter === "II" ? (
        <Beveled at={[0, -0.08, 0]} size={[5.3, 0.15, 3.2]} color="#9a8c71" />
      ) : chapter === "V" ? (
        <Beveled at={[0, -0.1, 0]} size={[3.2, 0.2, 1]} color="#584333" />
      ) : (
        <Beveled at={[0, -0.1, 0]} size={[5, 0.2, 3.5]} map={wood} />
      )}
      {chapter === "VI" && <OrnateHourglass />}
      <group name={`hero-${chapter}`}>
        <Protagonist {...props} chapter={chapter} />
      </group>
      {chapter === "II" && (
        <>
          <group position={[-2, 0.08, -0.4]} rotation={[-Math.PI / 2, 0, -0.3]}>
            <LibraryModel
              id="fancy_picture_frame_02"
              at={[0, 0, 0]}
              size={[1.2, 1.6, 0.35]}
              fallback={null}
            />
          </group>
          <Photograph at={[2, 0.06, -0.4]} rotation={0.3} scale={0.75} />
        </>
      )}
    </group>
  );
}
export function ChapterWorld(props: Props) {
  const deskPlayback = useMemo(() => new SceneEntrancePlayback(), []);
  const mirrorPlayback = useMemo(() => new SceneEntrancePlayback(), []);
  const armillaryPlayback = useMemo(() => new SceneEntrancePlayback(), []);
  const inkPlayback = useMemo(() => new SceneEntrancePlayback(), []);
  const archivePlayback = useMemo(() => new PhotoBoxPlayback(), []);
  const { still } = props;
  const chapter = chapterOrder.includes(props.kind as ChapterId)
      ? (props.kind as ChapterId)
      : "I",
    d = chapterDirection[chapter];
  const x = chapterOrder.indexOf(chapter) * 18;
  const keyTarget = useMemo(() => new THREE.Object3D(), []);
  const [journey, setJourney] = useState<{
    chapter: ChapterId;
    from: ChapterId | null;
  }>({ chapter, from: null });
  // Derive the departure before committing children, retaining the old bay and its assets.
  if (journey.chapter !== chapter) {
    setJourney({ chapter, from: still ? null : journey.chapter });
  }
  useEffect(() => {
    const exit = setTimeout(
      () =>
        setJourney((current) =>
          current.from ? { ...current, from: null } : current,
        ),
      still ? 0 : 1400,
    );
    return () => {
      clearTimeout(exit);
    };
  }, [chapter, still]);
  const visible = chapterOrder.filter(
    (c) => c === chapter || c === journey.from,
  );
  return (
    <>
      <color attach="background" args={[d.wall]} />
      <fog attach="fog" args={[d.wall, 14, 32]} />
      <hemisphereLight args={[d.fill, "#816248", 1.7]} />
      <primitive object={keyTarget} position={[x, 0, 0]} />
      <directionalLight
        target={keyTarget}
        position={[x + 2, 7, 5]}
        intensity={3.6}
        color={d.key}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-normalBias={0.04}
        shadow-bias={-0.0015}
      />
      <pointLight
        position={[x - 3, 2, 2]}
        intensity={18}
        distance={12}
        color={d.fill}
      />
      {visible.map((c) => (
        <Bay
          key={c}
          chapter={c}
          props={{
            ...props,
            archivePlayback,
            inkPlayback,
            mirrorPlayback,
            armillaryPlayback,
            deskPlayback,
            onReady: c === chapter ? props.onReady : undefined,
            turning: c === chapter && props.turning,
            turnSerial: c === chapter ? props.turnSerial : 0,
            active: c === chapter && props.active,
            writtenText: c === chapter ? props.writtenText : undefined,
            still: props.still || c !== chapter,
          }}
        />
      ))}
      <DocumentHandoff opening={props.opening} turning={props.turning} />
      <SceneDiagnostics chapter={chapter} />
      <CameraDirector
        opening={props.opening}
        chapter={chapter}
        still={props.still}
        turning={props.turning}
        onJourney={props.onJourney}
        archivePlayback={archivePlayback}
        deskPlayback={deskPlayback}
        objectPlayback={
          chapter === "V"
            ? mirrorPlayback
            : chapter === "VI"
              ? armillaryPlayback
              : inkPlayback
        }
      />
    </>
  );
}
