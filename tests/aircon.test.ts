// 에어컨 추정 엔진 단위 테스트
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AIRCON_PROFILES,
  calculateAirconCost,
  calculateAirconUsage,
  estimateRatedInputKw,
  DEFAULT_BASELINES,
} from "../lib/electricity";
import type { AirconUsageInput } from "../lib/electricity";

const BASE: AirconUsageInput = {
  type: "wall",
  cooledAreaPyeong: 6,
  hoursPerDay: 6,
  daysPerMonth: 30,
  inverter: "unknown",
  environment: "normal",
};

function approx(actual: number, expected: number, tol = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ≈${expected}, got ${actual}`
  );
}

test("6평 벽걸이 자동 추정 정격 입력전력 ≈ 0.686kW (clamp 범위 안)", () => {
  const kw = estimateRatedInputKw("wall", 6);
  approx(kw, (6 * 0.4) / 3.5, 0.005);
  assert.ok(kw >= AIRCON_PROFILES.wall.minRatedInputKw);
  assert.ok(kw <= AIRCON_PROFILES.wall.maxRatedInputKw);
});

test("15평 스탠드 자동 추정 ≈ 1.765kW, 상한 초과·음수 없음", () => {
  const kw = estimateRatedInputKw("standing", 15);
  approx(kw, (15 * 0.4) / 3.4, 0.005);
  assert.ok(kw > 0 && kw <= AIRCON_PROFILES.standing.maxRatedInputKw);
});

test("라벨 700W 입력 시 정확히 0.7kW를 사용 (자동 추정보다 우선)", () => {
  const r = calculateAirconUsage({ ...BASE, labelPowerW: 700 });
  assert.equal(r.ratedInputKw, 0.7);
  assert.equal(r.ratedSource, "label");
});

test("사용시간 0이면 하루·월 사용량 모두 0, NaN 없음", () => {
  const r = calculateAirconUsage({ ...BASE, hoursPerDay: 0 });
  for (const s of ["low", "central", "high"] as const) {
    assert.equal(r.scenarios[s].dailyKwh, 0);
    assert.equal(r.scenarios[s].monthlyKwh, 0);
    assert.ok(Number.isFinite(r.scenarios[s].monthlyKwh));
  }
});

test("월 사용량 = 하루 사용량 × 30", () => {
  const r = calculateAirconUsage(BASE);
  approx(r.scenarios.central.monthlyKwh, r.scenarios.central.dailyKwh * 30, 1e-9);
});

test("인버터 중앙값 < 정속형 중앙값 (같은 조건)", () => {
  const inv = calculateAirconUsage({ ...BASE, inverter: "inverter" });
  const fix = calculateAirconUsage({ ...BASE, inverter: "fixed" });
  assert.ok(inv.scenarios.central.monthlyKwh < fix.scenarios.central.monthlyKwh);
});

test("harsh 환경 중앙값 > normal 환경 중앙값", () => {
  const normal = calculateAirconUsage(BASE);
  const harsh = calculateAirconUsage({ ...BASE, environment: "harsh" });
  assert.ok(harsh.scenarios.central.monthlyKwh > normal.scenarios.central.monthlyKwh);
});

test("불변식 low <= central <= high", () => {
  for (const env of ["favorable", "normal", "harsh"] as const) {
    for (const inv of ["inverter", "fixed", "unknown"] as const) {
      const r = calculateAirconUsage({ ...BASE, environment: env, inverter: inv });
      assert.ok(r.scenarios.low.monthlyKwh <= r.scenarios.central.monthlyKwh);
      assert.ok(r.scenarios.central.monthlyKwh <= r.scenarios.high.monthlyKwh);
      assert.ok(r.scenarios.low.monthlyKwh >= 0);
    }
  }
});

test("멀티형 both > standingOnly", () => {
  const solo = calculateAirconUsage({ ...BASE, type: "multi", cooledAreaPyeong: 20, multiMode: "standingOnly" });
  const both = calculateAirconUsage({ ...BASE, type: "multi", cooledAreaPyeong: 20, multiMode: "both" });
  assert.ok(both.scenarios.central.monthlyKwh > solo.scenarios.central.monthlyKwh);
});

test("멀티형 wallOnly는 벽걸이 프로필 사용", () => {
  const multiWall = calculateAirconUsage({ ...BASE, type: "multi", cooledAreaPyeong: 6, multiMode: "wallOnly" });
  const wall = calculateAirconUsage({ ...BASE, type: "wall", cooledAreaPyeong: 6 });
  approx(multiWall.ratedInputKw, wall.ratedInputKw, 1e-9);
});

test("baseline 직접 입력 시 세 시나리오 동일 baseline 사용", () => {
  const usage = calculateAirconUsage(BASE);
  const r = calculateAirconCost({ usage, month: 7, voltage: "low", baselineKwh: 320 });
  assert.equal(r.baseline.low, 320);
  assert.equal(r.baseline.central, 320);
  assert.equal(r.baseline.high, 320);
  assert.equal(r.baseline.userProvided, true);
});

test("baseline 미입력 시 150/200/250 시나리오 사용", () => {
  const usage = calculateAirconUsage(BASE);
  const r = calculateAirconCost({ usage, month: 7, voltage: "low" });
  assert.deepEqual(
    { low: r.baseline.low, central: r.baseline.central, high: r.baseline.high },
    DEFAULT_BASELINES
  );
  assert.equal(r.baseline.userProvided, false);
});

test("추가요금 불변식 low <= central <= high, 0 이상", () => {
  const usage = calculateAirconUsage({ ...BASE, hoursPerDay: 8 });
  const r = calculateAirconCost({ usage, month: 7, voltage: "low" });
  assert.ok(r.additionalCost.low <= r.additionalCost.central);
  assert.ok(r.additionalCost.central <= r.additionalCost.high);
  assert.ok(r.additionalCost.low >= 0);
});

test("사용시간 증가 시 중앙 월 사용량·추가요금 단조 비감소", () => {
  let prevKwh = -1;
  let prevCost = -1;
  for (const h of [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24]) {
    const usage = calculateAirconUsage({ ...BASE, hoursPerDay: h });
    const cost = calculateAirconCost({ usage, month: 7, voltage: "low" });
    assert.ok(usage.scenarios.central.monthlyKwh >= prevKwh, `kwh not monotonic at ${h}h`);
    assert.ok(cost.additionalCost.central >= prevCost, `cost not monotonic at ${h}h`);
    prevKwh = usage.scenarios.central.monthlyKwh;
    prevCost = cost.additionalCost.central;
  }
});

test("면적 불일치 경고: 벽걸이 15평 이상", () => {
  const r = calculateAirconUsage({ ...BASE, cooledAreaPyeong: 20 });
  assert.ok(r.warnings.length >= 1);
});
