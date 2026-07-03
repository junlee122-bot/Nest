// 가벼운 IP 레이트리밋 (v7 P4) — 서버 전용, 보험 수준
//
// 공개 데모 URL 남용으로 인한 API 비용 폭주를 막는 최소한의 방어.
// 인메모리 슬라이딩 윈도우라 서버리스 인스턴스별로 따로 계산된다는 한계가 있다
// (완벽한 한도가 아니라 '보험' — 리뷰 §5 지침 그대로).

const WINDOW_MS = 5 * 60_000; // 5분
const MAX_HITS = 20; // 윈도우당 LLM 호출 수

const hits = new Map<string, number[]>();

export function rateLimited(req: Request): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_HITS) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  // 맵 무한 성장 방지
  if (hits.size > 5000) hits.clear();
  return false;
}

export const RATE_LIMIT_MESSAGE =
  "요청이 너무 잦아요. 5분 뒤에 다시 시도해주세요.";
