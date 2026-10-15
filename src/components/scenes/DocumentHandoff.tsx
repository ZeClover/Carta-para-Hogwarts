"use client";
import { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
/** The physical page meets the stable DOM sheet; editing stays entirely in HTML.
 * A ResizeObserver handles long editors without moving/remounting their inputs. */
export function DocumentHandoff({
  opening,
  turning,
}: {
  opening?: boolean;
  turning?: boolean;
}) {
  const { camera, gl, invalidate } = useThree();
  const ref = useRef<THREE.Mesh>(null);
  const fitter = useRef<((schedule?: boolean) => void) | null>(null);
  const wasMoving = useRef(false);
  const previousCamera = useRef("");
  useFrame(() => {
    const moving =
      gl.domElement.getAttribute("data-camera-state") === "travelling";
    const signature = [
      ...camera.position.toArray(),
      ...camera.quaternion.toArray(),
      (camera as THREE.PerspectiveCamera).fov,
    ].join(",");
    if (moving || wasMoving.current || signature !== previousCamera.current)
      fitter.current?.(false);
    previousCamera.current = signature;
    wasMoving.current = moving;
  });
  const geometry = useMemo(
    () => new RoundedBoxGeometry(1, 1, 0.012, 3, 0.004),
    [],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const root = gl.domElement.closest(".cinema"),
      sheet = root?.querySelector<HTMLElement>(".cinema-writing");
    if (!sheet || !ref.current) return;
    const fit = (schedule = true) => {
      if (!ref.current) return;
      const rect = sheet.getBoundingClientRect(),
        viewport = gl.domElement.getBoundingClientRect();
      ref.current.visible =
        !opening &&
        !turning &&
        gl.domElement.getAttribute("data-camera-state") !== "travelling" &&
        rect.height > 0;
      gl.domElement.setAttribute(
        "data-handoff-visible",
        String(ref.current.visible),
      );
      if (!ref.current.visible) {
        if (schedule) invalidate();
        return;
      }
      camera.updateMatrixWorld();
      const lens = camera as THREE.PerspectiveCamera,
        distance = 3;
      const height =
          2 * distance * Math.tan(THREE.MathUtils.degToRad(lens.fov / 2)),
        width = height * lens.aspect;
      const center = new THREE.Vector3(
        ((rect.left - viewport.left + rect.width / 2) / viewport.width) * 2 - 1,
        1 - ((rect.top - viewport.top + rect.height / 2) / viewport.height) * 2,
        0,
      ).unproject(camera);
      const direction = center.clone().sub(camera.position).normalize();
      const normal = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion,
      );
      center
        .copy(camera.position)
        .addScaledVector(direction, distance / direction.dot(normal));
      ref.current.position.copy(center);
      ref.current.quaternion.copy(camera.quaternion);
      ref.current.scale.set(
        (width * (rect.width + 8)) / viewport.width,
        (height * (rect.height + 8)) / viewport.height,
        1,
      );
      if (schedule) invalidate();
    };
    fitter.current = fit;
    fit();
    const observer = new ResizeObserver(() => fit());
    observer.observe(sheet);
    observer.observe(gl.domElement);
    return () => {
      fitter.current = null;
      observer.disconnect();
    };
  }, [camera, gl, invalidate, opening, turning]);
  return (
    <mesh
      name="document-handoff"
      ref={ref}
      geometry={geometry}
      visible={false}
      renderOrder={1}
    >
      <meshStandardMaterial color="#f0dfbb" roughness={0.96} />
    </mesh>
  );
}
