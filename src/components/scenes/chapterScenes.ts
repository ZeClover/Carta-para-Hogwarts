import { chapterDirection, chapterOrder } from "./chapterDirection";
import posters from "@/content/redesign-posters.json";
import assets from "@/content/redesign-assets.json";
import desk from "@/content/desk.json";
import hourglass from "@/content/hourglass.json";
import mirror from "@/content/mirror.json";
import armillary from "@/content/armillary.json";
import inkQuill from "@/content/ink-quill.json";
import photoBox from "@/content/photo-box.json";
/** Presentation-only manifest. It contains no questions, answers or narrative conditions. */
export const chapterScenes = Object.fromEntries(
  chapterOrder.map((id) => {
    const direction = chapterDirection[id];
    return [
      id,
      {
        heroId: `chapter-${id.toLowerCase()}`,
        criticalAssets: [
          id === "VII"
            ? desk.path
            : id === "III"
              ? inkQuill.path
              : id === "V"
                ? mirror.path
                : id === "VI"
                  ? armillary.path
                  : assets.find((a) => a.chapter === id)!.path,
          ...(id === "VI"
            ? [hourglass.path]
            : id === "VII"
              ? [photoBox.path]
              : []),
        ],
        optionalAssets:
          id === "II"
            ? [
                "/assets/memory-forest.jpg",
                "/assets/fancy_picture_frame_02.glb",
              ]
            : [],
        desktop: {
          read: {
            position: direction.camera,
            target: direction.target,
            fov: direction.fov,
          },
        },
        mobile: {
          read: {
            position: direction.mobileCamera,
            target: direction.mobileTarget,
            fov: direction.fov,
          },
        },
        document: {
          anchorId: `document-${id}`,
          mode: direction.surface,
          maxWidthPx: 540,
          mobileMode: "single-page",
        },
        light: { key: direction.key, fill: direction.fill, shadowSize: 512 },
        transition: id === "V" || id === "VI" ? "match-cut" : "paper-cover",
        poster: {
          desktop: posters.find(
            (p) => p.chapter === id && p.device === "desktop",
          )!.path,
          mobile: posters.find(
            (p) => p.chapter === id && p.device === "mobile",
          )!.path,
        },
      },
    ];
  }),
);
