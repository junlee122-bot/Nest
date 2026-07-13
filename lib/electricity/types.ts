// 전기요금 계산기 공통 타입 (v15)
// 이 모듈은 순수 계산 엔진용 — React/브라우저 API에 의존하지 않는다.

export type VoltageType = "low" | "high";

export type AirconType = "wall" | "standing" | "window" | "portable" | "multi";

/** 2 in 1(멀티형) 사용 방식 */
export type MultiMode = "standingOnly" | "wallOnly" | "both";

export type InverterType = "inverter" | "fixed" | "unknown";

export type CoolingEnvironment = "favorable" | "normal" | "harsh";

export type Scenario = "low" | "central" | "high";

// ── 한전 주택용 요금 ─────────────────────────────────────────

export interface ResidentialBillInput {
  kwh: number;
  month: number; // 1~12
  voltage: VoltageType;
}

export interface ResidentialBillBreakdown {
  kwh: number;
  month: number;
  voltage: VoltageType;
  season: "summer" | "other";
  /** 1~3 = 누진 단계, 4 = 슈퍼유저 구간 진입 */
  tier: 1 | 2 | 3 | 4;
  thresholds: { first: number; second: number; superUser: number };
  basicCharge: number;
  energyCharge: number;
  climateCharge: number;
  fuelAdjustmentCharge: number;
  /** 전기요금계 = 기본 + 전력량 + 기후 + 연료 */
  electricityCharge: number;
  vat: number;
  powerIndustryFund: number;
  /** 최종 청구 예상액 (10원 미만 절사) */
  total: number;
  tariffId: string;
  verifiedAt: string;
}

// ── 에어컨 사용량 추정 ────────────────────────────────────────

export interface AirconUsageInput {
  type: AirconType;
  /** type === "multi" 일 때만 의미 있음. 기본 standingOnly */
  multiMode?: MultiMode;
  cooledAreaPyeong: number;
  hoursPerDay: number;
  daysPerMonth: number;
  /** 제품 라벨의 냉방 소비전력(W). 있으면 평수 기반 추정보다 우선 */
  labelPowerW?: number;
  inverter: InverterType;
  environment: CoolingEnvironment;
}

export interface AirconScenarioUsage {
  dailyKwh: number;
  monthlyKwh: number;
}

export interface AirconUsageResult {
  /** 계산에 사용한 정격 입력전력(kW, 중앙 기준) */
  ratedInputKw: number;
  ratedSource: "label" | "estimated";
  scenarios: Record<Scenario, AirconScenarioUsage>;
  /** 면적-유형 불일치 등 비차단 경고 문구 */
  warnings: string[];
}

// ── 추가요금 통합 ─────────────────────────────────────────────

export interface AirconCostInput {
  usage: AirconUsageResult;
  month: number;
  voltage: VoltageType;
  /** 평소 월 전력 사용량(kWh). 없으면 150/200/250 시나리오 가정 */
  baselineKwh?: number;
}

export interface AirconCostResult {
  additionalCost: Record<Scenario, number>;
  airconMonthlyKwh: Record<Scenario, number>;
  /** 중앙 시나리오의 전/후 고지서 (누진 카드·상세용) */
  beforeBillCentral: ResidentialBillBreakdown;
  afterBillCentral: ResidentialBillBreakdown;
  baseline: { low: number; central: number; high: number; userProvided: boolean };
}
