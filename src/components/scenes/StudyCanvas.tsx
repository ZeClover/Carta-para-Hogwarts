"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import * as THREE from "three";
import type { SceneKind } from "./config";
import { LibraryModel } from "./LibraryModel";

type Props = {
  immersive?: boolean;
  writtenText?: string;
  kind: SceneKind;
  active: boolean;
  still: boolean;
  onAction: () => void;
  onFailure: () => void;
  onReady: () => void;
};
const brass = "#ad854a",
  wood = "#4d2d21",
  paper = "#e6d4a6";
function Box({
  at,
  size,
  color = wood,
  rotation = [0, 0, 0],
}: {
  at: [number, number, number];
  size: [number, number, number];
  color?: string;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}
function Cylinder({
  at,
  radius,
  height,
  color = brass,
}: {
  at: [number, number, number];
  radius: number;
  height: number;
  color?: string;
}) {
  return (
    <mesh position={at} castShadow>
      <cylinderGeometry args={[radius, radius, height, 24]} />
      <meshStandardMaterial
        color={color}
        metalness={color === brass ? 0.65 : 0}
        roughness={0.38}
      />
    </mesh>
  );
}
function Candle({ at }: { at: [number, number, number] }) {
  const profile = useMemo(
    () => [
      new THREE.Vector2(0.22, 0),
      new THREE.Vector2(0.25, 0.06),
      new THREE.Vector2(0.1, 0.13),
      new THREE.Vector2(0.05, 0.3),
      new THREE.Vector2(0.06, 0.54),
      new THREE.Vector2(0.17, 0.6),
      new THREE.Vector2(0.14, 0.64),
    ],
    [],
  );
  return (
    <group position={at}>
      <mesh castShadow>
        <latheGeometry args={[profile, 24]} />
        <meshStandardMaterial color={brass} metalness={0.7} roughness={0.3} />
      </mesh>
      <Cylinder at={[0, 0.87, 0]} radius={0.09} height={0.46} color="#e1d4b3" />
      <mesh position={[0, 1.17, 0]} scale={[0.055, 0.14, 0.055]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffce81" />
      </mesh>
      <pointLight
        position={[0, 1.22, 0]}
        intensity={3}
        distance={6}
        color="#ffc984"
      />
    </group>
  );
}
function Books({ at }: { at: [number, number, number] }) {
  return (
    <group position={at}>
      {["#603036", "#264c45", "#533d2d"].map((color, i) => (
        <group
          key={color}
          position={[i * 0.08, i * 0.24, 0]}
          rotation={[0, i * 0.09, 0]}
        >
          <Box at={[0, 0.03, 0]} size={[1.28, 0.06, 0.9]} color={color} />
          <Box at={[0, 0.12, 0]} size={[1.19, 0.15, 0.82]} color={paper} />
          <Box at={[0, 0.22, 0]} size={[1.28, 0.06, 0.9]} color={color} />
          <Box at={[-0.61, 0.12, 0]} size={[0.07, 0.2, 0.91]} color={color} />
          {[-0.28, 0.28].map((z) => (
            <Box
              key={z}
              at={[-0.653, 0.12, z]}
              size={[0.01, 0.2, 0.025]}
              color={brass}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
function Frame({
  at,
  scale = 1,
  magic = false,
}: {
  at: [number, number, number];
  scale?: number;
  magic?: boolean;
}) {
  return (
    <group position={at} scale={scale} rotation={[-0.07, 0, 0]}>
      <Box at={[0, 0, 0]} size={[1.3, 1.7, 0.12]} color={brass} />
      <Box at={[0, 0, 0.07]} size={[1.09, 1.48, 0.04]} color="#213c3d" />
      {[-0.6, 0.6].map((x) => (
        <Box
          key={x}
          at={[x, 0, 0.08]}
          size={[0.04, 1.63, 0.04]}
          color="#e3c889"
        />
      ))}
      <mesh position={[0, 0.28, 0.11]} scale={[0.23, 0.27, 0.02]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#738275"
          emissive={magic ? "#60b3a7" : "#000"}
          emissiveIntensity={magic ? 0.6 : 0}
        />
      </mesh>
      <mesh position={[0, -0.33, 0.1]} scale={[0.35, 0.44, 0.03]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#3e5b55"
          emissive={magic ? "#3d968b" : "#000"}
          emissiveIntensity={magic ? 0.5 : 0}
        />
      </mesh>
      <Box at={[0, -0.88, 0]} size={[1.46, 0.08, 0.32]} color={brass} />
      {magic && (
        <pointLight
          position={[0, 0, 0.6]}
          intensity={7}
          color="#9dfff1"
          distance={5}
        />
      )}
    </group>
  );
}
function Room() {
  return (
    <group>
      <Box at={[0, -1.8, 0]} size={[14, 0.15, 14]} color="#221b19" />
      <Box at={[0, 2, -4.2]} size={[14, 8, 0.2]} color="#173333" />
      <Box at={[-5.5, 2, 0]} size={[0.2, 8, 9]} color="#1c3330" />
      {Array.from({ length: 12 }, (_, i) => (
        <Box
          key={i}
          at={[-6 + i * 1.1, 1.4, -4.06]}
          size={[0.035, 6, 0.02]}
          color="#51604b"
        />
      ))}
      <LibraryModel
        id="ClassicConsole_01"
        at={[0, -1.8, 0]}
        size={[7.8, 1.8, 4.2]}
        fallback={
          <group>
            <Box at={[0, -0.12, 0]} size={[7.8, 0.24, 4.2]} />
            <Box at={[0, -0.3, 0]} size={[7.85, 0.1, 4.26]} color={brass} />
            <Box at={[0, -0.55, 0]} size={[7.6, 0.4, 3.9]} />
            {[-3.4, 3.4].flatMap((x) =>
              [-1.55, 1.55].map((z) => (
                <group key={`${x}${z}`}>
                  <Cylinder
                    at={[x, -1.15, z]}
                    radius={0.12}
                    height={1.3}
                    color={wood}
                  />
                  <Cylinder at={[x, -0.7, z]} radius={0.2} height={0.13} />
                </group>
              )),
            )}
          </group>
        }
      />
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          at={[-3.3 + i * 0.92, 0.008, 0]}
          size={[0.012, 0.01, 4]}
          color="#6a4730"
        />
      ))}
      <group position={[2, 2.3, -4.04]}>
        <Box at={[0, 0, 0]} size={[2.7, 3.4, 0.08]} color={brass} />
        <Box at={[0, 0, 0.06]} size={[2.48, 3.18, 0.04]} color="#11263c" />
        <Box at={[0, 0, 0.1]} size={[0.065, 3.2, 0.05]} color={brass} />
        <Box at={[0, 0, 0.1]} size={[2.5, 0.07, 0.05]} color={brass} />
        <mesh position={[0.7, 0.86, 0.13]}>
          <circleGeometry args={[0.26, 32]} />
          <meshBasicMaterial color="#dcdab2" />
        </mesh>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh
            key={i}
            position={[-1 + ((i * 0.43) % 2), -1.4 + ((i * 0.37) % 2.7), 0.13]}
          >
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshBasicMaterial color="#d6dac2" />
          </mesh>
        ))}
        <Box at={[-1.7, 0, 0.15]} size={[0.54, 3.9, 0.2]} color="#552c33" />
        <Box at={[1.7, 0, 0.15]} size={[0.54, 3.9, 0.2]} color="#552c33" />
      </group>
      <LibraryModel
        id="fancy_picture_frame_01"
        at={[-2.8, 1.3, -3.9]}
        size={[1.8, 1.4, 0.08]}
        fallback={<Frame at={[-2.8, 2.2, -3.92]} scale={1.1} />}
      />
      <LibraryModel
        id="ArmChair_01"
        at={[-3.4, -1.8, -2.8]}
        size={[1.7, 2.2, 1.7]}
        fallback={
          <group position={[-3.4, -0.5, -2.6]}>
            <Box at={[0, 0.7, 0]} size={[1.2, 1.6, 0.2]} color="#613738" />
            <Box at={[0, 0, 0.4]} size={[1.3, 0.25, 1]} color="#613738" />
            {[-0.7, 0.7].map((x) => (
              <Box
                key={x}
                at={[x, 0.25, 0.4]}
                size={[0.12, 0.6, 1]}
                color={brass}
              />
            ))}
          </group>
        }
      />
      <Books at={[-2.3, 0.04, -0.4]} />
      <Books at={[2.8, 0.04, -1.1]} />
      <Candle at={[-2.4, 0.05, -1.2]} />
      <Candle at={[2.5, 0.05, 0.5]} />
      <Cylinder
        at={[2.2, 0.15, 1.25]}
        radius={0.19}
        height={0.28}
        color="#162123"
      />
      <mesh
        position={[2.2, 0.76, 1.25]}
        rotation={[0, 0, -0.55]}
        scale={[0.12, 0.7, 0.025]}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#d5c9ac" />
      </mesh>
    </group>
  );
}
function Envelope({
  open,
  still,
  onAction,
  arriving = false,
}: {
  open: boolean;
  still: boolean;
  onAction: () => void;
  arriving?: boolean;
}) {
  const flap = useRef<THREE.Group>(null),
    sheet = useRef<THREE.Group>(null),
    body = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const triangle = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.1, 0);
    shape.lineTo(1.1, 0);
    shape.lineTo(0, -0.74);
    shape.closePath();
    return shape;
  }, []);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (flap.current)
        gsap.to(flap.current.rotation, {
          x: open ? -Math.PI * 0.94 : 0,
          duration: still ? 0 : 0.9,
          onUpdate: invalidate,
        });
      if (sheet.current)
        gsap.to(sheet.current.position, {
          y: open ? 0.62 : 0,
          z: open ? 0.025 : 0,
          duration: still ? 0 : 1.3,
          onUpdate: invalidate,
        });
      if (body.current && arriving)
        gsap.fromTo(
          body.current.position,
          { y: open ? 0 : 2, z: open ? 0 : -2 },
          { y: 0, z: 0, duration: still ? 0 : 1.5, onUpdate: invalidate },
        );
    });
    return () => ctx.revert();
  }, [open, still, arriving, invalidate]);
  return (
    <group
      position={[0, 0.1, 0.5]}
      rotation={[-Math.PI / 2, 0, -0.08]}
      onClick={(e) => {
        e.stopPropagation();
        onAction();
      }}
    >
      <group ref={body}>
        <Box at={[0, 0, 0]} size={[2.2, 1.45, 0.025]} color="#cbb98e" />
        <group ref={sheet}>
          <Box at={[0, 0, 0.018]} size={[1.94, 1.3, 0.015]} color={paper} />
          {Array.from({ length: 5 }, (_, i) => (
            <Box
              key={i}
              at={[0, 0.3 - i * 0.14, 0.03]}
              size={[1.2 - i * 0.05, 0.014, 0.003]}
              color="#8c785c"
            />
          ))}
        </group>
        <Box at={[0, -0.32, 0.05]} size={[2.2, 0.8, 0.025]} color="#dac79b" />
        <group position={[0, 0.72, 0.07]} ref={flap}>
          <mesh>
            <shapeGeometry args={[triangle]} />
            <meshStandardMaterial
              color={paper}
              side={THREE.DoubleSide}
              roughness={0.8}
            />
          </mesh>
          <group position={[0, -0.61, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
            <Cylinder
              at={[0, 0, 0]}
              radius={0.18}
              height={0.055}
              color="#87313b"
            />
            <Cylinder
              at={[0, 0.03, 0]}
              radius={0.13}
              height={0.006}
              color="#b25b59"
            />
          </group>
        </group>
      </group>
    </group>
  );
}
function Album({
  active,
  still,
  onAction,
  final = false,
  registration = false,
  writtenText,
  label,
}: {
  active: boolean;
  still: boolean;
  onAction: () => void;
  final?: boolean;
  registration?: boolean;
  writtenText?: string;
  label?: string;
}) {
  const page = useRef<THREE.Group>(null);
  const previousPage = useRef(active);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!page.current) return;
    if (registration) {
      const changed = previousPage.current !== active;
      previousPage.current = active;
      page.current.rotation.z = 0.015;
      if (!changed || still) {
        invalidate();
        return;
      }
      const sheet = page.current;
      const turn = gsap.fromTo(
        sheet.rotation,
        { z: 0.015 },
        {
          z: Math.PI,
          duration: 1.2,
          ease: "power2.inOut",
          onUpdate: invalidate,
          onComplete: () => {
            sheet.rotation.z = 0.015;
            invalidate();
          },
        },
      );
      return () => {
        turn.kill();
      };
    }
    const tween = gsap.to(page.current.rotation, {
      z: active ? (final ? -Math.PI : Math.PI * 0.87) : 0.015,
      duration: still ? 0 : 1.2,
      onUpdate: invalidate,
    });
    return () => {
      tween.kill();
    };
  }, [active, still, final, registration, invalidate]);
  const texture = useMemo(() => {
    if (!final && !writtenText) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const c = canvas.getContext("2d");
    if (!c) return null;
    c.fillStyle = "#e6d4a6";
    c.fillRect(0, 0, 512, 256);
    c.fillStyle = "#4d3427";
    c.font = "30px Georgia";
    c.textAlign = "center";
    c.fillText(final ? "Seu livro pessoal" : "Registro de memórias", 256, 55);
    c.font = "24px Georgia";
    const text = (writtenText || label || "Uma história por escrever").slice(
      0,
      180,
    );
    const words = text.split(" ");
    let line = "",
      y = 130;
    for (const word of words) {
      if (c.measureText(line + word).width > 440) {
        c.fillText(line, 256, y);
        line = "";
        y += 32;
      }
      line += word + " ";
    }
    c.fillText(line, 256, y);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [final, label, writtenText]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <group
      position={[0, 0.13, 0.4]}
      rotation={[0, -0.14, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onAction();
      }}
    >
      <Box at={[0, -0.04, 0]} size={[3.2, 0.11, 2.05]} color="#63333b" />
      <Box at={[0, 0.045, 0]} size={[3.05, 0.1, 1.88]} color={paper} />
      <Box at={[0, 0.1, 0]} size={[0.08, 0.03, 1.91]} color={brass} />
      {!final &&
        !registration &&
        [-0.8, 0.8].map((x) => (
          <group key={x}>
            <Box at={[x, 0.115, 0]} size={[0.84, 0.01, 0.98]} color={brass} />
            <Box at={[x, 0.126, 0]} size={[0.72, 0.01, 0.85]} color="#48605a" />
            {[-0.68, 0.67].map((z) => (
              <Box
                key={z}
                at={[x, 0.115, z]}
                size={[1.05, 0.01, 0.016]}
                color="#a8956e"
              />
            ))}
          </group>
        ))}
      {registration &&
        [-0.75, 0.75].map((x) => (
          <group key={x}>
            {Array.from({ length: 8 }, (_, i) => (
              <Box
                key={i}
                at={[x, 0.12, -0.6 + i * 0.15]}
                size={[1.1, 0.007, 0.014]}
                color="#a08d63"
              />
            ))}
          </group>
        ))}
      {texture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.75, 0.12, 0]}>
          <planeGeometry args={[1.4, 1.5]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      )}
      <group ref={page} position={[0, 0.14, 0]}>
        <Box
          at={[0.75, 0, 0]}
          size={[1.49, 0.012, 1.84]}
          color={final ? "#63333b" : paper}
        />
        {!final && (
          <>
            <Box
              at={[0.76, 0.009, 0]}
              size={[0.73, 0.009, 0.95]}
              color="#476365"
            />
            <Box
              at={[0.76, 0.015, -0.65]}
              size={[1.1, 0.007, 0.013]}
              color="#a08d63"
            />
          </>
        )}
        {final && (
          <group position={[0.75, 0.01, 0]}>
            <Cylinder
              at={[0, 0, 0]}
              radius={0.17}
              height={0.035}
              color="#8a333f"
            />
          </group>
        )}
      </group>
    </group>
  );
}
function Mirror({ active }: { active: boolean }) {
  const curve = useMemo(
    () =>
      new THREE.EllipseCurve(0, 0, 1, 1.45, 0, Math.PI * 2, false, 0)
        .getPoints(80)
        .map((v) => new THREE.Vector3(v.x, v.y, 0)),
    [],
  );
  const path = useMemo(() => new THREE.CatmullRomCurve3(curve, true), [curve]);
  return (
    <group position={[0, 1.72, -0.4]}>
      <mesh castShadow>
        <tubeGeometry args={[path, 80, 0.1, 8, true]} />
        <meshStandardMaterial color={brass} metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh scale={[0.95, 1.4, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshStandardMaterial
          color={active ? "#8eada4" : "#547a77"}
          metalness={0.92}
          roughness={0.15}
          emissive="#294b4f"
          emissiveIntensity={active ? 0.8 : 0.15}
        />
      </mesh>
      <mesh position={[0.05, 0.08, 0.02]} rotation={[0, 0, -0.4]}>
        <planeGeometry args={[0.06, 2.2]} />
        <meshBasicMaterial color="#cad4b8" transparent opacity={0.3} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <Box key={x} at={[x, -1.55, 0]} size={[0.1, 0.4, 0.22]} color={brass} />
      ))}
      <Box at={[0, -1.72, 0]} size={[1.55, 0.12, 0.5]} color={brass} />
      {active && (
        <pointLight
          position={[0, 0, 1]}
          intensity={6}
          color="#b3ede2"
          distance={6}
        />
      )}
    </group>
  );
}
function Hourglass({ active, still }: { active: boolean; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!group.current) return;
    const t = gsap.to(group.current.rotation, {
      z: active ? Math.PI : 0,
      duration: still ? 0 : 1.2,
      onUpdate: invalidate,
    });
    return () => {
      t.kill();
    };
  }, [active, still, invalidate]);
  return (
    <group position={[0, 1, 0.3]}>
      <group ref={group}>
        {[-0.75, 0.75].map((y) => (
          <Cylinder key={y} at={[0, y, 0]} radius={0.48} height={0.07} />
        ))}
        {[-0.37, 0.37].flatMap((x) =>
          [-0.25, 0.25].map((z) => (
            <Cylinder
              key={`${x}${z}`}
              at={[x, 0, z]}
              radius={0.035}
              height={1.5}
            />
          )),
        )}
        {[-1, 1].map((sign) => (
          <group key={sign} rotation={[0, 0, sign === 1 ? 0 : Math.PI]}>
            <mesh position={[0, 0.34, 0]}>
              <coneGeometry args={[0.3, 0.68, 24, 1, true]} />
              <meshStandardMaterial
                color="#bed8d1"
                transparent
                opacity={0.25}
                side={THREE.DoubleSide}
                roughness={0.1}
              />
            </mesh>
            <mesh position={[0, 0.39, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.26, 0.52, 24]} />
              <meshStandardMaterial color="#d2b17c" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
function StarMap() {
  const points = useMemo(
    () =>
      Array.from(
        { length: 32 },
        (_, i) =>
          new THREE.Vector3(
            -1.4 + ((i * 0.57) % 2.8),
            0.19,
            -0.7 + ((i * 0.43) % 1.65),
          ),
      ),
    [],
  );
  return (
    <group position={[0, 0, 0.25]}>
      <Box at={[0, 0.13, 0]} size={[3.3, 0.03, 2.2]} color="#1e3b51" />
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[i % 5 === 0 ? 0.033 : 0.018, 8, 8]} />
          <meshBasicMaterial color="#e1c894" />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.17, 0]}>
          <ringGeometry args={[0.35 + i * 0.32, 0.36 + i * 0.32, 48]} />
          <meshBasicMaterial color={brass} transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}
function Drawer({ active, still }: { active: boolean; still: boolean }) {
  const drawer = useRef<THREE.Group>(null),
    photos = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (drawer.current)
        gsap.to(drawer.current.position, {
          z: active ? 1.1 : 0.12,
          duration: still ? 0 : 1,
          onUpdate: invalidate,
        });
      if (photos.current)
        gsap.to(photos.current.rotation, {
          y: active ? 0.3 : -0.1,
          duration: still ? 0 : 1,
          onUpdate: invalidate,
        });
    });
    return () => ctx.revert();
  }, [active, still, invalidate]);
  return (
    <group position={[0, 0.09, 0.1]}>
      <Box at={[0, 0.5, -0.6]} size={[2.6, 0.9, 0.12]} />
      <Box at={[0, 0.99, -0.05]} size={[2.8, 0.12, 1.4]} />
      {[-1.25, 1.25].map((x) => (
        <Box key={x} at={[x, 0.5, 0]} size={[0.12, 1, 1.35]} />
      ))}
      <group ref={drawer} position={[0, 0, 0.12]}>
        <Box at={[0, 0.14, 0]} size={[2.4, 0.08, 1.25]} />
        <Box at={[0, 0.49, 0.6]} size={[2.55, 0.7, 0.12]} />
        <mesh position={[0, 0.5, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.025, 8, 24]} />
          <meshStandardMaterial color={brass} metalness={0.6} roughness={0.3} />
        </mesh>
        <Box at={[0.3, 0.2, 0]} size={[1.1, 0.03, 0.6]} color={paper} />
      </group>
      <group ref={photos} position={[-1.4, 0.08, 1.4]} rotation={[0, -0.1, 0]}>
        {[0, 1, 2].map((i) => (
          <group
            key={i}
            position={[i * 0.4, i * 0.018, 0]}
            rotation={[0, i * 0.25, 0]}
          >
            <Box at={[0, 0, 0]} size={[0.6, 0.012, 0.8]} color={paper} />
            <Box
              at={[0, 0.01, -0.03]}
              size={[0.48, 0.008, 0.56]}
              color="#506660"
            />
          </group>
        ))}
      </group>
    </group>
  );
}
function CameraAndLife({
  kind,
  active,
  still,
  onFailure,
  onReady,
  immersive,
}: Props) {
  const { camera, gl, invalidate, get, size } = useThree();
  const previousKind = useRef<SceneKind | null>(null);
  useEffect(() => {
    const canvas = gl.domElement;
    const lose = (e: Event) => {
      e.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lose);
    onReady();
    return () => canvas.removeEventListener("webglcontextlost", lose);
  }, [gl, onFailure, onReady]);
  useEffect(() => {
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
      end[0] = portrait ? 0.8 : 2.4;
      end[1] = portrait ? 4.8 : 4.3;
      end[2] = (portrait ? 8.8 : 6.7) + (active ? 0.22 : 0);
    }
    const entering = previousKind.current !== kind;
    previousKind.current = kind;
    if (still) camera.position.set(...end);
    else if (entering) camera.position.set(...start);
    const target = new THREE.Vector3(
      kind === "II" && entering && !still ? 1.8 : 0,
      immersive ? 1.5 : kind === "V" ? 1 : 0.55,
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
    windowLight.position.set(0, 0, -4);
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
function Dust() {
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from({ length: 120 }, (_, i) =>
          i % 3 === 0
            ? -3.6 + ((i * 0.47) % 7.2)
            : i % 3 === 1
              ? 0.3 + ((i * 0.19) % 3.4)
              : -2 + ((i * 0.37) % 4),
        ),
      ),
    [],
  );
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#d9bf92"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}
function Study(props: Props & { label?: string }) {
  const { kind, active, still, onAction } = props;
  return (
    <>
      <color attach="background" args={["#10272b"]} />
      <fog attach="fog" args={["#10272b", 11, 24]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[2, 7, 4]}
        intensity={2.4}
        color="#e9c78d"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight
        position={[2, 2.5, -3]}
        intensity={7}
        color="#a3cdd6"
        distance={10}
      />
      <Room />
      <Dust />
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
          <Album
            active={active}
            still={still}
            onAction={onAction}
            final={kind === "final"}
            label={props.label}
            registration={props.immersive}
            writtenText={props.writtenText}
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
      dpr={[1, 1.5]}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [4, 5, 6], fov: 43, near: 0.1, far: 35 }}
      gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
      fallback={null}
    >
      <MemoStudy {...props} />
    </Canvas>
  );
}
