"use client";
import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";
import type { SceneKind } from "./config";
export function AtmosphericDetails({
  still,
  limited,
  kind,
}: {
  still: boolean;
  limited?: boolean;
  kind: SceneKind;
}) {
  const { scene, invalidate } = useThree();
  const dust = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        Array.from({ length: 108 }, (_, i) =>
          i % 3 === 0
            ? -1.6 + ((i * 0.19) % 4)
            : i % 3 === 1
              ? 0.7 + ((i * 0.13) % 2.4)
              : -1.8 + ((i * 0.21) % 3),
        ),
        3,
      ),
    );
    return g;
  }, []);
  const sprite = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,235,188,.8)");
    g.addColorStop(0.3, "rgba(255,235,188,.4)");
    g.addColorStop(1, "rgba(255,235,188,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      sprite.dispose();
    },
    [geometry, sprite],
  );
  useEffect(() => {
    const lights = [
      scene.getObjectByName("candle-light--2.4"),
      scene.getObjectByName("candle-light-2.5"),
    ].filter(Boolean) as THREE.PointLight[];
    const flames = [
      scene.getObjectByName("flame--2.4"),
      scene.getObjectByName("flame-2.5"),
    ].filter((node): node is THREE.Object3D => !!node);
    const restore = () => {
      lights.forEach((l) => (l.intensity = 3));
      flames.forEach((f) => {
        f.scale.set(0.055, 0.14, 0.055);
        f.rotation.z = 0;
      });
      if (dust.current) dust.current.position.y = 0;
      invalidate();
    };
    if (still || limited) return restore;
    let elapsed = 0;
    // Brief environmental breaths, eight frames/sec; no perpetual render loop during reading.
    const timer = setInterval(() => {
      if (document.hidden) return;
      elapsed += 0.125;
      const breathing = elapsed % 16;
      if (breathing > 2.5) return;
      lights.forEach(
        (light, i) =>
          (light.intensity =
            3 +
            Math.sin(breathing * 5 + i) * 0.16 +
            Math.sin(breathing * 11) * 0.04),
      );
      flames.forEach((f, i) => {
        f.scale.y = 0.14 + Math.sin(breathing * 7 + i) * 0.012;
        f.rotation.z = Math.sin(breathing * 4 + i) * 0.045;
      });
      if (dust.current) {
        dust.current.position.y = Math.sin(breathing * 0.65) * 0.055;
        dust.current.rotation.y = Math.sin(breathing * 0.35) * 0.018;
      }
      invalidate();
    }, 125);
    return () => {
      clearInterval(timer);
      restore();
    };
  }, [still, limited, scene, invalidate, kind]);
  useEffect(() => {
    const warm = scene.getObjectByName("study-key") as THREE.DirectionalLight;
    const cold = scene.getObjectByName("window-light") as THREE.PointLight;
    if (!warm || !cold) return;
    const colors: Record<string, string> = {
      II: "#ffdaab",
      III: "#daead7",
      IV: "#dfd7bc",
      V: "#dfdebe",
      VI: "#f0cda0",
      VII: "#ffd2a1",
    };
    const color = new THREE.Color(colors[kind] || "#ffd29d");
    const a = gsap.to(warm.color, {
      r: color.r,
      g: color.g,
      b: color.b,
      duration: still ? 0 : 1.8,
      onUpdate: invalidate,
    });
    const b = gsap.to(cold, {
      intensity: kind === "IV" || kind === "VI" ? 9 : 7,
      duration: still ? 0 : 1.8,
      onUpdate: invalidate,
    });
    return () => {
      a.kill();
      b.kill();
    };
  }, [kind, still, scene, invalidate]);
  return (
    <group>
      <points ref={dust} geometry={geometry}>
        <pointsMaterial
          map={sprite}
          size={0.042}
          color={kind === "III" ? "#afdcd3" : "#e6d5af"}
          transparent
          opacity={0.38}
          depthWrite={false}
        />
      </points>
      <mesh position={[1.9, 2, -2]} rotation={[0.45, 0, -0.3]}>
        <coneGeometry args={[1.2, 4, 12, 1, true]} />
        <meshBasicMaterial
          color="#adc8d2"
          transparent
          opacity={0.025}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
function Solid({
  at,
  size,
  color,
}: {
  at: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={at} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.82} />
    </mesh>
  );
}
function Scroll({ at }: { at: [number, number, number] }) {
  return (
    <group position={at} rotation={[0, -0.2, 0]}>
      <Solid at={[0, 0.025, 0]} size={[0.58, 0.018, 0.75]} color="#d3c098" />
      {[-0.37, 0.37].map((z) => (
        <mesh
          key={z}
          position={[0, 0.085, z]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.075, 0.075, 0.67, 16]} />
          <meshStandardMaterial color="#bba57d" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
export function ChapterProps({ kind }: { kind: SceneKind }) {
  return (
    <group>
      {(kind === "I" || kind === "letter") && (
        <group>
          <Scroll at={[-1.9, 0.035, 1]} />
          <group position={[1.8, 0.075, -0.6]} rotation={[0, 0.15, 0]}>
            <Solid at={[0, 0, 0]} size={[0.8, 0.03, 0.56]} color="#d6c5a0" />
            <mesh position={[0, 0.025, 0]}>
              <cylinderGeometry args={[0.065, 0.065, 0.024, 16]} />
              <meshStandardMaterial color="#853841" roughness={0.65} />
            </mesh>
          </group>
        </group>
      )}
      {kind === "II" && (
        <group position={[-2, 0.045, 1]} rotation={[0, 0.25, 0]}>
          <Solid at={[0, 0, 0]} size={[0.72, 0.025, 0.89]} color="#bea979" />
          <Solid
            at={[0, 0.025, 0]}
            size={[0.62, 0.015, 0.77]}
            color="#53615a"
          />
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 24]} />
            <meshStandardMaterial color="#aaa28c" roughness={1} />
          </mesh>
        </group>
      )}
      {kind === "VI" && (
        <group position={[2.4, 0.18, -0.7]} rotation={[0, -0.22, 0]}>
          <Solid at={[0, 0, 0]} size={[0.8, 0.36, 0.5]} color="#493026" />
          <mesh
            position={[0, 0.18, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry
              args={[0.25, 0.25, 0.8, 16, 1, false, 0, Math.PI]}
            />
            <meshStandardMaterial color="#66432f" roughness={0.85} />
          </mesh>
          {[-0.26, 0.26].map((x) => (
            <Solid
              key={x}
              at={[x, 0.08, 0.255]}
              size={[0.045, 0.39, 0.025]}
              color="#ab8651"
            />
          ))}
        </group>
      )}
      {kind === "VII" && <Scroll at={[2, 0.03, 0.8]} />}
    </group>
  );
}

export function WritingQuill() {
  const shape = useMemo(() => {
    const outline = new THREE.Shape();
    outline.moveTo(0, 0.44);
    outline.bezierCurveTo(-0.23, 0.72, -0.19, 1.2, 0.035, 1.5);
    outline.bezierCurveTo(0.2, 1.14, 0.21, 0.69, 0, 0.44);
    return outline;
  }, []);
  const barbs = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < 16; i++) {
      const y = 0.5 + i * 0.055,
        width = Math.sin(((y - 0.44) / 1.06) * Math.PI) * 0.16;
      points.push(
        0,
        y,
        0.006,
        -width,
        y + 0.11,
        0.006,
        0,
        y,
        0.006,
        width * 0.88,
        y + 0.13,
        0.006,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    return geometry;
  }, []);
  useEffect(() => () => barbs.dispose(), [barbs]);
  return (
    <group position={[2.2, 0.29, 1.25]} rotation={[0, -0.12, -0.45]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.007, 0.009, 1.44, 8]} />
        <meshStandardMaterial color="#bca77e" roughness={0.8} />
      </mesh>
      <mesh castShadow>
        <shapeGeometry args={[shape, 12]} />
        <meshStandardMaterial
          color="#ddd4b7"
          side={THREE.DoubleSide}
          roughness={0.95}
        />
      </mesh>
      <lineSegments geometry={barbs}>
        <lineBasicMaterial color="#aa9a7c" transparent opacity={0.48} />
      </lineSegments>
    </group>
  );
}
