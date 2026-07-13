// 에어컨 소비전력 추정 프로필 (앱 휴리스틱)
//
// ⚠ 아래 값은 "공식 제품 스펙"이 아니라 둥지 앱의 추정 기본값이다.
//    타입·평수만으로 정확한 소비전력을 알 수 없어, 낮음·중앙·높음 범위 추정에 쓴다.
//    공식 요금 데이터(tariffs.ts)와 같은 파일에 섞지 않는다.

import type {
  AirconType,
  CoolingEnvironment,
  InverterType,
  Scenario,
} from "./types";

/** 1평당 필요 냉방출력(kW) — 앱 기준 휴리스틱 */
export const COOLING_KW_PER_PYEONG = 0.4;

export interface AirconProfile {
  label: string;
  /** 냉방출력 대비 전기 입력 효율 추정치 (냉방출력 kW ÷ 이 값 = 입력 kW) */
  assumedEfficiencyRatio: number;
  minRatedInputKw: number;
  maxRatedInputKw: number;
  /** 일반적으로 권장되는 냉방 면적(평) — 면적 불일치 경고용 */
  recommendedArea: { min: number; max: number };
}

export const AIRCON_PROFILES: Record<AirconType, AirconProfile> = {
  wall: {
    label: "벽걸이형",
    assumedEfficiencyRatio: 3.5,
    minRatedInputKw: 0.42,
    maxRatedInputKw: 1.35,
    recommendedArea: { min: 4, max: 10 },
  },
  standing: {
    label: "스탠드형",
    assumedEfficiencyRatio: 3.4,
    minRatedInputKw: 1.1,
    maxRatedInputKw: 3.3,
    recommendedArea: { min: 12, max: 30 },
  },
  window: {
    label: "창문형",
    assumedEfficiencyRatio: 2.9,
    minRatedInputKw: 0.5,
    maxRatedInputKw: 1.3,
    recommendedArea: { min: 4, max: 9 },
  },
  portable: {
    label: "이동식",
    assumedEfficiencyRatio: 2.5,
    minRatedInputKw: 0.75,
    maxRatedInputKw: 1.7,
    recommendedArea: { min: 4, max: 8 },
  },
  multi: {
    label: "2 in 1·멀티형",
    assumedEfficiencyRatio: 3.3,
    minRatedInputKw: 1.4,
    maxRatedInputKw: 3.8,
    recommendedArea: { min: 15, max: 35 },
  },
};

/**
 * 멀티형 "둘 다 사용" 동시 사용 보정계수.
 * 정확한 실외기 제어 모델이 아니라 범위 추정용 앱 휴리스틱이다.
 */
export const MULTI_BOTH_MULTIPLIER = 1.25;

/** 첫 1시간 / 이후 시간의 평균 부하율 (방식별·시나리오별 앱 추정값) */
export const LOAD_FACTORS: Record<
  InverterType,
  Record<Scenario, { firstHourFactor: number; steadyFactor: number }>
> = {
  inverter: {
    low: { firstHourFactor: 0.75, steadyFactor: 0.32 },
    central: { firstHourFactor: 0.9, steadyFactor: 0.48 },
    high: { firstHourFactor: 1.0, steadyFactor: 0.68 },
  },
  fixed: {
    low: { firstHourFactor: 0.85, steadyFactor: 0.55 },
    central: { firstHourFactor: 1.0, steadyFactor: 0.72 },
    high: { firstHourFactor: 1.05, steadyFactor: 0.9 },
  },
  unknown: {
    low: { firstHourFactor: 0.8, steadyFactor: 0.42 },
    central: { firstHourFactor: 0.95, steadyFactor: 0.6 },
    high: { firstHourFactor: 1.05, steadyFactor: 0.82 },
  },
};

/** 냉방 환경 계수 (시나리오별) */
export const ENVIRONMENT_MULTIPLIERS: Record<
  CoolingEnvironment,
  Record<Scenario, number>
> = {
  favorable: { low: 0.8, central: 0.9, high: 1.0 },
  normal: { low: 0.9, central: 1.0, high: 1.15 },
  harsh: { low: 1.0, central: 1.15, high: 1.35 },
};

/** 소비전력 자체의 불확실성 계수 — 라벨 입력 시 범위가 좁아진다 */
export const POWER_UNCERTAINTY: Record<
  "estimated" | "label",
  Record<Scenario, number>
> = {
  estimated: { low: 0.85, central: 1.0, high: 1.15 },
  label: { low: 0.95, central: 1.0, high: 1.05 },
};

export const ENVIRONMENT_LABELS: Record<CoolingEnvironment, string> = {
  favorable: "그늘지고 단열이 좋은 편",
  normal: "보통",
  harsh: "햇빛이 강하거나 꼭대기층",
};

export const INVERTER_LABELS: Record<InverterType, string> = {
  inverter: "인버터형",
  fixed: "정속형",
  unknown: "방식 미확인",
};
