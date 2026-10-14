"use client";
import { useId, useEffect, useState } from "react";
import type { ChapterId } from "@/content/chapters";
import { chapterScenes } from "./chapterScenes";
import { chapterDirection } from "./chapterDirection";
/** Distinct authored compositions for low power devices; never a blank or generic study. */
function ChapterVector({
  chapter,
  turning,
  still,
  turnDirection = 1,
}: {
  chapter: ChapterId;
  turning?: boolean;
  still: boolean;
  turnDirection?: number;
}) {
  const id = useId().replaceAll(":", "");
  const url = (s: string) => `url(#${id}-${s})`;
  const d = chapterDirection[chapter];
  return (
    <svg
      className={`chapter-vector chapter-art-vector-${chapter} ${turning && !still ? "reacting" : ""}`}
      viewBox="0 0 1000 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-room`}>
          <stop stopColor={d.wall} />
          <stop offset="1" stopColor="#161b23" />
        </radialGradient>
        <linearGradient id={`${id}-paper`} x2=".4" y2="1">
          <stop stopColor="#fff0cc" />
          <stop offset=".7" stopColor="#dbc195" />
          <stop offset="1" stopColor="#b99a6b" />
        </linearGradient>
        <linearGradient id={`${id}-gold`}>
          <stop stopColor="#66503a" />
          <stop offset=".25" stopColor="#e3c28d" />
          <stop offset=".55" stopColor="#a08052" />
          <stop offset=".8" stopColor="#f4d6a1" />
          <stop offset="1" stopColor="#70543a" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1">
          <stop stopColor="#b6c9c6" />
          <stop offset=".4" stopColor="#41615f" />
          <stop offset=".75" stopColor="#9ca9aa" />
          <stop offset="1" stopColor="#33484d" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x2="0" y2="1">
          <stop stopColor="#91663f" />
          <stop offset="1" stopColor="#3d2825" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={d.key} stopOpacity=".25" />
          <stop offset="1" stopColor={d.key} stopOpacity="0" />
        </radialGradient>
        <pattern
          id={`${id}-wall`}
          width="60"
          height="90"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M30 5q25 40 0 80-25-40 0-80Z"
            fill="none"
            stroke="#cdbca0"
            strokeOpacity=".1"
          />
        </pattern>
      </defs>
      <rect width="1000" height="700" fill={url("room")} />
      <rect width="1000" height="700" fill={url("wall")} />
      <ellipse
        cx={d.layout === "left" ? 720 : 280}
        cy="290"
        rx="480"
        ry="400"
        fill={url("light")}
      />
      <path d="M0 568 1000 500v200H0Z" fill={url("wood")} />
      <g
        className="chapter-art-object"
        style={{
          transformOrigin: d.layout === "left" ? "720px 310px" : "280px 310px",
        }}
        transform={`translate(${d.layout === "left" ? 720 : 280} 330)`}
      >
        <ellipse cy="213" rx="230" ry="35" fill="#101517" opacity=".45" />
        {chapter === "I" && (
          <g transform="rotate(-9)">
            <path
              d="M-195-125H150V200H-195Z"
              fill={url("paper")}
              stroke="#ad8a57"
            />
            <path d="M-170-99H125V171H-170Z" fill="none" stroke="#b89b6b" />
            <text
              x="-22"
              y="-50"
              textAnchor="middle"
              fontSize="48"
              fontFamily="Georgia"
              fill="#745130"
            >
              H
            </text>
            <text
              x="-22"
              y="-9"
              textAnchor="middle"
              fontSize="15"
              letterSpacing="3"
              fill="#77532f"
            >
              HOGWARTS
            </text>
            {[0, 1, 2, 3, 4].map((i) => (
              <path
                key={i}
                d={`M-131 ${35 + i * 22}h218`}
                stroke="#8d704b"
                opacity=".4"
              />
            ))}
            <g transform="translate(90 126) rotate(16)">
              <path
                d="M-110-48H124V94H-110Z"
                fill={url("paper")}
                stroke="#ad8a57"
              />
              <path d="m-110-48 117 93L124-48" fill="none" stroke="#ad8a57" />
              <circle
                cx="8"
                cy="32"
                r="23"
                fill="#913d42"
                stroke="#c67766"
                strokeWidth="4"
              />
            </g>
          </g>
        )}
        {chapter === "II" && (
          <g transform="rotate(-8)">
            <path
              d="M-221-111Q-102-148 0-104Q109-145 222-110V170Q90 141 0 176Q-112 144-221 174Z"
              fill="#634737"
              stroke={url("gold")}
              strokeWidth="9"
            />
            <path
              d="M-209-107Q-94-139-5-96V162Q-113 135-209 159ZM5-96Q112-135 208-104V159Q112 134 5 162Z"
              fill={url("paper")}
            />
            <path d="M0-105v278" stroke="#a28a61" strokeWidth="7" />
            {[-165, 45].map((x, i) => (
              <g
                key={x}
                transform={`translate(${x} -58) rotate(${i ? 8 : -6})`}
              >
                <rect width="115" height="148" fill="#f0dfbb" />
                <image
                  href="/assets/memory-forest.jpg"
                  x="10"
                  y="10"
                  width="95"
                  height="120"
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            ))}
            {turning && !still && (
              <g transform={turnDirection < 0 ? "scale(-1 1)" : undefined}>
                <path
                  fill={url("paper")}
                  stroke="#ab936d"
                  d="M5 -96Q112 -135 208 -104V159Q112 134 5 162Z"
                >
                  <animate
                    attributeName="d"
                    dur="1.55s"
                    fill="freeze"
                    values="M5 -96Q112 -135 208 -104V159Q112 134 5 162Z;M5 -96Q135 -220 144 -175L5 162Q112 23 5 -96Z;M5 -96Q-112 -221 -172 -149L5 162Q-152 23 5 -96Z;M5 -96Q-112 -135 -208 -104V159Q-112 134 5 162Z"
                    keyTimes="0;.32;.68;1"
                    calcMode="spline"
                    keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1"
                  />
                </path>
              </g>
            )}
          </g>
        )}
        {chapter === "III" && (
          <g>
            <rect
              x="-194"
              y="-160"
              width="388"
              height="316"
              rx="5"
              fill={url("gold")}
            />
            <image
              href="/assets/memory-forest.jpg"
              x="-171"
              y="-138"
              width="342"
              height="272"
              preserveAspectRatio="xMidYMid slice"
            />
            <path
              d="M-170 108Q-30 87 170 112"
              fill="none"
              stroke="#acdfcc"
              strokeWidth="3"
            />
            <g className="memory-orb">
              <circle cy="190" r="24" fill={url("glass")} stroke="#cbe4c8" />
              <ellipse
                cy="190"
                rx="36"
                ry="12"
                fill="none"
                stroke={url("gold")}
                strokeWidth="3"
              />
            </g>
          </g>
        )}
        {chapter === "IV" && (
          <g>
            <path
              d="M-164 111v-244q164-152 328 0v244Z"
              fill="#293e59"
              stroke={url("gold")}
              strokeWidth="14"
            />
            <circle cx="83" cy="-133" r="27" fill="#eae7cb" />
            <path
              d="M0-208V110M-157-63h314M-157 23h314"
              stroke="#b4a281"
              strokeWidth="6"
            />
            <path d="M-184 118h368v21h-368Z" fill={url("gold")} />
            <g
              className="delivery-letter"
              transform="translate(0 145) rotate(-12)"
            >
              <path
                d="M-124-32H124V103H-124Z"
                fill={url("paper")}
                stroke="#a68553"
              />
              <path d="m-124-32 124 87L124-32" fill="none" stroke="#ac8c5b" />
              <circle cy="51" r="22" fill="#913d42" />
            </g>
          </g>
        )}
        {chapter === "V" && (
          <g>
            <ellipse cy="-10" rx="163" ry="237" fill={url("gold")} />
            <ellipse cy="-10" rx="140" ry="211" fill={url("glass")} />
            <ellipse
              cy="-10"
              rx="153"
              ry="225"
              fill="none"
              stroke="#f4d9ab"
              strokeWidth="3"
            />
            {[-1, 1].map((s) => (
              <path
                key={s}
                d={`M ${s * 120} -154 q ${s * 62} -20 ${s * 27} -64 q ${-s * 50} 20 ${-s * 48} 49 M ${s * 142} 102 q ${s * 47} 14 ${s * 30} 54`}
                fill="none"
                stroke={url("gold")}
                strokeWidth="10"
              />
            ))}
            <path
              d="m-84 118 131-253M-47 129 130-215"
              stroke="#e9f1e6"
              strokeOpacity=".2"
              strokeWidth="18"
            />
            <path d="M-50 215-73 269H73l-26-54" fill={url("gold")} />
          </g>
        )}
        {chapter === "VI" && (
          <g>
            <g transform="rotate(-14)">
              <rect
                x="-215"
                y="-123"
                width="420"
                height="302"
                fill="#294661"
                stroke={url("gold")}
                strokeWidth="5"
              />
              {[38, 76, 112].map((r) => (
                <circle
                  key={r}
                  r={r}
                  fill="none"
                  stroke="#c2aa7e"
                  strokeOpacity=".6"
                />
              ))}
              {Array.from({ length: 30 }, (_, i) => (
                <circle
                  key={i}
                  cx={-184 + ((i * 97) % 372)}
                  cy={-99 + ((i * 53) % 244)}
                  r={i % 4 ? 2 : 4}
                  fill="#f3deb0"
                />
              ))}
              <path
                d="M-133-55-58 29 25-33 84 62 149 32"
                fill="none"
                stroke="#a0b6c9"
              />
            </g>
            <g className="celestial-hourglass" transform="translate(117 -75)">
              <path
                d="M-43-86h86M-43 85h86M-34-81V80M34-81V80"
                stroke={url("gold")}
                strokeWidth="9"
              />
              <path
                d="M-28-72Q-27-18 0 0-28 19-28 72h56Q27 18 0 0 28-18 28-72Z"
                fill="#aacbce"
                fillOpacity=".38"
                stroke="#bdd6d5"
              />
              <path d="M-23 67 0 27 23 67Z" fill="#dbc293" />
            </g>
          </g>
        )}
        {chapter === "VII" && (
          <g>
            <g transform="translate(92 -86) rotate(12)">
              <path
                d="M-105-60h220v153h-220Z"
                fill={url("wood")}
                stroke="#ac8a57"
                strokeWidth="5"
              />
              <path
                d="M-91-44h192v119h-192Z"
                fill="none"
                stroke="#d3b478"
                strokeWidth="2"
              />
            </g>
            <path
              d="M-132-96 111-84 138 102-112 117Z"
              fill="#644730"
              stroke="#c1a072"
              strokeWidth="7"
            />
            <path d="M-109-72 92-62 112 84-94 98Z" fill="#b18b58" />
            {[-1, 0, 1].map((i) => (
              <rect
                key={i}
                x={-80 + i * 12}
                y={-42 + i * 18}
                width="135"
                height="90"
                fill={url("paper")}
                transform={`rotate(${i * 8})`}
              />
            ))}
            <path
              d="m-112 117 250-15v33l-250 18Z"
              fill={url("wood")}
              stroke="#ac8a57"
              strokeWidth="4"
            />
            {[0, 1, 2, 3].map((i) => (
              <g
                key={i}
                transform={`translate(${-242 + (i % 2) * 78} ${-65 + Math.floor(i / 2) * 120}) rotate(${i % 2 ? 9 : -8})`}
              >
                <rect
                  width="62"
                  height="88"
                  fill={url("paper")}
                  stroke="#af976d"
                />
                <rect x="7" y="7" width="48" height="65" fill="#e8dbc0" />
              </g>
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}

export function ChapterFallback(props: Parameters<typeof ChapterVector>[0]) {
  const [loaded, setLoaded] = useState<{
    chapter: string;
    path: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    const media = matchMedia("(max-width: 700px)");
    const prepare = () => {
      const path = media.matches
        ? chapterScenes[props.chapter].poster.mobile
        : chapterScenes[props.chapter].poster.desktop;
      const image = new Image();
      image.onload = () => {
        if (active) setLoaded({ chapter: props.chapter, path });
      };
      image.onerror = () => {
        if (active) setLoaded(null);
      };
      image.src = path;
    };
    prepare();
    media.addEventListener("change", prepare);
    return () => {
      active = false;
      media.removeEventListener("change", prepare);
    };
  }, [props.chapter]);
  const poster = loaded?.chapter === props.chapter ? loaded.path : null;
  return (
    <div
      className={`chapter-fallback chapter-art-${props.chapter}`}
      aria-hidden="true"
      data-poster={poster ? "ready" : "vector"}
    >
      {poster ? (
        <div
          className="chapter-poster"
          style={{ backgroundImage: `url("${poster}")` }}
        />
      ) : (
        <ChapterVector {...props} />
      )}
    </div>
  );
}
