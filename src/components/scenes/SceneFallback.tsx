"use client";
import { useId } from "react";
import type { SceneKind } from "./config";
/** Finished local illustration, also used while the optional WebGL renderer loads. */
export function SceneFallback({
  kind,
  active,
  still,
}: {
  kind: SceneKind;
  active: boolean;
  still: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const paint = (name: string) => `url(#${id}-${name})`;
  const book = kind === "II" || kind === "I" || kind === "final";
  return (
    <svg
      className={`study-illustration ${still ? "still" : ""} ${active ? "active" : ""}`}
      viewBox="0 0 1000 560"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-room`} x2="0" y2="1">
          <stop stopColor="#172c32" />
          <stop offset="1" stopColor="#08191d" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x2="0" y2="1">
          <stop stopColor="#80512d" />
          <stop offset=".35" stopColor="#482b20" />
          <stop offset="1" stopColor="#281a19" />
        </linearGradient>
        <linearGradient id={`${id}-brass`}>
          <stop stopColor="#593b21" />
          <stop offset=".4" stopColor="#e5b96d" />
          <stop offset=".7" stopColor="#94713b" />
          <stop offset="1" stopColor="#f0d7a0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#ffe0a1" stopOpacity=".65" />
          <stop offset="1" stopColor="#ffd193" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1">
          <stop stopColor="#91b9b6" />
          <stop offset=".35" stopColor="#1e4549" />
          <stop offset=".7" stopColor="#9ca88f" />
          <stop offset="1" stopColor="#254247" />
        </linearGradient>
      </defs>
      <rect width="1000" height="560" fill={paint("room")} />
      <g className="study-background">
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d={`M${i * 110} 0v560`}
            stroke="#b4a174"
            strokeOpacity=".12"
            strokeWidth="2"
          />
        ))}
        <path
          d="M635 320V95Q755 -35 875 95v225Z"
          fill="#0d1c35"
          stroke={paint("brass")}
          strokeWidth="12"
        />
        <circle cx="809" cy="72" r="28" fill="#e3e2be" />
        <path
          d="M755 18v302M637 162h235M637 266h235"
          stroke="#9b7847"
          strokeWidth="7"
        />
        {Array.from({ length: 18 }, (_, i) => (
          <circle
            key={i}
            cx={650 + ((i * 43) % 210)}
            cy={65 + ((i * 37) % 240)}
            r={i % 3 === 0 ? 2 : 1}
            fill="#d8d6bd"
          />
        ))}
        <path
          d="M595 0h43l-27 335-28 31ZM871 0h44l23 366-49-31Z"
          fill="#572c32"
        />
        <g transform="translate(128 115)">
          <rect width="154" height="196" rx="4" fill={paint("brass")} />
          <rect x="12" y="12" width="130" height="172" fill="#25262c" />
          <path d="M49 167q-5-58 26-65t30 65" fill="#383a39" />
          <circle cx="76" cy="78" r="23" fill="#535049" />
        </g>
        <path
          d="M325 333V211q0-53 50-53t50 53v122"
          fill="#633b37"
          stroke="#b68a49"
          strokeWidth="9"
        />
      </g>
      <g className="study-desk">
        <ellipse
          cx="510"
          cy="487"
          rx="442"
          ry="43"
          fill="#030e10"
          opacity=".7"
        />
        <path
          d="M81 324 761 306 956 425 199 464Z"
          fill={paint("wood")}
          stroke="#b68146"
          strokeWidth="3"
        />
        <path d="M199 464 956 425v25L199 494 81 352v-28Z" fill="#3d261e" />
        <path
          d="M207 492v68h26l10-70M886 454v106h28l-6-108"
          fill={paint("wood")}
        />
        {Array.from({ length: 6 }, (_, i) => (
          <path
            key={i}
            d={`M${160 + i * 110} 342l155 83`}
            stroke="#cf9b57"
            strokeOpacity=".14"
          />
        ))}
        <g transform="translate(172 303)">
          <path
            d="m0 0 142-9 60 28-145 14Z"
            fill="#7a3034"
            stroke="#c99e63"
            strokeWidth="3"
          />
          <path
            d="m5-14 131-7 56 27-139 11Z"
            fill="#2f5550"
            stroke="#c99e63"
            strokeWidth="3"
          />
          <path
            d="m12-26 119-5 44 22-124 8Z"
            fill="#413224"
            stroke="#c99e63"
            strokeWidth="3"
          />
        </g>
        <g transform="translate(805 337)">
          <ellipse cy="7" rx="24" ry="11" fill="#091719" />
          <path
            d="M-14 0v-23h28V0"
            fill="#162429"
            stroke="#c49c61"
            strokeWidth="2"
          />
          <path d="M0-23q9-92 51-145-8 67-49 129" fill="#d9cda7" />
          <path d="m0-18 43-119" stroke="#6f604b" />
        </g>
        <g transform="translate(316 276)">
          <circle cy="-63" r="89" fill={paint("glow")} />
          <ellipse cy="53" rx="24" ry="9" fill={paint("brass")} />
          <path d="M-18 48h36L8 27V-29H-8v56Z" fill={paint("brass")} />
          <rect x="-8" y="-75" width="16" height="47" rx="3" fill="#e8dbb4" />
          <path
            className="study-flame"
            d="M0-105q-18 21 0 30 16-10 0-30"
            fill="#ffc774"
          />
        </g>
        {book ? (
          <g className="study-focus" transform="translate(442 330)">
            <path
              d="m-56 10 177-25 176 60-183 34Z"
              fill="#623c33"
              stroke={paint("brass")}
              strokeWidth="5"
            />
            <g className="study-pages">
              <path d="m-44 3 161-20 10 74-170-38Z" fill="#e0cf9e" />
              <path d="m117-17 166 47-156 27Z" fill="#f0dfb6" />
              {Array.from({ length: 5 }, (_, i) => (
                <path
                  key={i}
                  d={`m${-20 + i * 5} ${9 + i * 5} 91-10m60 0 68 18`}
                  stroke="#a28a63"
                  strokeWidth="2"
                />
              ))}
              {kind === "II" && (
                <>
                  <path d="m-9 7 76-8 12 25-79 8Z" fill="#5a6960" />
                  <path d="m144 11 63 16-47 9-29-17Z" fill="#586766" />
                </>
              )}
            </g>
            {kind === "final" && (
              <circle cx="117" cy="24" r="18" fill="#85333b" />
            )}
          </g>
        ) : kind === "V" ? (
          <g className="study-focus" transform="translate(527 179)">
            <ellipse ry="127" rx="88" fill={paint("brass")} />
            <ellipse ry="111" rx="73" fill={paint("glass")} />
            <path
              d="M-50 60 37-86M-30 72 57-74"
              stroke="#d7e0c8"
              strokeOpacity=".28"
              strokeWidth="9"
            />
            <path d="M-25 125-41 178h83l-26-53" fill={paint("brass")} />
          </g>
        ) : kind === "VI" ? (
          <g className="study-focus">
            <path
              d="m383 349 225-33 107 85-236 38Z"
              fill="#243d50"
              stroke="#bfa472"
              strokeWidth="3"
            />
            {Array.from({ length: 14 }, (_, i) => (
              <circle
                key={i}
                cx={426 + ((i * 41) % 203)}
                cy={345 + ((i * 17) % 65)}
                r="2.6"
                fill="#e8d7ad"
              />
            ))}
            <g transform="translate(567 291)">
              <path
                d="M-32-59h64M-32 62h64M-24-59v121M24-59v121"
                stroke={paint("brass")}
                strokeWidth="6"
              />
              <path
                d="M-20-53q0 40 20 53-20 19-20 54h40q0-35-20-54 20-13 20-53Z"
                fill="#b1d1cc"
                fillOpacity=".4"
                stroke="#b1d1cc"
              />
              <path d="M-17 46 0 18 17 46Z" fill="#dec48c" />
            </g>
          </g>
        ) : kind === "VII" ? (
          <g className="study-focus" transform="translate(422 325)">
            <path d="m0-9 198-16 47 28-203 23Z" fill={paint("wood")} />
            <path
              d="M42 26 245 3v78L42 104Z"
              fill="#482c20"
              stroke="#a78350"
              strokeWidth="3"
            />
            <g className="study-drawer">
              <path d="m44 62 166-17 40 32-178 24Z" fill="#271c1b" />
              <path d="m72 101 178-24v22L72 126Z" fill={paint("wood")} />
              <circle cx="162" cy="103" r="6" fill="#d1b173" />
            </g>
            <path d="m-47 55 66-8 28 26-69 11Z" fill="#d9c99b" />
            <path d="m-32 55 38-4 13 15-39 5Z" fill="#51645a" />
          </g>
        ) : kind === "III" ? (
          <g className="study-focus" transform="translate(523 294)">
            <rect
              x="-68"
              y="-100"
              width="136"
              height="151"
              fill={paint("brass")}
            />
            <rect x="-54" y="-86" width="108" height="123" fill="#345354" />
            <path d="M-22 18q-10-43 22-52t23 52" fill="#6d867c" />
            <circle cy="-54" r="17" fill="#97a590" />
            <circle className="study-magic" r="103" fill={paint("glow")} />
          </g>
        ) : (
          <g className="study-focus" transform="translate(436 347)">
            <path
              className="study-letter"
              d="m11 0 154-22 66 37-160 27Z"
              fill="#efe1b8"
              stroke="#bdab7f"
              strokeWidth="2"
            />
            <path
              d="m0 3 168-22 74 56-176 24Z"
              fill="#d1bd8e"
              stroke="#927746"
              strokeWidth="2"
            />
            <path
              className="study-flap"
              d="m0 3 168-22-51 65Z"
              fill="#e4d4aa"
              stroke="#b29a6c"
              strokeWidth="2"
            />
            <circle
              className="study-seal"
              cx="110"
              cy="25"
              r="17"
              fill="#8f3540"
              stroke="#d17975"
              strokeWidth="2"
            />
          </g>
        )}
      </g>
      <g opacity=".65">
        {Array.from({ length: 16 }, (_, i) => (
          <circle
            className="study-dust"
            key={i}
            cx={90 + ((i * 173) % 830)}
            cy={110 + ((i * 61) % 310)}
            r={i % 2 ? 1 : 2}
            fill="#e4c89b"
            style={{ animationDelay: `${i * -0.3}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
