// 내 에어컨 찾기 (v16) — 정규화·점수화·소비전력 우선순위·판독 정제 테스트
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  modelsMatch,
  modelsPartialMatch,
  normalizeModelNumber,
  scrubSerial,
  stripHtml,
} from "../lib/aircon/normalize";
import { detectProductType, rankCandidates, type RawSearchItem } from "../lib/aircon/search";
import { LABEL_POWER_MIN_CONFIDENCE, powerSourceText, resolveCoolingPower } from "../lib/aircon/power";
import { sanitizeIdentification } from "../lib/aircon/identify";

/* ── 1. 모델번호 정규화 ── */
test("모델번호 정규화 — 공백·하이픈·대소문자·특수문자", () => {
  assert.equal(normalizeModelNumber("SQ07EJ1WAS"), "SQ07EJ1WAS");
  assert.equal(normalizeModelNumber("sq07 ej1-was"), "SQ07EJ1WAS");
  assert.equal(normalizeModelNumber("  AR07-C9150 / HZS "), "AR07C9150HZS");
  assert.equal(normalizeModelNumber(null), "");
  assert.ok(modelsMatch("SQ07EJ1WAS", "sq07-ej1 was"));
  assert.ok(!modelsMatch("", ""));
  assert.ok(!modelsMatch("SQ07EJ1WAS", "SQ09EJ1WAS"));
});

test("HTML 태그 제거 — 네이버 검색 title의 <b> 마크업", () => {
  assert.equal(stripHtml("<b>LG</b> 휘센 <b>SQ07EJ1WAS</b> 에어컨"), "LG 휘센 SQ07EJ1WAS 에어컨");
  assert.equal(stripHtml("가격 &lt;특가&gt; &amp; 무료설치"), "가격 <특가> & 무료설치");
});

test("부분 일치 — 완전 일치는 부분 일치가 아니다", () => {
  assert.ok(modelsPartialMatch("SQ07EJ1", "SQ07EJ1WAS"));
  assert.ok(!modelsPartialMatch("SQ07EJ1WAS", "SQ07EJ1WAS"));
  assert.ok(!modelsPartialMatch("AB1", "AB1CDEFG")); // 4자 미만 무시
});

test("시리얼 번호 마스킹", () => {
  assert.ok(!scrubSerial("모델 SQ07 S/N: ABC12345678 정격 650W").includes("ABC12345678"));
  assert.ok(!scrubSerial("제조번호 20240712345").includes("20240712345"));
  assert.ok(scrubSerial("냉방 소비전력 650W").includes("650W")); // 일반 텍스트는 보존
});

/* ── 2·3·4. 검색 점수화 ── */
const QUERY = { brand: "LG", modelNumber: "SQ07EJ1WAS", productType: "wall" as const };

function item(title: string, extra: Partial<RawSearchItem> = {}): RawSearchItem {
  return { title, link: `https://example.com/${encodeURIComponent(title)}`, ...extra };
}

test("정확한 모델번호 포함 상품이 최상위로 정렬된다", () => {
  const ranked = rankCandidates(
    [
      item("LG 휘센 벽걸이 에어컨 7평형"),
      item("LG 휘센 <b>SQ07EJ1WAS</b> 벽걸이 에어컨", { brand: "LG전자" }),
      item("LG 벽걸이 에어컨 SQ09EJ1WAS 9평"),
    ],
    QUERY,
    "naver-shopping"
  );
  assert.ok(ranked.length >= 1);
  assert.ok(ranked[0].title.includes("SQ07EJ1WAS"));
  assert.equal(ranked[0].exactModelMatch, true);
});

test("공백·하이픈이 섞인 모델번호도 일치로 처리된다", () => {
  const ranked = rankCandidates(
    [item("LG 휘센 SQ07-EJ1 WAS 벽걸이 에어컨")],
    QUERY,
    "naver-shopping"
  );
  assert.equal(ranked[0]?.exactModelMatch, true);
});

test("리모컨·필터·커버 등 액세서리는 낮은 점수로 밀려난다", () => {
  const ranked = rankCandidates(
    [
      item("LG SQ07EJ1WAS 호환 리모컨"),
      item("LG SQ07EJ1WAS 에어컨 필터 2매"),
      item("LG 휘센 SQ07EJ1WAS 벽걸이 에어컨"),
    ],
    QUERY,
    "naver-shopping"
  );
  assert.ok(ranked[0].title.includes("벽걸이 에어컨"));
  assert.ok(!ranked[0].title.includes("리모컨"));
  // 본품이 액세서리보다 항상 위
  const accessoryIdx = ranked.findIndex((c) => c.title.includes("리모컨"));
  assert.ok(accessoryIdx === -1 || accessoryIdx > 0);
});

test("렌탈·중고 상품은 감점된다", () => {
  const ranked = rankCandidates(
    [item("LG SQ07EJ1WAS 에어컨 렌탈"), item("LG SQ07EJ1WAS 에어컨 새제품")],
    QUERY,
    "naver-shopping"
  );
  assert.ok(ranked[0].title.includes("새제품"));
});

test("브랜드 불일치 상품은 일치 상품보다 낮다", () => {
  const ranked = rankCandidates(
    [item("삼성 무풍 AR07C9150 벽걸이 에어컨"), item("LG 휘센 SQ07EJ1WAS 벽걸이 에어컨")],
    QUERY,
    "naver-shopping"
  );
  assert.ok(ranked[0].title.includes("LG"));
  // 다른 모델은 완전 일치로 표시되지 않는다
  const samsung = ranked.find((c) => c.title.includes("삼성"));
  if (samsung) assert.equal(samsung.exactModelMatch, false);
});

test("검색 결과가 null/빈 배열이어도 안전하게 빈 후보 (fallback 실패 시 계산기 계속)", () => {
  assert.deepEqual(rankCandidates(null, QUERY, "naver-shopping"), []);
  assert.deepEqual(rankCandidates([], QUERY, "naver-image"), []);
  assert.deepEqual(rankCandidates([{ title: "제목만 있고 링크 없음" }], QUERY, "naver-image"), []);
});

test("이미지 없는 후보도 productUrl이 보존돼 선택 기능이 동작한다", () => {
  const ranked = rankCandidates(
    [item("LG 휘센 SQ07EJ1WAS 벽걸이 에어컨")], // image/thumbnail 없음
    QUERY,
    "naver-shopping"
  );
  assert.equal(ranked[0].imageUrl, null);
  assert.ok(ranked[0].productUrl.length > 0);
});

test("후보는 최대 3개", () => {
  const many = Array.from({ length: 10 }, (_, i) =>
    item(`LG 휘센 SQ07EJ1WAS 벽걸이 에어컨 ${i}호점`)
  );
  assert.equal(rankCandidates(many, QUERY, "naver-shopping").length, 3);
});

test("제품 유형 감지", () => {
  assert.equal(detectProductType("LG 벽걸이 에어컨"), "wall");
  assert.equal(detectProductType("삼성 스탠드 에어컨"), "standing");
  assert.equal(detectProductType("파세코 창문형 에어컨"), "window");
  assert.equal(detectProductType("이동식 에어컨"), "portable");
  assert.equal(detectProductType("2in1 멀티형"), "multi");
  assert.equal(detectProductType("에어컨"), "unknown");
});

/* ── 5. 자동 확정 금지 (데이터 계약) ── */
test("후보가 하나뿐이어도 exactModelMatch가 자동 적용을 의미하지 않는다", () => {
  // rankCandidates는 후보 목록만 반환한다 — "선택됨" 상태를 만들 수 있는 필드가 없어야 한다
  const ranked = rankCandidates([item("LG 휘센 SQ07EJ1WAS 벽걸이 에어컨")], QUERY, "naver-shopping");
  assert.equal(ranked.length, 1);
  assert.ok(!("selected" in ranked[0]));
  assert.ok(!("confirmed" in ranked[0]));
});

/* ── 6. 냉방능력 W ≠ 소비전력 W ── */
test("냉방능력(coolingCapacityW)이 소비전력으로 새지 않는다", () => {
  const id = sanitizeIdentification({
    brand: "LG",
    modelNumber: "SQ07EJ1WAS",
    alternativeModelNumbers: [],
    productType: "wall",
    indoorUnitModel: null,
    outdoorUnitModel: null,
    ratedCoolingPowerW: null, // 소비전력은 못 읽음
    coolingCapacityW: 2500, // 냉방능력만 읽음
    ratedVoltageV: 220,
    manufacturingYear: 2023,
    confidence: { brand: 0.9, modelNumber: 0.9, ratedCoolingPowerW: 0 },
    visibleEvidence: [],
    warnings: [],
  });
  assert.ok(id);
  assert.equal(id.ratedCoolingPowerW, null); // capacity가 대신 들어가지 않음
  assert.equal(id.coolingCapacityW, 2500);
});

test("소비전력 범위 밖 값(냉방능력 오인 의심)은 null 처리된다", () => {
  const id = sanitizeIdentification({
    modelNumber: "X",
    productType: "wall",
    ratedCoolingPowerW: 7200, // 5kW 초과 — 벽걸이 소비전력일 수 없음(능력 오인 의심)
    confidence: { brand: 0, modelNumber: 0.5, ratedCoolingPowerW: 0.9 },
  });
  assert.ok(id);
  assert.equal(id.ratedCoolingPowerW, null);
});

/* ── 7. 소비전력 출처 우선순위 ── */
test("라벨 사진(고신뢰) > 직접 입력 > 제조사 > 교차 확인 > 평수 추정", () => {
  const all = {
    labelPhoto: { watts: 650, confidence: 0.9 },
    userInput: 700,
    manufacturer: 720,
    crossChecked: 730,
  };
  assert.deepEqual(resolveCoolingPower(all), { watts: 650, source: "label-photo" });
  assert.deepEqual(resolveCoolingPower({ ...all, labelPhoto: null }), {
    watts: 700,
    source: "user-input",
  });
  assert.deepEqual(resolveCoolingPower({ manufacturer: 720, crossChecked: 730 }), {
    watts: 720,
    source: "manufacturer",
  });
  assert.deepEqual(resolveCoolingPower({ crossChecked: 730 }), {
    watts: 730,
    source: "cross-checked-search",
  });
  assert.deepEqual(resolveCoolingPower({}), { watts: null, source: "area-estimate" });
});

test("라벨 신뢰도가 낮으면 직접 입력이 우선한다", () => {
  const r = resolveCoolingPower({
    labelPhoto: { watts: 650, confidence: LABEL_POWER_MIN_CONFIDENCE - 0.1 },
    userInput: 700,
  });
  assert.deepEqual(r, { watts: 700, source: "user-input" });
});

test("출처 문구", () => {
  assert.equal(powerSourceText("label-photo", 650), "제품 라벨 650W 반영");
  assert.equal(powerSourceText("user-input", 650), "직접 입력한 650W 반영");
  assert.equal(powerSourceText("manufacturer", 650), "제조사 사양 650W 반영");
  assert.equal(powerSourceText("area-estimate", null), "평수 기준 자동 추정");
  assert.equal(powerSourceText("label-photo", null), "평수 기준 자동 추정");
});

/* ── 10. 잘못된 응답 안전 처리 ── */
test("깨진 판독 JSON은 throw 없이 null 또는 안전한 기본값", () => {
  assert.equal(sanitizeIdentification(null), null);
  assert.equal(sanitizeIdentification("문자열"), null);
  assert.equal(sanitizeIdentification([1, 2, 3]), null);

  // 필드 타입이 어긋나도 throw 없이 기본값으로 정제
  const id = sanitizeIdentification({
    brand: 123,
    modelNumber: "  SQ07EJ1WAS  ",
    alternativeModelNumbers: "배열 아님",
    productType: "우주선",
    ratedCoolingPowerW: "650",
    coolingCapacityW: Number.NaN,
    confidence: { brand: 99, modelNumber: -5, ratedCoolingPowerW: "높음" },
    visibleEvidence: [42, "냉방 소비전력 650W"],
    warnings: null,
  });
  assert.ok(id);
  assert.equal(id.brand, null);
  assert.equal(id.modelNumber, "SQ07EJ1WAS");
  assert.deepEqual(id.alternativeModelNumbers, []);
  assert.equal(id.productType, "unknown");
  assert.equal(id.ratedCoolingPowerW, null); // 문자열 숫자는 신뢰하지 않음
  assert.equal(id.coolingCapacityW, null);
  assert.equal(id.confidence.brand, 1); // clamp
  assert.equal(id.confidence.modelNumber, 0);
  assert.equal(id.confidence.ratedCoolingPowerW, 0);
  assert.deepEqual(id.visibleEvidence, ["냉방 소비전력 650W"]);
  assert.deepEqual(id.warnings, []);
});

test("판독 결과의 문자열 필드에서 시리얼이 제거된다", () => {
  const id = sanitizeIdentification({
    modelNumber: "SQ07EJ1WAS",
    productType: "wall",
    confidence: { brand: 1, modelNumber: 1, ratedCoolingPowerW: 0 },
    visibleEvidence: ["MODEL SQ07EJ1WAS", "S/N KR2024ABC1234"],
    warnings: [],
  });
  assert.ok(id);
  assert.ok(!id.visibleEvidence.join(" ").includes("KR2024ABC1234"));
});

/* ── 리뷰 확정 결함 회귀 테스트 (v16 리뷰 반영) ── */
test("scrubSerial — 복합 구두점·S.N.·괄호 표기도 마스킹, SN 접두 모델은 보존", () => {
  assert.ok(!scrubSerial("Serial No.: KR2024ABC1234").includes("KR2024ABC1234"));
  assert.ok(!scrubSerial("S.N. KR2024ABC1234").includes("KR2024ABC1234"));
  assert.ok(!scrubSerial("제조번호(S/N): KR2024ABC1234").includes("KR2024ABC1234"));
  assert.ok(!scrubSerial("SN: KR2024XYZ999").includes("KR2024XYZ999"));
  // SN으로 시작하는 모델번호는 파괴하지 않는다 (신일 SNC- 계열 등)
  assert.equal(scrubSerial("MODEL SNC-5000W 벽걸이"), "MODEL SNC-5000W 벽걸이");
  assert.equal(scrubSerial("SNC-5000W"), "SNC-5000W");
});

test("sanitizeIdentification — 소비전력이 냉방능력과 같거나 크면 능력 오인으로 제외", () => {
  const id = sanitizeIdentification({
    modelNumber: "X1234",
    productType: "wall",
    ratedCoolingPowerW: 3500, // 능력값이 소비전력 필드에 중복 기입된 케이스
    coolingCapacityW: 3500,
    confidence: { brand: 0.9, modelNumber: 0.9, ratedCoolingPowerW: 0.9 },
  });
  assert.ok(id);
  assert.equal(id.ratedCoolingPowerW, null);
  assert.ok(id.warnings.some((w) => w.includes("능력")));
  // 정상 관계(소비전력 < 능력)는 통과
  const ok = sanitizeIdentification({
    modelNumber: "X1234",
    productType: "wall",
    ratedCoolingPowerW: 650,
    coolingCapacityW: 2500,
    confidence: { brand: 0.9, modelNumber: 0.9, ratedCoolingPowerW: 0.9 },
  });
  assert.equal(ok?.ratedCoolingPowerW, 650);
});

test("scoreCandidate — 접두 부분 일치는 완전 일치가 아니다", () => {
  const ranked = rankCandidates(
    [
      { title: "삼성 무풍 AR07T9170HZS 벽걸이 에어컨", link: "https://example.com/1" },
      { title: "삼성 무풍 AR07T917 벽걸이 에어컨", link: "https://example.com/2" },
    ],
    { brand: "삼성", modelNumber: "AR07T917", productType: "wall" },
    "naver-shopping"
  );
  const longer = ranked.find((c) => c.title.includes("AR07T9170HZS"));
  const exact = ranked.find((c) => c.title.includes("AR07T917 "));
  assert.ok(exact?.exactModelMatch); // 진짜 일치만 완전 일치
  if (longer) {
    assert.equal(longer.exactModelMatch, false); // 접두어 포함은 부분 일치
    assert.notEqual(longer.modelNumber, "AR07T917"); // query로 덮어쓰지 않음
  }
});

test("detectProductType — 구성품이 함께 표기된 멀티형이 multi로 분류된다", () => {
  assert.equal(detectProductType("LG 휘센 2in1 벽걸이+스탠드 에어컨"), "multi");
  assert.equal(detectProductType("삼성 무풍 멀티형 스탠드형+벽걸이"), "multi");
  assert.equal(detectProductType("LG 휘센 투인원 스탠드"), "multi");
});

test("extractModelToken — 마케팅 토큰(WiFi2024)을 건너뛰고 실제 모델을 집는다", () => {
  const { extractModelToken } = require("../lib/aircon/search");
  assert.equal(extractModelToken("WiFi2024 지원 에어컨 SQ07EJ1WAS"), "SQ07EJ1WAS");
  assert.equal(extractModelToken("짧은 A1234 토큰"), null); // 정규화 6자 미만 제외
});
