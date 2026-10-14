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
    object: "correspondence",
    surface: "letter",
    wall: "#4a3930",
    key: "#ffdfb6",
    fill: "#c8d5df",
    layout: "left",
    camera: [1.3, 4.1, 4.4],
    target: [-1.1, 0.3, 0],
    mobileCamera: [0, 6.5, 8.5],
    mobileTarget: [0, -2.1, 0],
  },
  II: {
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
    object: "memory",
    surface: "memory",
    wall: "#345553",
    key: "#d7fff0",
    fill: "#b7cbeb",
    layout: "right",
    camera: [-1.8, 3.1, 6.8],
    target: [1.3, 0.8, 0],
    mobileCamera: [0, 3.6, 12],
    mobileTarget: [0, -0.6, 0],
  },
  IV: {
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
    object: "mirror",
    surface: "mirror",
    wall: "#433a50",
    key: "#ede2ff",
    fill: "#b9e1da",
    layout: "right",
    camera: [-1.3, 2.3, 7.0],
    target: [1.6, 1.6, 0],
    mobileCamera: [0, 3, 16],
    mobileTarget: [0, -1.5, 0],
  },
  VI: {
    object: "celestial-map",
    surface: "celestial",
    wall: "#1e344e",
    key: "#d5ddff",
    fill: "#ffe0ad",
    layout: "left",
    camera: [1.8, 4.4, 5],
    target: [-1.3, 0.5, 0],
    mobileCamera: [0, 6, 11],
    mobileTarget: [0, -1.8, 0],
  },
  VII: {
    object: "personal-archive",
    surface: "archive",
    wall: "#47302e",
    key: "#ffe1bf",
    fill: "#d4ccc5",
    layout: "right",
    camera: [-1.8, 3.7, 5.4],
    target: [1.25, 0.6, 0],
    mobileCamera: [0, 5.5, 10.8],
    mobileTarget: [0, -2, 0],
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
