"use client";

// 둥이 v3 — 3D 느낌의 글로시 마스코트 (v4.1)
//
// 플랫(v2)에서 한 단계 올려, 라이팅이 들어간 소프트 3D 룩으로:
// - 라디얼 그라데이션 바디(좌상단 광원) + 스페큘러 하이라이트 + 바닥 그림자
// - 광택 눈(이중 하이라이트), 그라데이션 부리·새싹·둥지
// - 하드 아웃라인 제거, 은은한 림 셰이딩으로 형태 유지
//
// 6 mood API 불변: hello / thinking / found / warning / cheer / sleepy
// 원칙: 법적 판단·disclaimer 카드 안에는 배치하지 않는다(신뢰 톤 유지).

import { useId } from "react";
import { m } from "framer-motion";

export type DoongiMood =
  | "hello"
  | "thinking"
  | "found"
  | "warning"
  | "cheer"
  | "sleepy";

const INK = "#3B3226"; // 눈·눈웃음
const RIM = "rgba(160, 112, 42, 0.35)"; // 은은한 림 라인

// 그라데이션 defs — useId 기반 접두사로 인스턴스별 고유 id (v7 P6)
// (display:none 조상 등에서 first-wins 참조가 깨지는 실사용 버그 방지)
function Defs({ p }: { p: string }) {
  return (
    <defs>
      <radialGradient id={`dgBody-${p}`} cx="36%" cy="28%" r="80%">
        <stop offset="0%" stopColor="#FFF9E2" />
        <stop offset="52%" stopColor="#FFE9AC" />
        <stop offset="100%" stopColor="#F2C363" />
      </radialGradient>
      <linearGradient id={`dgBeak-${p}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFC85A" />
        <stop offset="100%" stopColor="#ED8B26" />
      </linearGradient>
      <linearGradient id={`dgLeafA-${p}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7ED493" />
        <stop offset="100%" stopColor="#3E9D5C" />
      </linearGradient>
      <linearGradient id={`dgLeafB-${p}`} x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B0E8BE" />
        <stop offset="100%" stopColor="#5DBA74" />
      </linearGradient>
      <radialGradient id={`dgNest-${p}`} cx="50%" cy="12%" r="95%">
        <stop offset="0%" stopColor="#F0D9A8" />
        <stop offset="60%" stopColor="#DDB87E" />
        <stop offset="100%" stopColor="#BD8E52" />
      </radialGradient>
      <radialGradient id={`dgShadow-${p}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(96, 72, 38, 0.28)" />
        <stop offset="100%" stopColor="rgba(96, 72, 38, 0)" />
      </radialGradient>
      <radialGradient id={`dgCheek-${p}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF9E86" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#FF9E86" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Eyes({ mood }: { mood: DoongiMood }) {
  switch (mood) {
    case "hello":
    case "cheer": // 눈웃음 ^ ^
      return (
        <g stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M45 56q5-6.5 10 0" />
          <path d="M65 56q5-6.5 10 0" />
        </g>
      );
    case "sleepy":
      return (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M46 57h9" />
          <path d="M65 57h9" />
        </g>
      );
    case "thinking": // 위를 보는 광택 눈
      return (
        <g>
          <circle cx="49" cy="53" r="3.4" fill={INK} />
          <circle cx="69" cy="53" r="3.4" fill={INK} />
          <circle cx="50.2" cy="51.8" r="1.2" fill="#fff" />
          <circle cx="70.2" cy="51.8" r="1.2" fill="#fff" />
        </g>
      );
    case "warning": // 걱정 눈썹 + 광택 눈
      return (
        <g>
          <g stroke={INK} strokeWidth="2.6" strokeLinecap="round">
            <path d="M45 48.5l7.5 2.5" />
            <path d="M75 48.5l-7.5 2.5" />
          </g>
          <circle cx="51" cy="57" r="3.2" fill={INK} />
          <circle cx="69" cy="57" r="3.2" fill={INK} />
          <circle cx="52" cy="55.9" r="1.1" fill="#fff" />
          <circle cx="70" cy="55.9" r="1.1" fill="#fff" />
        </g>
      );
    default: // found — 반짝반짝 큰 눈 (이중 하이라이트)
      return (
        <g>
          <circle cx="50" cy="56" r="4.2" fill={INK} />
          <circle cx="70" cy="56" r="4.2" fill={INK} />
          <circle cx="51.5" cy="54.4" r="1.5" fill="#fff" />
          <circle cx="71.5" cy="54.4" r="1.5" fill="#fff" />
          <circle cx="48.8" cy="57.6" r="0.8" fill="#fff" opacity="0.8" />
          <circle cx="68.8" cy="57.6" r="0.8" fill="#fff" opacity="0.8" />
        </g>
      );
  }
}

function Beak({ mood, p }: { mood: DoongiMood; p: string }) {
  if (mood === "cheer" || mood === "found") {
    return (
      <g>
        <path d="M54 62.5l6-3.8 6 3.8-6 3.8z" fill={`url(#dgBeak-${p})`} />
        <path d="M55.8 66.5q4.2 4.8 8.4 0z" fill="#D96F1B" />
        <path d="M56.5 60.6l3.5-1.8" stroke="#FFE0A0" strokeWidth="1.2" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <path d="M54 62.5l6-3.8 6 3.8-6 5.3z" fill={`url(#dgBeak-${p})`} />
      <path d="M56.5 60.6l3.5-1.8" stroke="#FFE0A0" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  );
}

// 머리 위 새싹 — 시그니처 (그라데이션 + 잎맥 하이라이트)
function Sprout({ p }: { p: string }) {
  return (
    <g>
      <path
        d="M60 31q0-7 3-10"
        stroke="#4C9B62"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M63 21c-6.5-1.5-10 2-10 6.8 5 1.5 10-2 10-6.8z" fill={`url(#dgLeafA-${p})`} />
      <path d="M63 21c6.5-1.5 10 2 10 6.8-5 1.5-10-2-10-6.8z" fill={`url(#dgLeafB-${p})`} />
      <path d="M56.5 25.5q3-2 6-3.6" stroke="#EAF9EE" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <path d="M69.5 25.5q-3-2-6-3.6" stroke="#EAF9EE" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </g>
  );
}

function MoodProps({ mood, p }: { mood: DoongiMood; p: string }) {
  switch (mood) {
    case "thinking":
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <m.circle
              key={i}
              cx={86 + i * 9}
              cy={38 - i * 6}
              r={2.6 + i * 0.6}
              fill="#C79B60"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: "easeInOut",
              }}
            />
          ))}
        </g>
      );
    case "found":
      return (
        <m.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <path
            d="M90 26l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z"
            fill={`url(#dgLeafA-${p})`}
          />
          <path
            d="M28 34l1.7 4.2 4.2 1.7-4.2 1.7-1.7 4.2-1.7-4.2-4.2-1.7 4.2-1.7z"
            fill="#FFB939"
          />
        </m.g>
      );
    case "warning":
      return (
        <g>
          <path
            d="M90 23l10.5 18a3 3 0 01-2.6 4.5H77a3 3 0 01-2.6-4.5L85 23a3 3 0 015 0z"
            fill="#F6A93B"
          />
          <path
            d="M90 23l10.5 18a3 3 0 01-2.6 4.5H77a3 3 0 01-2.6-4.5L85 23a3 3 0 015 0z"
            fill={`url(#dgBeak-${p})`}
            opacity="0.35"
          />
          <rect x="85.7" y="29.5" width="3.6" height="9" rx="1.8" fill="#fff" />
          <circle cx="87.5" cy="42" r="2" fill="#fff" />
        </g>
      );
    case "cheer":
      return (
        <g>
          <m.path
            d="M27 33l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
            fill="#FF8064"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.path
            d="M92 27l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
            fill={`url(#dgLeafA-${p})`}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      );
    case "sleepy":
      return (
        <g fill="#8A653C" fontWeight="800" style={{ userSelect: "none" }}>
          <m.text
            x="82"
            y="38"
            fontSize="18"
            animate={{ opacity: [0.2, 1, 0.2], y: [40, 35, 40] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            z
          </m.text>
          <m.text
            x="95"
            y="26"
            fontSize="13"
            animate={{ opacity: [1, 0.2, 1], y: [28, 23, 28] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            z
          </m.text>
        </g>
      );
    default:
      return null;
  }
}

export default function Doongi({
  mood = "hello",
  size = 112,
  className = "",
  withNest = true,
}: {
  mood?: DoongiMood;
  size?: number;
  className?: string;
  /** false면 둥지 없이 새만 — 좁은 헤더용 */
  withNest?: boolean;
}) {
  const p = useId().replace(/:/g, "");
  const bob =
    mood === "sleepy"
      ? { y: [0, -1, 0], dur: 3.6 }
      : mood === "cheer"
        ? { y: [0, -4, 0], dur: 0.9 }
        : { y: [0, -2, 0], dur: 2.6 };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <Defs p={p} />

      {/* 바닥 그림자 — 3D 안착감 */}
      <ellipse
        cx="60"
        cy={withNest ? 107 : 92}
        rx={withNest ? 32 : 22}
        ry={withNest ? 5 : 3.5}
        fill={`url(#dgShadow-${p})`}
      />

      <m.g
        animate={{ y: bob.y }}
        transition={{ duration: bob.dur, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 날개 */}
        <m.path
          d="M32 60q-10 3-10 13 8 3 14-3.5"
          fill={`url(#dgBody-${p})`}
          stroke={RIM}
          strokeWidth="1.5"
          strokeLinejoin="round"
          animate={
            mood === "cheer"
              ? { rotate: [-24, 8, -24], y: [-6, 0, -6] }
              : undefined
          }
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "top right" }}
        />
        <m.path
          d="M88 60q10 3 10 13-8 3-14-3.5"
          fill={`url(#dgBody-${p})`}
          stroke={RIM}
          strokeWidth="1.5"
          strokeLinejoin="round"
          animate={
            mood === "hello"
              ? { rotate: [0, -36, 10, -36, 0], y: [0, -8, -2, -8, 0] }
              : mood === "cheer"
                ? { rotate: [24, -8, 24], y: [-6, 0, -6] }
                : undefined
          }
          transition={
            mood === "hello"
              ? { duration: 1.8, repeat: Infinity, repeatDelay: 1.6, ease: "easeInOut" }
              : { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
          }
          style={{ transformBox: "fill-box", transformOrigin: "top left" }}
        />

        {/* 몸통 — 라디얼 셰이딩 + 림 + 스페큘러 */}
        <circle cx="60" cy="59" r="29" fill={`url(#dgBody-${p})`} stroke={RIM} strokeWidth="1.5" />
        <ellipse cx="60" cy="71" rx="16" ry="11" fill="#FFF6D8" opacity="0.75" />
        <ellipse
          cx="47"
          cy="40"
          rx="9"
          ry="5"
          fill="#FFFFFF"
          opacity="0.55"
          transform="rotate(-24 47 40)"
        />

        <Sprout p={p} />

        {/* 홍조 — 부드러운 라디얼 */}
        <circle cx="43" cy="64" r="6" fill={`url(#dgCheek-${p})`} />
        <circle cx="77" cy="64" r="6" fill={`url(#dgCheek-${p})`} />

        <Eyes mood={mood} />
        <Beak mood={mood} p={p} />
      </m.g>

      {/* 둥지 — 그라데이션 볼 + 위빙 스트랜드 */}
      {withNest && (
        <g>
          <path
            d="M24 80c3 16 18 24 36 24s33-8 36-24c-11 5-23 7.5-36 7.5S35 85 24 80z"
            fill={`url(#dgNest-${p})`}
            stroke={RIM}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* 윗면 하이라이트 림 */}
          <path
            d="M26 81c10 4.5 21 6.5 34 6.5s24-2 34-6.5"
            stroke="#F6E5BC"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          {/* 위빙 결 — 어두운/밝은 스트랜드 교차 */}
          <g strokeLinecap="round" fill="none">
            <path d="M34 90q6 4.5 13 5" stroke="#A87B45" strokeWidth="2.2" opacity="0.7" />
            <path d="M54 96q6 1.2 12 0" stroke="#F0D9AC" strokeWidth="2" opacity="0.8" />
            <path d="M73 94q7-2.5 11-6.5" stroke="#A87B45" strokeWidth="2.2" opacity="0.7" />
            <path d="M42 94.5q5 2.5 10 3" stroke="#F0D9AC" strokeWidth="1.8" opacity="0.7" />
          </g>
        </g>
      )}
      <MoodProps mood={mood} p={p} />
    </svg>
  );
}
