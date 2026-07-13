// 에어컨 추가요금 통합 계산 (순수 함수)
//
// 핵심 원칙: "에어컨 소비전력 × 평균 단가"가 아니라
// 가정 전체 누진요금의 전/후 차이(before/after)로 추가요금을 계산한다.
// 누진구간·기본요금 구간·기후환경·연료비조정·부가세·기금 변화가 모두 반영된다.

import { calculateResidentialBill, sanitizeNonNegative } from "./bill";
import type { AirconCostInput, AirconCostResult, Scenario } from "./types";

/** 평소 사용량 미입력 시 가정하는 시나리오 (kWh) */
export const DEFAULT_BASELINES = { low: 150, central: 200, high: 250 } as const;

const SCENARIOS: Scenario[] = ["low", "central", "high"];

export function calculateAirconCost(input: AirconCostInput): AirconCostResult {
  const userProvided =
    input.baselineKwh !== undefined && Number.isFinite(input.baselineKwh) && input.baselineKwh >= 0;
  const baseline = userProvided
    ? {
        low: sanitizeNonNegative(input.baselineKwh as number),
        central: sanitizeNonNegative(input.baselineKwh as number),
        high: sanitizeNonNegative(input.baselineKwh as number),
        userProvided: true,
      }
    : { ...DEFAULT_BASELINES, userProvided: false };

  const airconMonthlyKwh = {
    low: input.usage.scenarios.low.monthlyKwh,
    central: input.usage.scenarios.central.monthlyKwh,
    high: input.usage.scenarios.high.monthlyKwh,
  };

  const raw = {} as Record<Scenario, number>;
  for (const s of SCENARIOS) {
    const before = calculateResidentialBill({
      kwh: baseline[s],
      month: input.month,
      voltage: input.voltage,
    });
    const after = calculateResidentialBill({
      kwh: baseline[s] + airconMonthlyKwh[s],
      month: input.month,
      voltage: input.voltage,
    });
    raw[s] = Math.max(0, after.total - before.total);
  }

  // 불변식 low <= central <= high 보장.
  // 값을 시나리오 간에 "재배정"하면 central이 beforeBillCentral/afterBillCentral·
  // airconMonthlyKwh.central과 어긋난다(기본 baseline 200이 기타계절 1단계 경계에
  // 정확히 걸리면 central만 기본요금 점프를 맞아 high보다 커질 수 있음).
  // → central은 진짜 중앙 시나리오 값을 유지하고, low/high를 min/max로 넓힌다.
  const additional: Record<Scenario, number> = {
    low: Math.min(raw.low, raw.central, raw.high),
    central: raw.central,
    high: Math.max(raw.low, raw.central, raw.high),
  };

  const beforeBillCentral = calculateResidentialBill({
    kwh: baseline.central,
    month: input.month,
    voltage: input.voltage,
  });
  const afterBillCentral = calculateResidentialBill({
    kwh: baseline.central + airconMonthlyKwh.central,
    month: input.month,
    voltage: input.voltage,
  });

  return {
    additionalCost: additional,
    airconMonthlyKwh,
    beforeBillCentral,
    afterBillCentral,
    baseline,
  };
}
