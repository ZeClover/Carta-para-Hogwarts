import { describe, expect, it } from "vitest";
import {
  createPageGeometry,
  deformPage,
  pageProfile,
  PAGE_WIDTH,
  PAGE_COLUMNS,
} from "../src/components/scenes/pageGeometry";
describe("Papel deformável", () => {
  it("curva a folha ao longo da largura sem alongá-la como uma placa", () => {
    const p = pageProfile(0.45, 1);
    const angles = p
      .slice(1)
      .map((v, i) => Math.atan2(v[1] - p[i][1], v[0] - p[i][0]));
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(0.4);
    const length = p
      .slice(1)
      .reduce(
        (sum, v, i) => sum + Math.hypot(v[0] - p[i][0], v[1] - p[i][1]),
        0,
      );
    expect(length).toBeCloseTo(PAGE_WIDTH, 1);
    expect(Math.max(...p.map((v) => v[1]))).toBeGreaterThan(1.2);
  });
  it("espelha a virada reversa e mantém papel apoiado em ambos os extremos", () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const f = pageProfile(t, 1),
        b = pageProfile(t, -1);
      f.forEach((v, i) => {
        expect(b[i][0]).toBeCloseTo(-v[0]);
        expect(b[i][1]).toBeCloseTo(v[1]);
      });
    }
    expect(pageProfile(1, 1)[PAGE_COLUMNS][0]).toBeLessThan(-1.4);
    expect(pageProfile(1, 1)[PAGE_COLUMNS][1]).toBeLessThan(0.32);
  });
  it("atualiza normais e limites finitos durante interrupção e reuso", () => {
    const g = createPageGeometry();
    for (const t of [0, 0.15, 0.5, 0.96, 1, 0]) {
      deformPage(g, t, -1);
      expect(
        [
          ...g.getAttribute("position").array,
          ...g.getAttribute("normal").array,
        ].every(Number.isFinite),
      ).toBe(true);
      expect(g.boundingSphere!.radius).toBeGreaterThan(1);
    }
    expect(g.getAttribute("uv").getX(0)).toBe(1);
    expect(g.getAttribute("uv").getX(PAGE_COLUMNS)).toBe(0);
    g.dispose();
  });
});
