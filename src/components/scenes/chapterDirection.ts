import type { ChapterId } from "@/content/chapters";
export const chapterOrder: ChapterId[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
];
type Point = [number, number, number];
export type Direction = {
  documentAnchor: Point;
  fov: number;
  object: string;
  surface: string;
  wall: string;
  key: string;
  fill: string;
  layout: "left" | "right";
  camera: Point;
  target: Point;
  mobileCamera: Point;
  mobileTarget: Point;
};
/** Camera coordinates are local to separate stage bays, eighteen metres apart.
 * Reading poses are static. Navigation moves both camera and its look target. */
export const chapterDirection: Record<ChapterId, Direction> = {
  I: {
    documentAnchor: [-3.4, 1.3, 1.1],
    fov: 34,
    object: "correspondence",
    surface: "letter",
    wall: "#4a3930",
    key: "#ffdfb6",
    fill: "#c8d5df",
    layout: "left",
    camera: [1.3, 5.0, 5.4],
    target: [-1.1, 0.3, 0],
    mobileCamera: [0, 6.5, 8.5],
    mobileTarget: [0, -2.1, 0],
  },
  II: {
    documentAnchor: [-3.4, 1.1, 0.8],
    fov: 36,
    object: "album",
    surface: "album",
    wall: "#5b5042",
    key: "#ffe5bf",
    fill: "#d8dfce",
    layout: "left",
    camera: [1.4, 4.8, 4.3],
    target: [-1.3, 0.2, 0],
    mobileCamera: [0, 7.4, 10.5],
    mobileTarget: [0, -2.4, 0],
  },
  III: {
    documentAnchor: [3.1, 1.3, 0.8],
    fov: 36,
    object: "ink-quill",
    surface: "memory",
    wall: "#345553",
    key: "#d7fff0",
    fill: "#b7cbeb",
    layout: "right",
    camera: [-1.5, 3.2, 5.5],
    target: [0.5, 0.9, 0],
    mobileCamera: [0, 3.3, 8.3],
    mobileTarget: [0, -1.0, 0],
  },
  IV: {
    documentAnchor: [-3.5, 1.7, 0.8],
    fov: 38,
    object: "window-letter",
    surface: "delivery",
    wall: "#263f56",
    key: "#dae7ff",
    fill: "#ffd3a0",
    layout: "left",
    camera: [1.3, 2.9, 5.2],
    target: [-1.4, 1.3, 0],
    mobileCamera: [0, 3, 14],
    mobileTarget: [0, -0.6, 0],
  },
  V: {
    documentAnchor: [3.6, 1.7, 0.6],
    fov: 32,
    object: "mirror",
    surface: "mirror",
    wall: "#433a50",
    key: "#ffe2bd",
    fill: "#ccdced",
    layout: "right",
    camera: [-0.5, 2.3, 6.8],
    target: [0.75, 1.6, 0],
    mobileCamera: [0, 2.1, 8],
    mobileTarget: [0, -0.75, 0],
  },
  VI: {
    documentAnchor: [-3.4, 1.3, 0.8],
    fov: 38,
    object: "armillary-sphere",
    surface: "celestial",
    wall: "#1e344e",
    key: "#ffe2ae",
    fill: "#b6cfe4",
    layout: "left",
    camera: [1.6, 3.1, 6.6],
    target: [-0.8, 1.1, 0],
    mobileCamera: [0.2, 2.7, 8.5],
    mobileTarget: [0, -1.05, 0],
  },
  VII: {
    documentAnchor: [3.2, 1.3, 0.8],
    fov: 35,
    object: "victorian-desk",
    surface: "archive",
    wall: "#47302e",
    key: "#ffe1bf",
    fill: "#d4ccc5",
    layout: "right",
    camera: [-0.8, 4.7, 9.0],
    target: [0.6, 0.7, 0],
    mobileCamera: [-0.1, 4.2, 10.8],
    mobileTarget: [0, -1.1, 0],
  },
};
export function chapterPose(chapter: ChapterId, portrait: boolean) {
  const d = chapterDirection[chapter],
    x = chapterOrder.indexOf(chapter) * 18;
  const camera = [...(portrait ? d.mobileCamera : d.camera)] as Point;
  const target = [...(portrait ? d.mobileTarget : d.target)] as Point;
  camera[0] += x;
  target[0] += x;
  return { camera, target };
}
