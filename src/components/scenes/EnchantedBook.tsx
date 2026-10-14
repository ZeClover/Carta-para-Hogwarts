"use client";
import { ChapterModel } from "./ChapterModel";
import { useEffect, useMemo, useRef } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import * as THREE from "three";
import { createPageGeometry, deformPage } from "./pageGeometry";

type Props = {
  active: boolean;
  still: boolean;
  onAction: () => void;
  final?: boolean;
  registration?: boolean;
  album?: boolean;
  rebuilt?: boolean;
  singlePage?: boolean;
  onReady?: () => void;
  writtenText?: string;
  label?: string;
  turnSerial?: number;
  turnDirection?: number;
  turning?: boolean;
};
function texture(
  kind: "leather" | "paper",
  text = "",
  album = false,
  photo?: HTMLImageElement,
) {
  const canvas = document.createElement("canvas");
  canvas.width = kind === "leather" ? 256 : 512;
  canvas.height = kind === "leather" ? 256 : 512;
  const c = canvas.getContext("2d")!;
  const size = canvas.width;
  c.fillStyle = kind === "leather" ? "#49302b" : "#ead9b0";
  c.fillRect(0, 0, size, size);
  let seed = 73;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 15000; i++) {
    c.fillStyle =
      kind === "leather"
        ? `rgba(${random() > 0.5 ? "210,167,108" : "12,5,3"},${random() * 0.12})`
        : `rgba(119,80,38,${random() * 0.07})`;
    c.fillRect(random() * size, random() * size, 1 + random() * 2, 1);
  }
  if (kind === "leather") {
    c.strokeStyle = "#a78048";
    c.lineWidth = 2;
    c.strokeRect(14, 14, 228, 228);
    c.strokeRect(19, 19, 218, 218);
    for (const x of [28, 228])
      for (const y of [28, 228]) {
        c.beginPath();
        c.arc(x, y, 9, 0, Math.PI * 2);
        c.stroke();
      }
    c.textAlign = "center";
    c.fillStyle = "#c09b60";
    c.font = "italic 24px Georgia";
    c.fillText("H", 128, 134);
  } else {
    const stain = c.createRadialGradient(256, 256, 160, 256, 256, 360);
    stain.addColorStop(0, "rgba(136,91,40,0)");
    stain.addColorStop(1, "rgba(136,91,40,.25)");
    c.fillStyle = stain;
    c.fillRect(0, 0, 512, 512);
    c.strokeStyle = "rgba(116,86,48,.18)";
    c.lineWidth = 1;
    for (let y = 146; y < 460; y += 26) {
      c.beginPath();
      c.moveTo(46, y);
      c.lineTo(468, y);
      c.stroke();
    }
    c.strokeStyle = "#ab8b59";
    c.strokeRect(30, 30, 452, 452);
    if (album && !text) {
      c.fillStyle = "#77664b";
      c.fillRect(95, 106, 322, 294);
      if (photo) {
        c.filter = "sepia(.35)";
        c.drawImage(photo, 106, 118, 300, 270);
        c.filter = "none";
      }
      c.strokeStyle = "#d4bd8b";
      c.lineWidth = 3;
      for (const x of [106, 406])
        for (const y of [118, 388]) {
          c.beginPath();
          c.moveTo(x + (x === 106 ? 18 : -18), y);
          c.lineTo(x, y);
          c.lineTo(x, y + (y === 118 ? 18 : -18));
          c.stroke();
        }
    }
    c.fillStyle = "#543b27";
    c.font = "24px Georgia";
    c.textAlign = "center";
    c.fillText(album ? "Memórias" : "Registro de Hogwarts", 256, 88);
    c.font = "22px Georgia";
    c.textAlign = "left";
    let line = "",
      y = 160;
    for (const word of text.slice(0, 220).split(/\s+/)) {
      if (c.measureText(line + word).width > 406) {
        c.fillText(line, 52, y);
        line = "";
        y += 30;
      }
      line += word + " ";
      if (y > 440) break;
    }
    c.fillText(line, 52, y);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  return t;
}
export function EnchantedBook({
  active,
  still,
  onAction,
  final = false,
  registration = false,
  album = false,
  rebuilt = false,
  singlePage = false,
  onReady,
  writtenText,
  label,
  turnSerial = 0,
  turnDirection = 1,
  turning = true,
}: Props) {
  const { invalidate, gl } = useThree();
  const photograph = useLoader(
    THREE.TextureLoader,
    "/assets/memory-forest.jpg",
  );
  const sheet = useMemo(() => createPageGeometry(), []);
  const resting = useMemo(
    () => [createPageGeometry(-1), createPageGeometry(1)],
    [],
  );
  const leather = useMemo(() => texture("leather"), []),
    blank = useMemo(
      () => texture("paper", "", album && !final, photograph.image),
      [album, final, photograph],
    );
  const ink = useMemo(
    () =>
      texture(
        "paper",
        writtenText || (final ? label || "" : ""),
        album && !final,
        photograph.image,
      ),
    [writtenText, label, final, album, photograph],
  );
  const sheetMesh = useRef<THREE.Mesh>(null);
  const previous = useRef({ active, turnSerial });
  const cover = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      sheet.dispose();
      resting.forEach((g) => g.dispose());
      leather.dispose();
    },
    [sheet, resting, leather],
  );
  useEffect(() => () => blank.dispose(), [blank]);
  useEffect(() => () => ink.dispose(), [ink]);
  useEffect(() => {
    const changed = registration
      ? previous.current.turnSerial !== turnSerial
      : previous.current.active !== active;
    const side = registration ? turnDirection : active ? 1 : -1;
    previous.current = { active, turnSerial };
    const mark = (p: number) => {
      deformPage(sheet, p, side);
      gl.domElement.setAttribute("data-page-progress", p.toFixed(3));
      gl.domElement.setAttribute("data-page-direction", String(side));
      gl.domElement.setAttribute(
        "data-page-curl",
        (Math.sin(Math.PI * p) * 0.85).toFixed(3),
      );
      invalidate();
    };
    if (sheetMesh.current) sheetMesh.current.visible = false;
    if (final) {
      mark(0);
      const t = cover.current
        ? gsap.to(cover.current.rotation, {
            z: active ? -Math.PI : 0,
            duration: still ? 0 : 1.3,
            ease: "power2.inOut",
            onUpdate: invalidate,
          })
        : null;
      return () => {
        t?.kill();
      };
    }
    if (still || !turning || !changed) {
      mark(0);
      return;
    }
    const progress = { value: 0 };
    mark(0);
    if (sheetMesh.current) sheetMesh.current.visible = true;
    const tween = gsap.to(progress, {
      value: 1,
      duration: registration ? (album ? 0.65 : 0.28) : 1.55,
      ease: "sine.inOut",
      onUpdate: () => mark(progress.value),
      onComplete: () => {
        mark(0);
        if (sheetMesh.current) sheetMesh.current.visible = false;
      },
    });
    return () => {
      tween.kill();
      mark(0);
    };
  }, [
    active,
    turnSerial,
    turnDirection,
    registration,
    album,
    final,
    still,
    turning,
    sheet,
    gl,
    invalidate,
  ]);
  const edges = useMemo(() => {
    const points: number[] = [];
    for (const side of [-1, 1])
      for (let i = 0; i < 22; i++) {
        const y = 0.079 + i * 0.0082,
          x = side * (1.54 + Math.sin(i * 2.1) * 0.005);
        points.push(x, y, -0.96, x, y, 0.96);
        for (const z of [-0.965, 0.965])
          points.push(side * 0.05, y, z, x, y, z);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return g;
  }, []);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <group
      position={[singlePage ? -0.9 : 0, 0.09, 0.48]}
      rotation={[0, -0.14, 0]}
      userData={{ cinematicBook: true }}
      onClick={(e) => {
        e.stopPropagation();
        onAction();
      }}
    >
      {rebuilt && (
        <group scale={[1.17, 1, 1.15]}>
          <ChapterModel chapter="II" singlePage={singlePage} onReady={onReady} />
        </group>
      )}
      {(singlePage ? [1] : [-1, 1]).map((side) => (
        <group key={side}>
          {!rebuilt && (
            <>
              <mesh position={[side * 0.82, 0.025, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.68, 0.1, 2.16]} />
                <meshStandardMaterial
                  map={leather}
                  bumpMap={leather}
                  bumpScale={0.035}
                  roughness={0.9}
                />
              </mesh>
            </>
          )}
          <mesh position={[side * 0.81, 0.162, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.48, 0.19, 1.92]} />
            <meshStandardMaterial color="#c9b389" roughness={1} />
          </mesh>
          <mesh
            geometry={resting[side === -1 ? 0 : 1]}
            receiveShadow
            castShadow
          >
            <meshStandardMaterial
              map={side === -1 ? ink : blank}
              side={THREE.DoubleSide}
              roughness={0.98}
            />
          </mesh>
          {[-0.9, 0.9].map((z) => (
            <mesh
              key={z}
              position={[side * 1.58, 0.079, z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.12, 0.16]} />
              <meshStandardMaterial
                color="#9c7e49"
                metalness={0.65}
                roughness={0.6}
              />
            </mesh>
          ))}
        </group>
      ))}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#99815d" transparent opacity={0.55} />
      </lineSegments>
      <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry
          args={[0.115, 0.115, 2.14, 16, 1, false, 0, Math.PI]}
        />
        <meshStandardMaterial map={leather} roughness={0.9} />
      </mesh>
      {[-0.75, -0.35, 0.35, 0.75].map((z) => (
        <mesh key={z} position={[0, 0.067, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.117, 0.014, 6, 16, Math.PI]} />
          <meshStandardMaterial
            color="#a18050"
            metalness={0.4}
            roughness={0.7}
          />
        </mesh>
      ))}
      <mesh position={[0.12, 0.32, 0.34]} rotation={[-Math.PI / 2, 0, 0.08]}>
        <planeGeometry args={[0.08, 1.5]} />
        <meshStandardMaterial
          color="#74323a"
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
      {!final && (
        <mesh
          ref={sheetMesh}
          visible={false}
          geometry={sheet}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={blank}
            roughness={1}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      )}
      {final && (
        <group ref={cover} position={[0, 0.36, 0]}>
          <mesh position={[0.82, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.68, 0.09, 2.16]} />
            <meshStandardMaterial
              map={leather}
              bumpMap={leather}
              bumpScale={0.03}
              roughness={0.9}
            />
          </mesh>
          <mesh position={[0.82, 0.06, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 24]} />
            <meshStandardMaterial color="#8a333f" roughness={0.65} />
          </mesh>
        </group>
      )}
    </group>
  );
}
