// 결과 JSON 스키마 검사 (v3 P6 → v7 P4 강화)
//
// 목적: "그럴듯하지만 깨진" 출력을 잡아 1회 재시도를 트리거.
// v7: enum 제한 + 문자열 상한 + 배열 상한 + 빈 제목 방지.
// 과하게 엄격하면 정상 출력을 거부하므로, UI가 기대는 필수 조건까지만 본다.

type P = Record<string, unknown>;

const MAX_STR = 4000; // 단일 필드 문자열 상한 (프롬프트상 정상 출력은 수백 자)
const MAX_ARR = 40; // 배열 항목 상한

const isStr = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= MAX_STR;
const isArr = (v: unknown, max = MAX_ARR): v is unknown[] =>
  Array.isArray(v) && v.length <= max;
const inEnum = (v: unknown, allowed: readonly string[]): boolean =>
  typeof v === "string" && allowed.includes(v);

const URGENCY = ["emergency", "soon", "routine"] as const;
const VERDICT = ["landlord", "tenant", "depends"] as const;
const SAFETY = ["none", "warning", "danger"] as const;
const RISK = ["high", "medium", "low"] as const;
const OVERALL = ["high", "medium", "low", "none"] as const;
const USTATUS = ["high", "normal", "low", "unknown"] as const;

export function validateRepair(p: P): boolean {
  // 되묻기 응답도 유효한 형태로 인정 (라우트에서 분기)
  if (p.needsClarification === true) return isStr(p.clarifyingQuestion);
  const resp = p.responsibility as P | undefined;
  const safety = p.safety as P | undefined;
  return (
    !!resp &&
    inEnum(resp.verdict, VERDICT) &&
    isStr(resp.summary) &&
    isStr(p.message_polite) &&
    isStr(p.message_firm) &&
    isArr(p.emergency, 10) &&
    inEnum(p.urgency, URGENCY) &&
    (!safety || safety.level === undefined || inEnum(safety.level, SAFETY))
  );
}

export function validateAdmin(p: P): boolean {
  if (!isArr(p.checklist, 15) || (p.checklist as unknown[]).length === 0) return false;
  // 항목에 빈 제목이 섞이면 거부
  return (p.checklist as P[]).every((c) => isStr(c?.title));
}

export function validateUtility(p: P): boolean {
  return inEnum(p.status, USTATUS) && isArr(p.tips, 10);
}

export function validateForTopic(topic: string): (p: P) => boolean {
  if (topic === "repair") return validateRepair;
  if (topic === "admin") return validateAdmin;
  if (topic === "utility") return validateUtility;
  return () => true;
}

export function validateContract(p: P): boolean {
  if (!isArr(p.findings, 20) || !isStr(p.summary)) return false;
  if (!inEnum(p.overall_risk, OVERALL)) return false;
  return (p.findings as P[]).every(
    (f) => inEnum(f?.risk, RISK) && isStr(f?.why) && typeof f?.clause_text === "string"
  );
}

export function validateGrocery(mode: "plan" | "use"): (p: P) => boolean {
  if (mode === "plan") {
    return (p) => {
      if (!isArr(p.plan_days, 10) || !isArr(p.shopping_list, MAX_ARR)) return false;
      if ((p.shopping_list as unknown[]).length === 0) return false;
      return (p.shopping_list as P[]).every(
        (it) => isStr(it?.item) && typeof it?.est_price === "number" && it.est_price >= 0
      );
    };
  }
  return (p) => {
    if (!isArr(p.recipes, 8) || (p.recipes as unknown[]).length === 0) return false;
    return (p.recipes as P[]).every((r) => isStr(r?.name) && isArr(r?.steps, 12));
  };
}

// 냉장고 사진 → 재료 추출 (C-2). 빈 배열도 유효(사진에 식재료가 없는 경우).
export function validateGroceryExtract(p: P): boolean {
  if (!isArr(p.ingredients, 15)) return false;
  return (p.ingredients as unknown[]).every(
    (s) => typeof s === "string" && s.trim().length > 0 && s.length <= 30
  );
}
