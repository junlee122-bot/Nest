// 둥지 모션 시스템 — framer-motion 공용 variants/타이밍 (v3 P1)
//
// 원칙 (DECISIONS.md 자기비판 반영):
// - 등장 모션은 120~360ms, 과장 금지. 무한 반복은 로딩·둥이 idle에 한정.
// - reduced-motion은 MotionProvider의 <MotionConfig reducedMotion="user">가
//   전역 처리(transform 계열 자동 비활성, opacity만 유지). 개별 컴포넌트에서
//   추가 분기가 필요하면 framer-motion의 useReducedMotion()을 직접 사용.
// - LazyMotion strict 모드 → 반드시 `m.div` 등 m 컴포넌트만 사용(번들 절약).

import type { Transition, Variants } from "framer-motion";

// ── 타이밍 토큰 ──────────────────────────────────────────────
export const dur = {
  fast: 0.16,
  base: 0.28,
  slow: 0.42,
} as const;

// 부드러운 감속 (easeOutQuint 근사)
export const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1];

// 탄성 스프링 — 둥이·팝인 요소용 (과하지 않게 damping 높임)
export const springSoft: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 26,
};

// ── 공용 variants ────────────────────────────────────────────
// 사용: <m.div variants={fadeUp} initial="hidden" animate="show">
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.base, ease: easeOut },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: dur.base, ease: easeOut } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

// 부모에 걸어 자식 fadeUp/popIn을 순차 등장시키는 컨테이너
// 사용: <m.div variants={stagger()} initial="hidden" animate="show"> {children with variants}
export function stagger(delayChildren = 0.05, staggerChildren = 0.07): Variants {
  return {
    hidden: {},
    show: { transition: { delayChildren, staggerChildren } },
  };
}

// 페이지/뷰 전환용 (AnimatePresence와 함께)
export const viewSwap: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: dur.fast, ease: easeOut } },
  exit: { opacity: 0, transition: { duration: dur.fast } },
};
