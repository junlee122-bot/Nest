// 한전 주택용 요금 엔진 단위 테스트
// 전제: 기후환경 9원/kWh, 연료비조정 +5원/kWh, VAT 10%(4사5입),
//       기금 2.7%(10원 절사), 최종 10원 절사, 할인·TV수신료 제외.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateResidentialBill,
  calculateAdditionalBillCost,
  getResidentialTier,
  getResidentialThresholds,
} from "../lib/electricity";

test("저압 7월 300kWh — 하계 1단계 정확값", () => {
  const b = calculateResidentialBill({ kwh: 300, month: 7, voltage: "low" });
  assert.equal(b.season, "summer");
  assert.equal(b.tier, 1);
  assert.equal(b.basicCharge, 910);
  assert.equal(b.energyCharge, 36000);
  assert.equal(b.climateCharge, 2700);
  assert.equal(b.fuelAdjustmentCharge, 1500);
  assert.equal(b.total, 46320);
});

test("저압 7월 350kWh — 하계 2단계 정확값", () => {
  const b = calculateResidentialBill({ kwh: 350, month: 7, voltage: "low" });
  assert.equal(b.tier, 2);
  assert.equal(b.basicCharge, 1600);
  assert.equal(b.energyCharge, 46730);
  assert.equal(b.total, 59980);
});

test("저압 3월 250kWh — 기타계절 2단계 정확값", () => {
  const b = calculateResidentialBill({ kwh: 250, month: 3, voltage: "low" });
  assert.equal(b.season, "other");
  assert.equal(b.tier, 2);
  assert.equal(b.basicCharge, 1600);
  assert.equal(b.energyCharge, 34730);
  assert.equal(b.total, 44880);
});

test("고압 7월 450kWh — 하계 2단계 정확값", () => {
  const b = calculateResidentialBill({ kwh: 450, month: 7, voltage: "high" });
  assert.equal(b.tier, 2);
  assert.equal(b.basicCharge, 1260);
  assert.equal(b.energyCharge, 57600);
  assert.equal(b.total, 73420);
});

test("저압 7월 1,001kWh — 슈퍼유저 초과분 단가", () => {
  const b = calculateResidentialBill({ kwh: 1001, month: 7, voltage: "low" });
  assert.equal(b.tier, 4);
  assert.equal(b.energyCharge, 237941);
  assert.equal(b.total, 292170);
});

test("추가요금: 저압 7월 200kWh + 100kWh = 15,100원", () => {
  const before = calculateResidentialBill({ kwh: 200, month: 7, voltage: "low" });
  const after = calculateResidentialBill({ kwh: 300, month: 7, voltage: "low" });
  assert.equal(before.total, 31220);
  assert.equal(after.total, 46320);
  assert.equal(
    calculateAdditionalBillCost({ baselineKwh: 200, additionalKwh: 100, month: 7, voltage: "low" }),
    15100
  );
});

// ── 누진 경계 ────────────────────────────────────────────────

test("하계 경계: 300kWh는 1단계, 300.5kWh는 2단계 기본요금", () => {
  assert.equal(getResidentialTier(300, 7), 1);
  assert.equal(calculateResidentialBill({ kwh: 300, month: 8, voltage: "low" }).basicCharge, 910);
  assert.equal(getResidentialTier(300.5, 7), 2);
  assert.equal(
    calculateResidentialBill({ kwh: 300.5, month: 7, voltage: "low" }).basicCharge,
    1600
  );
});

test("하계 경계: 450kWh는 2단계, 초과 시 3단계 기본요금", () => {
  assert.equal(getResidentialTier(450, 7), 2);
  assert.equal(getResidentialTier(451, 7), 3);
  assert.equal(
    calculateResidentialBill({ kwh: 451, month: 7, voltage: "low" }).basicCharge,
    7300
  );
});

test("기타계절 경계: 200/400kWh", () => {
  assert.equal(getResidentialTier(200, 3), 1);
  assert.equal(getResidentialTier(201, 3), 2);
  assert.equal(getResidentialTier(400, 3), 2);
  assert.equal(getResidentialTier(401, 3), 3);
});

test("비슈퍼유저 월(3월) 1,001kWh는 일반 3단계 단가 유지", () => {
  const b = calculateResidentialBill({ kwh: 1001, month: 3, voltage: "low" });
  assert.equal(b.tier, 3);
  // 200×120 + 200×214.6 + 601×307.3 = 24,000 + 42,920 + 184,687.3 → 절사 251,607
  assert.equal(b.energyCharge, 251607);
});

test("고압 슈퍼유저 단가 분리 (7월 1,100kWh)", () => {
  const b = calculateResidentialBill({ kwh: 1100, month: 7, voltage: "high" });
  assert.equal(b.tier, 4);
  // 300×105 + 150×174 + 550×242.3 + 100×601.3
  // = 31,500 + 26,100 + 133,265 + 60,130 = 251,995 → -4 없음, 절사 250,995? 재계산:
  // 31,500 + 26,100 = 57,600; +133,265 = 190,865; +60,130 = 250,995
  assert.equal(b.energyCharge, 250995);
});

test("소수 kWh 입력에서 NaN 없음", () => {
  const b = calculateResidentialBill({ kwh: 299.999999, month: 7, voltage: "low" });
  assert.ok(Number.isFinite(b.total));
  assert.equal(b.tier, 1);
});

test("음수·비유한 사용량은 0으로 sanitize", () => {
  const neg = calculateResidentialBill({ kwh: -50, month: 7, voltage: "low" });
  assert.equal(neg.kwh, 0);
  assert.ok(Number.isFinite(neg.total));
  const inf = calculateResidentialBill({ kwh: Infinity, month: 7, voltage: "low" });
  assert.equal(inf.kwh, 0);
});

test("누진 기준선: 하계 300/450, 기타 200/400", () => {
  assert.deepEqual(getResidentialThresholds(7), { first: 300, second: 450, superUser: 1000 });
  assert.deepEqual(getResidentialThresholds(9), { first: 200, second: 400, superUser: 1000 });
});
