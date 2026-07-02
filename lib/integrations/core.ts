// 공공데이터 연동 공통 유틸 (v3 P5) — 서버 전용
//
// 불변 원칙:
// - 모든 호출은 서버 라우트에서만. 키는 env로만 주입, 커밋 금지.
// - 키가 없거나 호출이 실패하면 조용히 null → 호출부는 기존 동작(폴백)으로.
// - 결과는 "참고용, 법적 효력 없음"으로 표기해 노출한다.

export const PUBLIC_DATA_NOTICE =
  "공공데이터 기반 참고 정보로 법적 효력이 없어요. 정확한 내용은 해당 기관에서 확인하세요.";

// 실패해도 앱이 멈추지 않는 fetch — 타임아웃 + JSON/text 안전 파싱
export async function safeFetch(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response | null> {
  const { timeoutMs = 5000, ...rest } = init ?? {};
  try {
    const res = await fetch(url, {
      ...rest,
      signal: AbortSignal.timeout(timeoutMs),
      // 공공데이터는 응답이 자주 변하지 않음 — Next 캐시 대신 자체 메모리 캐시 사용
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

export async function safeJson<T>(res: Response | null): Promise<T | null> {
  if (!res) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// 아주 단순한 모듈 스코프 TTL 캐시 (서버 인스턴스 생명주기 내)
const cache = new Map<string, { at: number; value: unknown }>();

export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T | null>
): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T | null;
  const value = await loader();
  // 실패(null)는 5분만 캐시해 무한 폭주를 막되 금방 재시도
  cache.set(key, { at: value === null ? Date.now() - ttlMs + 5 * 60_000 : Date.now(), value });
  return value;
}

// KST(한국 표준시) 기준 현재 시각 조각 — 서버 리전에 상관없이 한국 생활 맥락 유지
export function kstParts() {
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === "24" ? "00" : parts.hour,
    minute: parts.minute,
  };
}
