// 냉방 소비전력 출처 우선순위 (v16) — 순수 함수, 단위 테스트 대상
//
// 계산기에 적용할 소비전력은 아래 우선순위를 따른다:
// 1. 촬영한 라벨에서 높은 신뢰도로 읽은 냉방 소비전력
// 2. 사용자가 직접 입력한 값
// 3. 공식 제조사 출처
// 4. 여러 검색 결과에서 같은 모델·같은 값 일치 (교차 확인)
// 5. 평수 기반 자동 추정 (기본)
//
// 쇼핑 상품 제목·가격·냉방 면적으로 소비전력을 추측/역산하지 않는다.

import type { CoolingPowerSource } from "./types";

/** 라벨 판독을 신뢰해 자동 적용할 최소 신뢰도 */
export const LABEL_POWER_MIN_CONFIDENCE = 0.7;

export interface PowerCandidates {
  /** 라벨 사진 판독값 + 신뢰도 (0~1) */
  labelPhoto?: { watts: number; confidence: number } | null;
  /** 사용자가 직접 입력한 값 */
  userInput?: number | null;
  /** 공식 제조사 출처에서 확인한 값 */
  manufacturer?: number | null;
  /** 여러 검색 결과에서 같은 모델·같은 값으로 일치한 값 */
  crossChecked?: number | null;
}

export interface ResolvedPower {
  watts: number | null;
  source: CoolingPowerSource;
}

const valid = (w: number | null | undefined): w is number =>
  typeof w === "number" && Number.isFinite(w) && w >= 100 && w <= 5000;

/** 우선순위대로 소비전력과 출처를 결정. 아무것도 없으면 평수 추정(area-estimate). */
export function resolveCoolingPower(c: PowerCandidates): ResolvedPower {
  if (
    c.labelPhoto &&
    valid(c.labelPhoto.watts) &&
    c.labelPhoto.confidence >= LABEL_POWER_MIN_CONFIDENCE
  ) {
    return { watts: c.labelPhoto.watts, source: "label-photo" };
  }
  if (valid(c.userInput)) return { watts: c.userInput, source: "user-input" };
  if (valid(c.manufacturer)) return { watts: c.manufacturer, source: "manufacturer" };
  if (valid(c.crossChecked)) return { watts: c.crossChecked, source: "cross-checked-search" };
  return { watts: null, source: "area-estimate" };
}

/** 결과 카드용 출처 문구 — "제품 라벨 650W 반영" / "평수 기준 자동 추정" */
export function powerSourceText(source: CoolingPowerSource, watts: number | null): string {
  if (source === "area-estimate" || watts === null) return "평수 기준 자동 추정";
  const w = `${Math.round(watts).toLocaleString("ko-KR")}W`;
  switch (source) {
    case "label-photo":
      return `제품 라벨 ${w} 반영`;
    case "user-input":
      return `직접 입력한 ${w} 반영`;
    case "manufacturer":
      return `제조사 사양 ${w} 반영`;
    case "cross-checked-search":
      return `검색 교차 확인 ${w} 반영`;
  }
}

// POWER_SOURCE_LABELS 재노출 (컴포넌트에서 types 직접 임포트 없이 쓰도록)
export type { CoolingPowerSource };
export { POWER_SOURCE_LABELS } from "./types";
