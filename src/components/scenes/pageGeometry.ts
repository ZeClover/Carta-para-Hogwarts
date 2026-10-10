import * as THREE from "three";
export const PAGE_WIDTH = 1.52;
export const PAGE_DEPTH = 1.94;
export const PAGE_COLUMNS = 32;
export const PAGE_ROWS = 12;
/** Integrate the paper's tangent, preserving arc length as a travelling curl crosses it. */
export function pageProfile(progress: number, side: number) {
  const p = Math.max(0, Math.min(1, progress));
  const curl = Math.sin(Math.PI * p);
  let x = 0.035,
    y = 0;
  const points: [number, number][] = [[side * x, 0.31]];
  for (let i = 1; i <= PAGE_COLUMNS; i++) {
    const u = (i - 0.5) / PAGE_COLUMNS;
    const angle =
      Math.PI * p + curl * (0.85 * Math.sin(Math.PI * u) - 0.48 * (1 - u));
    x += (Math.cos(angle) * PAGE_WIDTH) / PAGE_COLUMNS;
    y += (Math.sin(angle) * PAGE_WIDTH) / PAGE_COLUMNS;
    const gutter = 0.032 * Math.exp((-i / PAGE_COLUMNS) * 8);
    const settle =
      p > 0.88
        ? (Math.sin(((p - 0.88) / 0.12) * Math.PI * 2) * 0.012 * (1 - p)) / 0.12
        : 0;
    points.push([side * x, 0.278 + y + gutter + (settle * i) / PAGE_COLUMNS]);
  }
  return points;
}
export function deformPage(
  geometry: THREE.BufferGeometry,
  progress: number,
  side: number,
) {
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  const profile = pageProfile(progress, side);
  for (let row = 0; row <= PAGE_ROWS; row++) {
    const v = row / PAGE_ROWS;
    for (let col = 0; col <= PAGE_COLUMNS; col++) {
      const u = col / PAGE_COLUMNS;
      const [x, y] = profile[col];
      uv.setX(row * (PAGE_COLUMNS + 1) + col, side < 0 ? 1 - u : u);
      // Tiny deckle at the outer edge and a diagonal lift at the leading corner.
      const deckle = Math.sin(row * 2.7) * 0.003 * u ** 5;
      const corner =
        Math.sin(Math.PI * progress) * Math.sin(Math.PI * u) * (v - 0.5) * 0.1;
      positions.setXYZ(
        row * (PAGE_COLUMNS + 1) + col,
        x + side * deckle,
        y + corner,
        PAGE_DEPTH * (0.5 - v),
      );
    }
  }
  positions.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}
export function createPageGeometry(side = 1) {
  const g = new THREE.BufferGeometry();
  const vertices = (PAGE_COLUMNS + 1) * (PAGE_ROWS + 1);
  g.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices * 3), 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const uv = new Float32Array(vertices * 2),
    indices: number[] = [];
  for (let row = 0; row <= PAGE_ROWS; row++)
    for (let col = 0; col <= PAGE_COLUMNS; col++) {
      const n = row * (PAGE_COLUMNS + 1) + col;
      uv[n * 2] = col / PAGE_COLUMNS;
      uv[n * 2 + 1] = row / PAGE_ROWS;
      if (col < PAGE_COLUMNS && row < PAGE_ROWS) {
        const b = n + PAGE_COLUMNS + 1;
        indices.push(n, n + 1, b, n + 1, b + 1, b);
      }
    }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(indices);
  deformPage(g, 0, side);
  return g;
}
