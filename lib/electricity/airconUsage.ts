// 에어컨 전력량 추정 (앱 추정 모델 — 순수 함수)
//
// 흐름: 평수 → 필요 냉방출력 → 유형별 효율로 입력전력 추정 → 유형별 현실 범위로 clamp
//       → (라벨 소비전력이 있으면 그 값이 우선) → 부하율·환경·불확실성 계수로
//       낮음·중앙·높음 시나리오의 하루/월 사용량 계산.

import {
  AIRCON_PROFILES,
  COOLING_KW_PER_PYEONG,
  ENVIRONMENT_MULTIPLIERS,
  LOAD_FACTORS,
  MULTI_BOTH_MULTIPLIER,
  POWER_UNCERTAINTY,
} from "./airconProfiles";
import { clamp, sanitizeNonNegative } from "./bill";
import type {
  AirconType,
  AirconUsageInput,
  AirconUsageResult,
  MultiMode,
  Scenario,
} from "./types";

const SCENARIOS: Scenario[] = ["low", "central", "high"];

/** 멀티 모드 반영: 실제 계산에 쓸 프로필 타입과 동시 사용 계수 */
function resolveMultiMode(
  type: AirconType,
  multiMode: MultiMode | undefined
): { profileType: AirconType; modeMultiplier: number } {
  if (type !== "multi") return { profileType: type, modeMultiplier: 1 };
  const mode = multiMode ?? "standingOnly";
  if (mode === "wallOnly") return { profileType: "wall", modeMultiplier: 1 };
  if (mode === "both") return { profileType: "multi", modeMultiplier: MULTI_BOTH_MULTIPLIER };
  return { profileType: "multi", modeMultiplier: 1 };
}

/** 평수 기반 정격 입력전력 추정(kW) — 프로필 범위로 clamp */
export function estimateRatedInputKw(type: AirconType, cooledAreaPyeong: number): number {
  const profile = AIRCON_PROFILES[type];
  const area = sanitizeNonNegative(cooledAreaPyeong);
  const requiredCoolingKw = area * COOLING_KW_PER_PYEONG;
  const raw = requiredCoolingKw / profile.assumedEfficiencyRatio;
  return clamp(raw, profile.minRatedInputKw, profile.maxRatedInputKw);
}

/** 면적-유형 불일치 비차단 경고 */
export function areaMismatchWarnings(input: {
  type: AirconType;
  multiMode?: MultiMode;
  cooledAreaPyeong: number;
}): string[] {
  const warnings: string[] = [];
  const area = sanitizeNonNegative(input.cooledAreaPyeong);
  if (input.type === "wall" && area >= 15) {
    warnings.push(
      "이 평수는 일반적인 벽걸이형 한 대로 냉방하기 어려울 수 있어요. 실제 제품 소비전력을 입력하면 더 정확해요."
    );
  }
  if (input.type === "window" && area >= 10) {
    warnings.push("창문형은 제품별 냉방 가능 면적 차이가 커요. 제품 라벨을 확인해주세요.");
  }
  if (input.type === "portable" && area >= 10) {
    warnings.push(
      "이동식은 배기 호스와 창문 틈 상태에 따라 소비량 차이가 커질 수 있어요."
    );
  }
  if (input.type === "standing" && area <= 6) {
    warnings.push(
      "작은 공간에서는 설정 온도에 빠르게 도달해 실제 평균 소비량이 낮아질 수 있어요."
    );
  }
  if (input.type === "multi" && (input.multiMode ?? "standingOnly") === "both") {
    warnings.push(
      "실외기 용량과 두 실내기의 동시 운전에 따라 실제 소비량 차이가 커질 수 있어요."
    );
  }
  return warnings;
}

export function calculateAirconUsage(input: AirconUsageInput): AirconUsageResult {
  const hoursPerDay = clamp(sanitizeNonNegative(input.hoursPerDay), 0, 24);
  const daysPerMonth = clamp(sanitizeNonNegative(input.daysPerMonth), 0, 31);

  const { profileType, modeMultiplier } = resolveMultiMode(input.type, input.multiMode);

  const labelKw =
    input.labelPowerW !== undefined && Number.isFinite(input.labelPowerW) && input.labelPowerW > 0
      ? input.labelPowerW / 1000
      : undefined;

  const ratedSource: "label" | "estimated" = labelKw !== undefined ? "label" : "estimated";
  const ratedInputKw =
    labelKw !== undefined
      ? labelKw
      : estimateRatedInputKw(profileType, input.cooledAreaPyeong);

  const firstHour = Math.min(hoursPerDay, 1);
  const remainingHours = Math.max(hoursPerDay - 1, 0);

  const scenarios = {} as AirconUsageResult["scenarios"];
  for (const s of SCENARIOS) {
    const load = LOAD_FACTORS[input.inverter][s];
    const env = ENVIRONMENT_MULTIPLIERS[input.environment][s];
    const powerMult = POWER_UNCERTAINTY[ratedSource][s];
    const dailyRaw =
      ratedInputKw *
      powerMult *
      (firstHour * load.firstHourFactor + remainingHours * load.steadyFactor) *
      env *
      modeMultiplier;
    const dailyKwh = sanitizeNonNegative(dailyRaw);
    scenarios[s] = { dailyKwh, monthlyKwh: dailyKwh * daysPerMonth };
  }

  // 불변식 보장: low <= central <= high (부동소수점 예외 방지용 정렬)
  const monthly = SCENARIOS.map((s) => scenarios[s].monthlyKwh).sort((a, b) => a - b);
  const daily = SCENARIOS.map((s) => scenarios[s].dailyKwh).sort((a, b) => a - b);
  SCENARIOS.forEach((s, i) => {
    scenarios[s] = { dailyKwh: daily[i], monthlyKwh: monthly[i] };
  });

  return {
    ratedInputKw,
    ratedSource,
    scenarios,
    warnings: areaMismatchWarnings(input),
  };
}
