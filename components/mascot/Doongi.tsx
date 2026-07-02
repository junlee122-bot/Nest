"use client";

// 둥이 — 둥지(Nest)의 AI 캐릭터 (v3 P2)
//
// NestMark(로고)의 새를 전신 캐릭터로 진화시킨 것. 혈통 유지 포인트:
// 동그란 몸통 + 점 눈 + 세모 부리 + 둥지 그릇 곡선(시그니처 '둥지 아크').
//
// 6 mood:
//  - hello    : 인사 (홈·온보딩) — 날개 흔들기
//  - thinking : 생각 중 (로딩) — 말줄임표 점 3개
//  - found    : 찾았다! (결과 도착) — 스파크
//  - warning  : 걱정 (안전 경고 동반 결과) — 앰버 ! 배지, 모션 절제
//  - cheer    : 축하 (복사·완료 액션) — 날개 펄럭 + 스파크
//  - sleepy   : 쉬는 중 (빈 상태) — Zz
//
// 원칙: 법적 판단·disclaimer 카드 안에는 배치하지 않는다(신뢰 톤 유지, DECISIONS.md).
// 모션은 idle 숨쉬기 + mood 소품만. reduced-motion은 MotionProvider가 전역 처리.

import { m } from "framer-motion";

export type DoongiMood =
  | "hello"
  | "thinking"
  | "found"
  | "warning"
  | "cheer"
  | "sleepy";

const PALETTE = {
  outline: "#3A2E22", // 웜 다크 (잉크보다 부드럽게)
  body: "#FFF6EA", // 크림
  cheek: "#F9C0CA",
  beak: "#F5A623",
  crest: "#E6002D", // KT 레드 — 머리 깃털 한 가닥
};

const NEST = "#A97E50"; // straw
const NEST_LIGHT = "#C9A97C";

function Eyes({ mood }: { mood: DoongiMood }) {
  const ink = PALETTE.outline;
  switch (mood) {
    case "cheer": // ^ ^ 웃는 눈
      return (
        <g stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M47 57q5-6 10 0" />
          <path d="M63 57q5-6 10 0" />
        </g>
      );
    case "sleepy": // 감은 눈
      return (
        <g stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M48 58h8" />
          <path d="M64 58h8" />
        </g>
      );
    case "thinking": // 위를 보는 눈
      return (
        <g fill={ink}>
          <circle cx="51" cy="55" r="2.8" />
          <circle cx="67" cy="55" r="2.8" />
        </g>
      );
    case "warning": // 걱정 눈썹 + 점 눈
      return (
        <g>
          <g stroke={ink} strokeWidth="2.5" strokeLinecap="round">
            <path d="M47 51.5l7 2" />
            <path d="M73 51.5l-7 2" />
          </g>
          <g fill={ink}>
            <circle cx="52" cy="59" r="2.8" />
            <circle cx="68" cy="59" r="2.8" />
          </g>
        </g>
      );
    case "found": // 반짝 큰 눈
      return (
        <g>
          <g fill={ink}>
            <circle cx="52" cy="58" r="3.6" />
            <circle cx="68" cy="58" r="3.6" />
          </g>
          <g fill="#fff">
            <circle cx="53.2" cy="56.8" r="1.2" />
            <circle cx="69.2" cy="56.8" r="1.2" />
          </g>
        </g>
      );
    default: // hello — 점 눈
      return (
        <g fill={ink}>
          <circle cx="52" cy="58" r="2.8" />
          <circle cx="68" cy="58" r="2.8" />
        </g>
      );
  }
}

function Beak({ mood }: { mood: DoongiMood }) {
  // 세모 부리 — NestMark 혈통. cheer/found는 살짝 벌림
  if (mood === "cheer" || mood === "found") {
    return (
      <g fill={PALETTE.beak}>
        <path d="M55 64l5 -1.5 5 1.5 -5 4z" />
        <path d="M56.5 66.5l3.5 4 3.5 -4z" opacity="0.85" />
      </g>
    );
  }
  return <path d="M55.5 64.5l4.5 6 4.5-6z" fill={PALETTE.beak} />;
}

function MoodProps({ mood }: { mood: DoongiMood }) {
  switch (mood) {
    case "thinking": // 말줄임표 점 3개 (순차 깜빡)
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <m.circle
              key={i}
              cx={84 + i * 9}
              cy={36 - i * 5}
              r={2.6 + i * 0.5}
              fill={NEST}
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
    case "found": // 스파크 (도착!)
      return (
        <m.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <path
            d="M88 26l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z"
            fill={PALETTE.crest}
          />
          <path d="M30 34l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill={PALETTE.beak} />
        </m.g>
      );
    case "warning": // 앰버 ! 배지 — 모션 절제(심각한 맥락)
      return (
        <g>
          <path
            d="M88 24l10 17.5a3 3 0 01-2.6 4.5H75.6a3 3 0 01-2.6-4.5L83 24a3 3 0 015 0z"
            fill={PALETTE.beak}
          />
          <rect x="84" y="30" width="3.4" height="8.5" rx="1.7" fill="#fff" />
          <circle cx="85.7" cy="42" r="1.9" fill="#fff" />
        </g>
      );
    case "cheer": // 양쪽 스파크
      return (
        <g>
          <m.path
            d="M28 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
            fill={PALETTE.crest}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.path
            d="M90 28l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
            fill={PALETTE.beak}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      );
    case "sleepy": // Zz
      return (
        <g
          fill={NEST}
          fontFamily="inherit"
          fontWeight="800"
          style={{ userSelect: "none" }}
        >
          <m.text
            x="80"
            y="38"
            fontSize="18"
            animate={{ opacity: [0.2, 1, 0.2], y: [40, 35, 40] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            z
          </m.text>
          <m.text
            x="93"
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
  /** false면 둥지(아크) 없이 새만 — 좁은 헤더용 */
  withNest?: boolean;
}) {
  const ink = PALETTE.outline;
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
      {/* ── 새 (몸통이 둥지에 살짝 안기도록 둥지보다 먼저 그림) ── */}
      <m.g
        animate={{ y: bob.y }}
        transition={{ duration: bob.dur, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 왼쪽 날개 */}
        <m.path
          d="M34 62q-10 2-11 12 8 2 13-4"
          fill={PALETTE.body}
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
          animate={
            mood === "cheer"
              ? { rotate: [-24, 8, -24], y: [-6, 0, -6] }
              : undefined
          }
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformBox: "fill-box", transformOrigin: "top right" }}
        />
        {/* 오른쪽 날개 — hello는 흔들며 인사 */}
        <m.path
          d="M86 62q10 2 11 12-8 2-13-4"
          fill={PALETTE.body}
          stroke={ink}
          strokeWidth="3"
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
        {/* 몸통 */}
        <circle cx="60" cy="62" r="27" fill={PALETTE.body} stroke={ink} strokeWidth="3.2" />
        {/* 머리 깃털 — KT 레드 한 가닥 (둥이의 시그니처) */}
        <path
          d="M60 35q-1-9 6-12"
          stroke={PALETTE.crest}
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
        {/* 볼터치 */}
        <circle cx="44" cy="66" r="4" fill={PALETTE.cheek} opacity="0.85" />
        <circle cx="76" cy="66" r="4" fill={PALETTE.cheek} opacity="0.85" />
        <Eyes mood={mood} />
        <Beak mood={mood} />
      </m.g>

      {/* ── 둥지 (시그니처 '둥지 아크') ── */}
      {withNest && (
        <g>
          <path
            d="M22 82c0 13 17 21 38 21s38-8 38-21"
            stroke={NEST}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <g stroke={NEST_LIGHT} strokeWidth="3" strokeLinecap="round" opacity="0.9">
            <path d="M26 84c4-3.5 10-4.5 15-2.5" />
            <path d="M94 84c-4-3.5-10-4.5-15-2.5" />
            <path d="M42 87c4-3 9-3 13-1" />
            <path d="M62 86.5c4-3 9-3 13-1" />
          </g>
        </g>
      )}
      <MoodProps mood={mood} />
    </svg>
  );
}
