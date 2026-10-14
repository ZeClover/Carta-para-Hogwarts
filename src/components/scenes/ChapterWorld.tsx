"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { ChapterId } from "@/content/chapters";
import type { SceneKind } from "./config";
import { chapterDirection, chapterOrder } from "./chapterDirection";
import { Box, Mirror } from "./StudyObjects";
import { CameraDirector } from "./CameraDirector";
import { LibraryModel } from "./LibraryModel";
import { EnchantedBook } from "./EnchantedBook";
import { createPageGeometry, deformPage } from "./pageGeometry";

type Props = {
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
}: Pick<Props, "turning" | "still" | "turnSerial" | "turnDirection">) {
  const map = useSurface("letter"),
    g = useMemo(() => createPageGeometry(), []);
  const { invalidate, gl } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
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
      duration: 1.55,
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
    <group position={[-0.75, -0.15, 0]} scale={1.25}>
      <mesh ref={mesh} geometry={g} castShadow receiveShadow>
        <meshStandardMaterial
          map={map}
          roughness={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>
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
function Memory({ turning, still }: { turning?: boolean; still: boolean }) {
  const photo = usePhotograph(),
    object = useRef<THREE.Group>(null),
    { invalidate } = useThree();
  useEffect(() => {
    if (!object.current) return;
    const t = gsap.to(object.current.position, {
      y: turning && !still ? 0.35 : 0,
      duration: still ? 0 : 0.75,
      ease: "sine.inOut",
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [turning, still, invalidate]);
  return (
    <group>
      <group position={[0, 1.65, -0.6]}>
        <LibraryModel
          id="fancy_picture_frame_01"
          at={[0, -1.5, 0]}
          size={[3.7, 3, 0.18]}
          fallback={
            <Box at={[0, 0, 0]} size={[3.7, 3, 0.15]} color="#a7854a" />
          }
        />
        <mesh position={[0, 0, 0.11]}>
          <planeGeometry args={[3.2, 2.5]} />
          <meshStandardMaterial map={photo} roughness={0.9} />
        </mesh>
      </group>
      <group ref={object}>
        <group position={[0.3, 0.15, 0.6]} rotation={[0, 0.4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 32, 24]} />
            <meshStandardMaterial
              color="#bccaad"
              roughness={0.24}
              metalness={0.25}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.014, 8, 64]} />
            <meshStandardMaterial
              color="#c5a366"
              metalness={0.7}
              roughness={0.35}
            />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 1.7, -0.35]}>
        <planeGeometry args={[3.2, 2.5]} />
        <meshBasicMaterial
          color="#abefdb"
          transparent
          opacity={turning ? 0.16 : 0.035}
          depthWrite={false}
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
}: {
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
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.45, 0.025]} />
        <meshStandardMaterial map={paper} roughness={0.94} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[2.16, 1.4]} />
        <meshStandardMaterial map={paper} roughness={0.94} />
      </mesh>
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
    </group>
  );
}
function GlassHourglass({
  turning,
  still,
}: {
  turning?: boolean;
  still: boolean;
}) {
  const ref = useRef<THREE.Group>(null),
    { invalidate } = useThree();
  const glass = useMemo(
    () =>
      new THREE.SplineCurve(
        [
          [-0.68, 0.25],
          [-0.52, 0.31],
          [-0.3, 0.22],
          [-0.08, 0.055],
          [0, 0.022],
          [0.08, 0.055],
          [0.3, 0.22],
          [0.52, 0.31],
          [0.68, 0.25],
        ].map(([y, r]) => new THREE.Vector2(r, y)),
      ).getPoints(48),
    [],
  );
  const rim = useMemo(
    () => [
      new THREE.Vector2(0.43, -0.045),
      new THREE.Vector2(0.46, -0.02),
      new THREE.Vector2(0.46, 0.02),
      new THREE.Vector2(0.43, 0.045),
    ],
    [],
  );
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.to(ref.current.rotation, {
      z: turning ? Math.PI : 0,
      duration: still ? 0 : 1.4,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [turning, still, invalidate]);
  return (
    <group position={[0, 0.9, 0]}>
      <group ref={ref}>
        {[-0.77, 0.77].map((y) => (
          <mesh key={y} position={[0, y, 0]} castShadow>
            <latheGeometry args={[rim, 48]} />
            <meshStandardMaterial
              color="#b59355"
              roughness={0.28}
              metalness={0.8}
            />
          </mesh>
        ))}
        {[-0.34, 0.34].flatMap((x) =>
          [-0.24, 0.24].map((z) => (
            <group key={`${x},${z}`} position={[x, 0, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.023, 0.023, 1.48, 16]} />
                <meshStandardMaterial
                  color="#bd9b62"
                  metalness={0.8}
                  roughness={0.28}
                />
              </mesh>
              {[-0.6, 0.6].map((y) => (
                <mesh key={y} position={[0, y, 0]}>
                  <sphereGeometry args={[0.04, 16, 12]} />
                  <meshStandardMaterial
                    color="#bd9b62"
                    metalness={0.8}
                    roughness={0.28}
                  />
                </mesh>
              ))}
            </group>
          )),
        )}
        <mesh>
          <latheGeometry args={[glass, 48]} />
          <meshPhysicalMaterial
            color="#bfd4d0"
            transparent
            opacity={0.33}
            roughness={0.12}
            metalness={0.05}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, s * 0.5, 0]} scale={[1, 0.5, 1]}>
            <sphereGeometry args={[0.23, 32, 20]} />
            <meshStandardMaterial color="#d9c398" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, -0.19, 0]}>
          <cylinderGeometry args={[0.005, 0.008, 0.38, 8]} />
          <meshStandardMaterial color="#d9c398" roughness={1} />
        </mesh>
      </group>
    </group>
  );
}
function CelestialChart({
  turning,
  still,
}: {
  turning?: boolean;
  still: boolean;
}) {
  const ref = useRef<THREE.Group>(null),
    { invalidate } = useThree();
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#19324a";
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = "#bdab7e";
    ctx.fillStyle = "#e8d4a2";
    ctx.lineWidth = 1;
    for (let r = 40; r < 235; r += 38) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI) / 12;
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(a) * 228, 256 + Math.sin(a) * 228);
      ctx.stroke();
      ctx.font = "10px Georgia";
      ctx.fillText(
        String(i + 1),
        250 + Math.cos(a) * 240,
        260 + Math.sin(a) * 240,
      );
    }
    for (let i = 0; i < 70; i++) {
      const x = 45 + ((i * 137) % 422),
        y = 45 + ((i * 97) % 422);
      ctx.beginPath();
      ctx.arc(x, y, i % 9 ? 1.3 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (i % 9 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(45 + (((i + 1) * 137) % 422), 45 + (((i + 1) * 97) % 422));
        ctx.stroke();
      }
    }
    ctx.strokeRect(18, 18, 476, 476);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => {
    if (!ref.current) return;
    const t = gsap.to(ref.current.rotation, {
      y: turning ? 0.075 : 0,
      duration: still ? 0 : 1.2,
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [turning, still, invalidate]);
  return (
    <group ref={ref} position={[0, 0.035, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial map={map} roughness={0.88} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 1.6, 0.035, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.045, 0.045, 2.55, 24]} />
          <meshStandardMaterial color="#b8a37f" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
function ArchiveCabinet({
  turning,
  still,
}: {
  turning?: boolean;
  still: boolean;
}) {
  const wood = useSurface("wood"),
    drawer = useRef<THREE.Group>(null),
    { invalidate } = useThree();
  useEffect(() => {
    if (!drawer.current) return;
    const t = gsap.to(drawer.current.position, {
      z: turning ? 0.18 : 0.75,
      duration: still ? 0 : 1.4,
      ease: "power2.inOut",
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [turning, still, invalidate]);
  return (
    <group position={[0, 0.03, 0]}>
      <Beveled at={[0, 0.14, 0]} size={[2.6, 0.12, 1.5]} map={wood} />
      <Beveled at={[0, 1.05, 0]} size={[2.8, 0.14, 1.7]} map={wood} />
      <Beveled at={[0, 0.6, -0.72]} size={[2.5, 0.85, 0.12]} map={wood} />
      {[-1.24, 1.24].map((x) => (
        <Beveled key={x} at={[x, 0.6, 0]} size={[0.13, 0.85, 1.5]} map={wood} />
      ))}
      <group ref={drawer}>
        <Beveled at={[0, 0.25, 0]} size={[2.35, 0.08, 1.35]} map={wood} />
        {[-1.13, 1.13].map((x) => (
          <Beveled
            key={x}
            at={[x, 0.44, 0]}
            size={[0.07, 0.32, 1.3]}
            map={wood}
          />
        ))}
        <Beveled at={[0, 0.55, 0.69]} size={[2.55, 0.62, 0.12]} map={wood} />
        <Beveled
          at={[0, 0.55, 0.76]}
          size={[2.13, 0.39, 0.025]}
          map={wood}
          color="#8e6342"
        />
        <mesh position={[0, 0.56, 0.79]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.105, 0.019, 12, 48]} />
          <meshStandardMaterial
            color="#c09c60"
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
        {[-0.65, 0.35].map((x, i) => (
          <group
            key={x}
            position={[x, 0.3, 0.15 + i * 0.1]}
            rotation={[0, i * 0.17, 0]}
          >
            <Correspondence open={false} still={still} onAction={() => {}} />
          </group>
        ))}
      </group>
      {[-1.21, 1.21].map((x) => (
        <Box
          key={x}
          at={[x, 0.58, 0.78]}
          size={[0.025, 0.79, 0.025]}
          color="#b39565"
        />
      ))}
    </group>
  );
}
function WindowDelivery({ turning, still, onAction }: Props) {
  return (
    <group>
      <group position={[0, 2, -0.7]}>
        <Box at={[0, 0, 0]} size={[3.1, 3.8, 0.15]} color="#94754b" />
        <Box at={[0, 0, 0.1]} size={[2.8, 3.5, 0.07]} color="#283e5b" />
        {[-0.7, 0, 0.7].map((x) => (
          <Box
            key={x}
            at={[x, 0, 0.16]}
            size={[0.035, 3.5, 0.05]}
            color="#b3a07e"
          />
        ))}
        {[-0.8, 0.4].map((y) => (
          <Box
            key={y}
            at={[0, y, 0.16]}
            size={[2.8, 0.04, 0.05]}
            color="#b3a07e"
          />
        ))}
        <mesh position={[0.75, 1.1, 0.15]}>
          <circleGeometry args={[0.24, 48]} />
          <meshBasicMaterial color="#eee8c8" />
        </mesh>
        <Box at={[0, -1.9, 0.3]} size={[3.5, 0.12, 0.8]} color="#ad9776" />
        {[-1.9, 1.9].map((x) => (
          <mesh key={x} position={[x, 0, 0.3]}>
            <cylinderGeometry args={[0.25, 0.4, 4, 32]} />
            <meshStandardMaterial color="#4c455d" roughness={0.96} />
          </mesh>
        ))}
      </group>
      <group position={[0, 0.16, 0.7]} scale={1.2}>
        <Correspondence open={!turning} still={still} onAction={onAction} />
      </group>
    </group>
  );
}
function MirrorGlass({ turning }: { turning?: boolean }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.94, -1.48);
    s.lineTo(0.94, -1.48);
    s.lineTo(0.94, 0.78);
    s.bezierCurveTo(0.94, 1.3, 0.53, 1.61, 0, 1.61);
    s.bezierCurveTo(-0.53, 1.61, -0.94, 1.3, -0.94, 0.78);
    s.closePath();
    return s;
  }, []);
  return (
    <mesh position={[0, 1.87, 0.115]}>
      <shapeGeometry args={[shape, 32]} />
      <meshBasicMaterial
        color="#ecdfc9"
        transparent
        opacity={turning ? 0.14 : 0.008}
        depthWrite={false}
      />
    </mesh>
  );
}
function Protagonist({ chapter, ...props }: Props & { chapter: ChapterId }) {
  const { turning, still, onAction } = props;
  if (chapter === "I")
    return (
      <>
        <group
          position={[0.85, 0.05, -0.85]}
          rotation={[0, 0.3, 0]}
          scale={0.85}
        >
          <Correspondence open={!turning} still={still} onAction={onAction} />
        </group>
        <Document {...props} />
      </>
    );
  if (chapter === "II")
    return (
      <group scale={1.25} rotation={[0, -0.18, 0]}>
        <EnchantedBook {...props} registration album />
      </group>
    );
  if (chapter === "III") return <Memory turning={turning} still={still} />;
  if (chapter === "IV") return <WindowDelivery {...props} />;
  if (chapter === "V")
    return (
      <group>
        <LibraryModel
          id="ornate_mirror_01"
          at={[0, 0.08, 0]}
          size={[2.65, 3.9, 0.2]}
          fallback={
            <group scale={1.3}>
              <Mirror active={false} />
            </group>
          }
        />
        <MirrorGlass turning={turning} />
      </group>
    );
  if (chapter === "VI")
    return (
      <>
        <group scale={1.3}>
          <CelestialChart turning={turning} still={still} />
        </group>
        <group position={[0.9, 0, -0.1]}>
          <GlassHourglass turning={turning} still={still} />
        </group>
        <group position={[-0.6, 1.4, -1.3]} rotation={[0.45, 0, 0.3]}>
          <mesh>
            <torusGeometry args={[1, 0.018, 8, 96]} />
            <meshStandardMaterial
              color="#b99a60"
              roughness={0.35}
              metalness={0.7}
            />
          </mesh>
          <mesh rotation={[0, 0.6, 0]}>
            <torusGeometry args={[0.95, 0.014, 8, 96]} />
            <meshStandardMaterial
              color="#b99a60"
              roughness={0.35}
              metalness={0.7}
            />
          </mesh>
        </group>
      </>
    );
  return (
    <group scale={1.25}>
      <ArchiveCabinet turning={turning} still={still} />
      {[0, 1, 2].map((i) => (
        <Photograph
          key={i}
          at={[-1.1 + i * 0.8, 0.17, 1.1 - i * 0.2]}
          rotation={i * 0.15 - 0.2}
          scale={0.7}
        />
      ))}
      <group position={[1.4, 0, 0.5]} scale={0.65}>
        <Correspondence open={false} still={still} onAction={onAction} />
      </group>
    </group>
  );
}
function Bay({ chapter, props }: { chapter: ChapterId; props: Props }) {
  const d = chapterDirection[chapter],
    wall = useSurface("wall"),
    wood = useSurface("wood");
  return (
    <group
      position={[chapterOrder.indexOf(chapter) * 18, 0, 0]}
      name={`chapter-${chapter}`}
    >
      <mesh position={[0, 1, -2.3]} receiveShadow>
        <planeGeometry args={[13, 10]} />
        <meshStandardMaterial map={wall} color={d.wall} roughness={0.95} />
      </mesh>
      {[-4, -2, 0, 2, 4].map((x) => (
        <Box
          key={x}
          at={[x, 1, -2.25]}
          size={[0.04, 8, 0.04]}
          color="#ac9471"
        />
      ))}
      <Box at={[0, -0.75, -2.16]} size={[13, 0.1, 0.15]} color="#aa8962" />
      <mesh
        position={[0, -1.1, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[13, 10]} />
        <meshStandardMaterial map={wood} color="#74523e" roughness={0.86} />
      </mesh>
      {chapter !== "V" && (
        <LibraryModel
          id="ClassicConsole_01"
          at={[0, -1.8, 0]}
          size={[6.5, 1.8, 3.8]}
          fallback={
            <Box at={[0, -0.18, 0]} size={[6.5, 0.3, 3.8]} color="#6e4932" />
          }
        />
      )}
      {chapter === "V" && (
        <>
          <Box at={[0, -0.12, 0]} size={[3.2, 0.24, 1]} color="#583d38" />
          {[-1.1, 1.1].map((x) => (
            <Box
              key={x}
              at={[x, -0.65, 0]}
              size={[0.08, 1.1, 0.5]}
              color="#987856"
            />
          ))}
        </>
      )}
      <Protagonist {...props} chapter={chapter} />
      {chapter === "II" && (
        <>
          <Photograph at={[-2, 0.06, 0.6]} rotation={-0.4} />
          <Photograph at={[2, 0.06, -0.4]} rotation={0.3} scale={0.75} />
        </>
      )}
    </group>
  );
}
export function ChapterWorld(props: Props) {
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
      still ? 0 : 2300,
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
            turning: c === chapter && props.turning,
            turnSerial: c === chapter ? props.turnSerial : 0,
            active: c === chapter && props.active,
            writtenText: c === chapter ? props.writtenText : undefined,
            still: props.still || c !== chapter,
          }}
        />
      ))}
      <CameraDirector
        chapter={chapter}
        still={props.still}
        turning={props.turning}
        onJourney={props.onJourney}
      />
    </>
  );
}
