// 결과 JSON 최소 스키마 검사 (v3 P6)
//
// 목적: "그럴듯하지만 깨진" 출력(필수 필드 누락)을 잡아 1회 재시도를 트리거.
// 과하게 엄격하면 정상 출력을 거부하므로, UI가 기대는 필수 필드만 본다.

type P = Record<string, unknown>;

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isArr = Array.isArray;

export function validateRepair(p: P): boolean {
  // 되묻기 응답도 유효한 형태로 인정 (라우트에서 분기)
  if (p.needsClarification === true) return isStr(p.clarifyingQuestion);
  const resp = p.responsibility as P | undefined;
  return (
    !!resp &&
    isStr(resp.verdict) &&
    ["landlord", "tenant", "depends"].includes(resp.verdict as string) &&
    isStr(p.message_polite) &&
    isStr(p.message_firm) &&
    isArr(p.emergency)
  );
}

export function validateAdmin(p: P): boolean {
  return isArr(p.checklist) && (p.checklist as unknown[]).length > 0;
}

export function validateUtility(p: P): boolean {
  return isStr(p.status) && isArr(p.tips);
}

export function validateForTopic(topic: string): (p: P) => boolean {
  if (topic === "repair") return validateRepair;
  if (topic === "admin") return validateAdmin;
  if (topic === "utility") return validateUtility;
  return () => true;
}

export function validateContract(p: P): boolean {
  return isArr(p.findings) && isStr(p.summary);
}

export function validateGrocery(mode: "plan" | "use"): (p: P) => boolean {
  if (mode === "plan") {
    return (p) => isArr(p.plan_days) && isArr(p.shopping_list);
  }
  return (p) => isArr(p.recipes) && (p.recipes as unknown[]).length > 0;
}
