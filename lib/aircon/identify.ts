// 라벨 사진 판독 — Vision 프롬프트 + 응답 정제 (v16)
//
// sanitizeIdentification은 순수 함수로 분리해 단위 테스트한다:
// - 모델(Claude)의 JSON이 어긋나도 throw 없이 null 또는 안전한 기본값
// - 냉방능력(capacity) W가 소비전력(ratedCoolingPowerW)으로 새지 않게 강제
// - 시리얼 번호는 모든 문자열 필드에서 마스킹
// - 신뢰도는 0~1로 clamp

import type { AirconType } from "@/lib/electricity";
import type { AirconImageIdentification } from "./types";
import { scrubSerial, scrubSerials } from "./normalize";

const PRODUCT_TYPES: (AirconType | "unknown")[] = [
  "wall",
  "standing",
  "window",
  "portable",
  "multi",
  "unknown",
];

export function airconIdentifyPrompt(): string {
  return `당신은 에어컨 제품 명판·에너지효율 라벨 판독 전문가입니다. 사용자가 올린 사진에서 보이는 텍스트만 읽어 JSON으로 반환합니다.

## 절대 규칙
- 사진에서 직접 읽은 값만 반환하세요. 추정·보정·일반 지식으로 채운 숫자를 라벨에서 읽은 것처럼 반환하지 마세요.
- 글자가 흐리거나 확신이 없으면 해당 필드를 null로 두고 warnings에 이유를 쓰세요.
- "냉방능력", "정격냉방능력", "냉방 능력", "capacity", "kcal/h", "BTU"는 냉방능력(coolingCapacityW)입니다. 절대 ratedCoolingPowerW에 넣지 마세요.
- "냉방 소비전력", "정격 소비전력", "소비 전력", "rated input", "power consumption", "input power"에 해당하는 W 값만 ratedCoolingPowerW입니다.
- kW 단위면 W로 환산하세요 (예: 0.65kW → 650).
- 시리얼 번호, 제조번호, S/N은 어떤 필드에도 절대 포함하지 마세요.
- 실내기 모델과 실외기 모델을 구분하세요 (실외기: ODU, outdoor, 실외기 표기). modelNumber에는 실내기(또는 세트) 모델을 넣으세요.
- 숫자 0/문자 O, 숫자 1/문자 I·L처럼 구분이 어려운 글자가 있으면 confidence.modelNumber를 0.5 이하로 낮추고 warnings에 "0과 O 구분이 어려움"처럼 기록한 뒤, 가능한 다른 읽기를 alternativeModelNumbers에 넣으세요.
- 사진이 에어컨 라벨이 아니면 모든 값을 null로 하고 warnings에 그 사실을 쓰세요.

## 출력 (JSON 객체 하나만, 설명문 금지)
{
  "brand": string | null,             // 예: "LG", "삼성", "캐리어"
  "modelNumber": string | null,       // 라벨 표기 그대로 (하이픈 포함)
  "alternativeModelNumbers": string[],// 다른 읽기 후보, 최대 3개
  "productType": "wall" | "standing" | "window" | "portable" | "multi" | "unknown",
  "indoorUnitModel": string | null,
  "outdoorUnitModel": string | null,
  "ratedCoolingPowerW": number | null, // 냉방 소비전력 W만
  "coolingCapacityW": number | null,   // 냉방능력 W (참고용)
  "ratedVoltageV": number | null,      // 정격전압 V
  "manufacturingYear": number | null,
  "confidence": { "brand": number, "modelNumber": number, "ratedCoolingPowerW": number }, // 각 0~1
  "visibleEvidence": string[],  // 실제로 보인 텍스트 조각, 최대 6개, 시리얼 제외
  "warnings": string[]          // 판독 한계·주의점, 한국어
}`;
}

const clamp01 = (n: unknown): number =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

function cleanString(v: unknown, maxLen = 80): string | null {
  if (typeof v !== "string") return null;
  const s = scrubSerial(v.trim()).slice(0, maxLen);
  return s.length > 0 ? s : null;
}

function cleanNumber(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return v >= min && v <= max ? Math.round(v) : null;
}

function cleanStringList(v: unknown, maxItems: number, maxLen = 120): string[] {
  if (!Array.isArray(v)) return [];
  return scrubSerials(
    v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim().slice(0, maxLen))
  ).slice(0, maxItems);
}

/**
 * Claude JSON 응답 → 안전한 AirconImageIdentification.
 * 형태가 크게 어긋나면 null (라우트는 "판독 실패"로 처리).
 */
export function sanitizeIdentification(raw: unknown): AirconImageIdentification | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;

  const confidence = (o.confidence ?? {}) as Record<string, unknown>;
  const productType = PRODUCT_TYPES.includes(o.productType as AirconType | "unknown")
    ? (o.productType as AirconType | "unknown")
    : "unknown";

  // 소비전력은 ratedCoolingPowerW 필드에서만 — coolingCapacityW가 새지 않게.
  // 교차 가드: 에어컨은 항상 냉방능력 > 소비전력(COP > 1)이므로, 두 값이 모두 있는데
  // 소비전력이 능력과 같거나 크면 능력값이 소비전력 필드에 중복 기입된 것으로 보고
  // 소비전력을 버린다 (100~5,000W 범위 검사만으로는 3,500W 능력 오인을 못 거른다).
  let ratedPower = cleanNumber(o.ratedCoolingPowerW, 100, 5000);
  const capacity = cleanNumber(o.coolingCapacityW, 500, 30000);
  const warnings = cleanStringList(o.warnings, 6);
  if (ratedPower !== null && capacity !== null && ratedPower >= capacity) {
    ratedPower = null;
    if (warnings.length < 6)
      warnings.push("소비전력이 냉방능력과 같거나 커서 능력값 오인으로 보고 제외했어요.");
  }

  return {
    brand: cleanString(o.brand, 40),
    modelNumber: cleanString(o.modelNumber, 60),
    alternativeModelNumbers: cleanStringList(o.alternativeModelNumbers, 3, 60),
    productType,
    indoorUnitModel: cleanString(o.indoorUnitModel, 60),
    outdoorUnitModel: cleanString(o.outdoorUnitModel, 60),
    ratedCoolingPowerW: ratedPower,
    coolingCapacityW: capacity,
    ratedVoltageV: cleanNumber(o.ratedVoltageV, 100, 480),
    manufacturingYear: cleanNumber(o.manufacturingYear, 1990, 2100),
    confidence: {
      brand: clamp01(confidence.brand),
      modelNumber: clamp01(confidence.modelNumber),
      ratedCoolingPowerW: clamp01(confidence.ratedCoolingPowerW),
    },
    visibleEvidence: cleanStringList(o.visibleEvidence, 6),
    warnings,
  };
}

/** 최소 스키마 검사 (callClaudeJson validate용) — 필드 존재 여부만 */
export function validateIdentifyShape(p: Record<string, unknown>): boolean {
  return "modelNumber" in p && "confidence" in p && "productType" in p;
}
