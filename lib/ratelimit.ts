// 가벼운 IP 레이트리밋 (v7 P4 → v10 버킷 분리) — 서버 전용, 보험 수준
//
// 공개 데모 URL 남용으로 인한 API 비용 폭주를 막는 최소한의 방어.
// 인메모리 슬라이딩 윈도우라 서버리스 인스턴스별로 따로 계산된다는 한계가 있다
// (완벽한 한도가 아니라 '보험').
//
// TODO(운영 전환 시): 아래 check() 구현만 Upstash Redis / Vercel KV 같은
// 분산 저장소 어댑터로 교체하면 된다. 호출부 시그니처(rateLimited(req, bucket))는 유지.

type Bucket =
  | "assist" // 수리·행정·공과금 (텍스트)
  | "assist-image" // 사진 포함 진단 — 비전 비용이 커서 더 엄격
  | "contract" // 계약서 체커 (긴 텍스트)
  | "grocery" // 장보기 식단·남은 재료
  | "grocery-extract" // 냉장고 사진 재료 추출 (비전)
  | "rent" // 실거래가 조회 (공공데이터 프록시)
  | "openbanking"; // 오픈뱅킹 테스트베드

const WINDOW_MS = 5 * 60_000; // 5분

// 윈도우당 허용 횟수 — 이미지(비전) 버킷은 더 엄격
const MAX_HITS: Record<Bucket, number> = {
  assist: 20,
  "assist-image": 10,
  contract: 10,
  grocery: 20,
  "grocery-extract": 10,
  rent: 30,
  openbanking: 30,
};

const hits = new Map<string, number[]>();

function check(key: string, max: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= max) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  // 맵 무한 성장 방지
  if (hits.size > 5000) hits.clear();
  return false;
}

export function rateLimited(req: Request, bucket: Bucket = "assist"): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return check(`${bucket}:${ip}`, MAX_HITS[bucket]);
}

export const RATE_LIMIT_MESSAGE =
  "요청이 너무 잦아요. 5분 뒤에 다시 시도해주세요.";
