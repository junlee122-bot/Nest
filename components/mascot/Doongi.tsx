"use client";

// 둥이 v2 — 둥지(Nest)의 AI 캐릭터 (v4 민트 가든 리디자인)
//
// 공모전 교육자료 레퍼런스(플랫 파스텔 + 새싹 캐릭터) 무드로 전면 리디자인:
// - 플랫 컬러 + 얇은 웜 아웃라인, 큰 홍조, 둥근 실루엣
// - 머리의 '새싹'이 시그니처 — 브랜드 그린이자 '둥지 키우기' 성장 테마
// - 병아리 + 둥지 모티프는 유지 (서비스 정체성)
//
// 6 mood (API 불변):
//  - hello    : 인사 (홈·온보딩) — 눈웃음 + 날개 흔들기
//  - thinking : 생각 중 (로딩) — 말줄임표 점 3개
//  - found    : 찾았다! (결과 도착) — 반짝 큰 눈 + 스파클
//  - warning  : 걱정 (안전 경고 동반) — 앰버 ! 배지, 모션 절제
//  - cheer    : 축하 (완료) — 눈웃음 + 벌린 부리 + 날개 펄럭
//  - sleepy   : 쉬는 중 — Zz
//
// 원칙: 법적 판단·disclaimer 카드 안에는 배치하지 않는다(신뢰 톤 유지).

import { m } from "framer-motion";

export type DoongiMood =
  | "hello"
  | "thinking"
  | "found"
  | "warning"
  | "cheer"
  | "sleepy";

const C = {
  outline: "#4A4237", // 얇은 웜 아웃라인
  body: "#FFE9B4", // 병아리 크림 옐로우
  belly: "#FFF6DC",
  cheek: "#FFC2B0", // 코랄 홍조
  beak: "#FFA53E",
  beakOpen: "#F08A2C",
  sprout: "#45A567", // 새싹 — 브랜드 그린
  sproutLight: "#7BC98F",
  sproutStem: "#38905A",
  nestFill: "#EBCFA0",
  nestLine: "#C89B62",
  sun: "#FFB939",
  coral: "#FF8064",
  zzz: "#8A653C",
};

function Eyes({ mood }: { mood: DoongiMood }) {
  switch (mood) {
    case "hello":
    case "cheer": // 눈웃음 ^ ^
      return (
        <g stroke={C.outline} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M45 56q5-6 10 0" />
          <path d="M65 56q5-6 10 0" />
        </g>
      );
    case "sleepy": // 감은 눈
      return (
        <g stroke={C.outline} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M46 57h9" />
          <path d="M65 57h9" />
        </g>
      );
    case "thinking": // 위를 보는 점 눈
      return (
        <g fill={C.outline}>
          <circle cx="49" cy="53" r="3" />
          <circle cx="69" cy="53" r="3" />
        </g>
      );
    case "warning": // 걱정 눈썹 + 점 눈
      return (
        <g>
          <g stroke={C.outline} strokeWidth="2.5" strokeLinecap="round">
            <path d="M45 48.5l7.5 2.5" />
            <path d="M75 48.5l-7.5 2.5" />
          </g>
          <g fill={C.outline}>
            <circle cx="51" cy="57" r="3" />
            <circle cx="69" cy="57" r="3" />
          </g>
        </g>
      );
    default: // found — 반짝 큰 눈
      return (
        <g>
          <g fill={C.outline}>
            <circle cx="50" cy="56" r="3.8" />
            <circle cx="70" cy="56" r="3.8" />
          </g>
          <g fill="#fff">
            <circle cx="51.3" cy="54.6" r="1.3" />
            <circle cx="71.3" cy="54.6" r="1.3" />
          </g>
        </g>
      );
  }
}

function Beak({ mood }: { mood: DoongiMood }) {
  if (mood === "cheer" || mood === "found") {
    // 벌린 부리 — 신나는 표정
    return (
      <g>
        <path d="M54.5 62.5l5.5-3.5 5.5 3.5-5.5 3.5z" fill={C.beak} />
        <path d="M56 66.5q4 4.5 8 0z" fill={C.beakOpen} />
      </g>
    );
  }
  return <path d="M54.5 62.5l5.5-3.5 5.5 3.5-5.5 5z" fill={C.beak} />;
}

// 머리 위 새싹 — 둥이의 시그니처 (성장 테마)
function Sprout() {
  return (
    <g>
      <path
        d="M60 31q0-7 3-10"
        stroke={C.sproutStem}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M63 21c-6-1.5-9.5 2-9.5 6.5 4.5 1.5 9.5-2 9.5-6.5z" fill={C.sprout} />
      <path d="M63 21c6-1.5 9.5 2 9.5 6.5-4.5 1.5-9.5-2-9.5-6.5z" fill={C.sproutLight} />
    </g>
  );
}

function MoodProps({ mood }: { mood: DoongiMood }) {
  switch (mood) {
    case "thinking": // 말줄임표 점 3개
      return (
        <g>
          {[0, 1, 2].map((i) => (
            <m.circle
              key={i}
              cx={86 + i * 9}
              cy={38 - i * 6}
              r={2.6 + i * 0.6}
              fill={C.nestLine}
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
    case "found": // 그린+앰버 스파클
      return (
        <m.g
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <path
            d="M90 26l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z"
            fill={C.sprout}
          />
          <path d="M28 34l1.7 4.2 4.2 1.7-4.2 1.7-1.7 4.2-1.7-4.2-4.2-1.7 4.2-1.7z" fill={C.sun} />
        </m.g>
      );
    case "warning": // 앰버 ! 배지 — 모션 절제
      return (
        <g>
          <path
            d="M90 23l10.5 18a3 3 0 01-2.6 4.5H77a3 3 0 01-2.6-4.5L85 23a3 3 0 015 0z"
            fill={C.sun}
          />
          <rect x="85.7" y="29.5" width="3.6" height="9" rx="1.8" fill="#fff" />
          <circle cx="87.5" cy="42" r="2" fill="#fff" />
        </g>
      );
    case "cheer": // 양쪽 스파클 (그린 + 코랄)
      return (
        <g>
          <m.path
            d="M27 33l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
            fill={C.coral}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <m.path
            d="M92 27l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"
            fill={C.sprout}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      );
    case "sleepy": // Zz
      return (
        <g fill={C.zzz} fontWeight="800" style={{ userSelect: "none" }}>
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
      <m.g
        animate={{ y: bob.y }}
        transition={{ duration: bob.dur, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 왼쪽 날개 */}
        <m.path
          d="M32 60q-10 3-10 13 8 3 14-3.5"
          fill={C.body}
          stroke={C.outline}
          strokeWidth="2.5"
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
          d="M88 60q10 3 10 13-8 3-14-3.5"
          fill={C.body}
          stroke={C.outline}
          strokeWidth="2.5"
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
        {/* 몸통 + 배 */}
        <circle cx="60" cy="59" r="29" fill={C.body} stroke={C.outline} strokeWidth="2.5" />
        <ellipse cx="60" cy="70" rx="16" ry="12" fill={C.belly} />
        <Sprout />
        {/* 홍조 */}
        <circle cx="43" cy="64" r="4.5" fill={C.cheek} />
        <circle cx="77" cy="64" r="4.5" fill={C.cheek} />
        <Eyes mood={mood} />
        <Beak mood={mood} />
      </m.g>

      {/* 둥지 — 플랫 볼 + 위빙 라인 */}
      {withNest && (
        <g>
          <path
            d="M24 80c3 16 18 24 36 24s33-8 36-24c-11 5-23 7.5-36 7.5S35 85 24 80z"
            fill={C.nestFill}
            stroke={C.nestLine}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <g stroke={C.nestLine} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M36 90q5 4 11 4.5" />
            <path d="M55 95.5q5 1 10 0" />
            <path d="M73 94q6-2 10-6" />
          </g>
        </g>
      )}
      <MoodProps mood={mood} />
    </svg>
  );
}
