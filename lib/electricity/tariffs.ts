// 한국 주택용 전기요금 스냅샷 (공식 요금 데이터)
//
// ⚠ 이 파일은 "공식 요금표의 앱 내 스냅샷"만 담는다.
//    에어컨 소비전력 추정 같은 앱 휴리스틱은 airconProfiles.ts에 분리한다.
// ⚠ 요금이 개정되면 이 파일 하나만 갱신한다 (UI/엔진에 단가를 복사하지 말 것).

import type { VoltageType } from "./types";

export const TARIFF = {
  id: "kr-residential-2026-q3",
  label: "2026년 3분기 주택용 전력 기준",
  verifiedAt: "2026-07-13",
  sourceLabels: [
    "한전ON 한글 전기요금표",
    "한전ON 전기요금 계산기",
    "2026년 3분기 연료비조정단가 공지",
  ],

  // 공통 부가 단가 (원/kWh)
  climatePerKwh: 9.0,
  fuelAdjustmentPerKwh: 5.0,
  // 세율
  vatRate: 0.1,
  powerFundRate: 0.027,

  // 누진구간 (kWh)
  thresholds: {
    other: { first: 200, second: 400 },
    summer: { first: 300, second: 450 },
  },
  summerMonths: [7, 8],

  // 슈퍼유저 (초과분 단가)
  superUser: {
    thresholdKwh: 1000,
    months: [1, 2, 7, 8, 12],
    ratePerKwh: { low: 736.2, high: 601.3 },
  },

  // 전압별 기본요금(원)·전력량요금(원/kWh)
  byVoltage: {
    low: {
      basicCharge: [910, 1600, 7300],
      energyRates: [120.0, 214.6, 307.3],
    },
    high: {
      basicCharge: [730, 1260, 6060],
      energyRates: [105.0, 174.0, 242.3],
    },
  },
} as const;

export type Tariff = typeof TARIFF;

export function voltageLabel(v: VoltageType): string {
  return v === "low" ? "주택용 저압" : "주택용 고압";
}
