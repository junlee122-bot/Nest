// 한전 주택용 전기요금 순수 계산 엔진
//
// - 같은 입력 → 항상 같은 출력 (Date/window/localStorage에 의존하지 않음)
// - 요금 상수는 tariffs.ts 한 곳에서만 온다
// - 제외 항목: TV 수신료, 각종 할인(복지·대가족·자동이체 등), 공동주택 공용 전기,
//   1주택 수가구, 태양광 상계, 제주 계시별 등 개별 계약 조건

import { TARIFF } from "./tariffs";
import type {
  ResidentialBillBreakdown,
  ResidentialBillInput,
  VoltageType,
} from "./types";

// ── 숫자 안전 헬퍼 ───────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** finite가 아니거나 음수인 입력을 안전한 값으로 정리 */
export function sanitizeNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

/** 원 미만 절사 */
export function truncateToWon(value: number): number {
  return Math.floor(value);
}

/** 10원 미만 절사 */
export function truncateToTenWon(value: number): number {
  return Math.floor(value / 10) * 10;
}

/** 부가가치세: 전기요금계의 10%, 원 단위 4사5입 (부동소수점 안전) */
export function roundKepcoVat(electricityCharge: number): number {
  return Math.floor(electricityCharge * TARIFF.vatRate + 0.5);
}

/** 전력산업기반기금: 전기요금계의 2.7%, 10원 미만 절사 */
export function powerIndustryFund(electricityCharge: number): number {
  return Math.floor((electricityCharge * TARIFF.powerFundRate) / 10) * 10;
}

// ── 누진구간 ────────────────────────────────────────────────

export function isSummerMonth(month: number): boolean {
  return (TARIFF.summerMonths as readonly number[]).includes(month);
}

export function getResidentialThresholds(month: number): {
  first: number;
  second: number;
  superUser: number;
} {
  const t = isSummerMonth(month) ? TARIFF.thresholds.summer : TARIFF.thresholds.other;
  return { first: t.first, second: t.second, superUser: TARIFF.superUser.thresholdKwh };
}

/** 사용량이 속한 구간 (1~3 = 누진 단계, 4 = 슈퍼유저 초과) */
export function getResidentialTier(kwh: number, month: number): 1 | 2 | 3 | 4 {
  const safe = sanitizeNonNegative(kwh);
  const t = getResidentialThresholds(month);
  if (isSuperUserMonth(month) && safe > t.superUser) return 4;
  if (safe <= t.first) return 1;
  if (safe <= t.second) return 2;
  return 3;
}

export function isSuperUserMonth(month: number): boolean {
  return (TARIFF.superUser.months as readonly number[]).includes(month);
}

/** 전력량요금(누진 분할 합산, 원 미만 절사 전의 원시값) */
export function calculateProgressiveEnergyCharge(
  kwh: number,
  month: number,
  voltage: VoltageType
): number {
  const safe = sanitizeNonNegative(kwh);
  const t = getResidentialThresholds(month);
  const rates = TARIFF.byVoltage[voltage].energyRates;

  const tier1Kwh = Math.min(safe, t.first);
  const tier2Kwh = Math.min(Math.max(safe - t.first, 0), t.second - t.first);
  let tier3Kwh = Math.max(safe - t.second, 0);
  let superKwh = 0;

  if (isSuperUserMonth(month) && safe > t.superUser) {
    superKwh = safe - t.superUser;
    tier3Kwh = t.superUser - t.second;
  }

  return (
    tier1Kwh * rates[0] +
    tier2Kwh * rates[1] +
    tier3Kwh * rates[2] +
    superKwh * TARIFF.superUser.ratePerKwh[voltage]
  );
}

// ── 청구액 ──────────────────────────────────────────────────

function sanitizeMonth(month: number): number {
  if (!Number.isFinite(month)) return 1;
  return clamp(Math.round(month), 1, 12);
}

export function calculateResidentialBill(
  input: ResidentialBillInput
): ResidentialBillBreakdown {
  const kwh = sanitizeNonNegative(input.kwh);
  const month = sanitizeMonth(input.month);
  const voltage: VoltageType = input.voltage === "high" ? "high" : "low";

  const thresholds = getResidentialThresholds(month);
  const tier = getResidentialTier(kwh, month);
  const basicTierIndex = Math.min(tier, 3) - 1;

  const basicCharge = truncateToWon(TARIFF.byVoltage[voltage].basicCharge[basicTierIndex]);
  const energyCharge = truncateToWon(calculateProgressiveEnergyCharge(kwh, month, voltage));
  const climateCharge = truncateToWon(kwh * TARIFF.climatePerKwh);
  const fuelAdjustmentCharge = truncateToWon(kwh * TARIFF.fuelAdjustmentPerKwh);

  const electricityCharge =
    basicCharge + energyCharge + climateCharge + fuelAdjustmentCharge;

  const vat = roundKepcoVat(electricityCharge);
  const fund = powerIndustryFund(electricityCharge);
  const total = truncateToTenWon(electricityCharge + vat + fund);

  return {
    kwh,
    month,
    voltage,
    season: isSummerMonth(month) ? "summer" : "other",
    tier,
    thresholds,
    basicCharge,
    energyCharge,
    climateCharge,
    fuelAdjustmentCharge,
    electricityCharge,
    vat,
    powerIndustryFund: fund,
    total,
    tariffId: TARIFF.id,
    verifiedAt: TARIFF.verifiedAt,
  };
}

/** 평소 사용량에 추가 사용량을 더했을 때 늘어나는 청구액 (전후 차이) */
export function calculateAdditionalBillCost(input: {
  baselineKwh: number;
  additionalKwh: number;
  month: number;
  voltage: VoltageType;
}): number {
  const before = calculateResidentialBill({
    kwh: input.baselineKwh,
    month: input.month,
    voltage: input.voltage,
  });
  const after = calculateResidentialBill({
    kwh: sanitizeNonNegative(input.baselineKwh) + sanitizeNonNegative(input.additionalKwh),
    month: input.month,
    voltage: input.voltage,
  });
  return Math.max(0, after.total - before.total);
}
