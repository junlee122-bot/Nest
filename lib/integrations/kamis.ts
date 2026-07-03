// KAMIS(aT 한국농수산식품유통공사) 농축수산물 일일 소매가격 (v6) — 서버 전용
//
// 장보기 코치의 예상 가격을 '오늘 실제 시세'로 접지(grounding)한다.
// 키가 없거나 실패하면 null → 내장 참고가격표(lib/grocery/prices)로 폴백.
// 발급: https://www.kamis.or.kr → 오픈API 인증키 신청 (cert_key + cert_id)

import { kstParts, safeFetch, safeJson, withCache } from "./core";

export function isKamisConfigured(): boolean {
  return !!(process.env.KAMIS_CERT_KEY && process.env.KAMIS_CERT_ID);
}

export interface KamisPrice {
  name: string; // 품목명 (예: 배추)
  unit: string; // 단위 (예: 1포기)
  price: number; // 당일 소매가(원)
  direction?: "up" | "down" | "flat"; // 전일 대비
}

interface DailySalesItem {
  product_cls_code?: string; // 01 소매 / 02 도매
  productName?: string; // "쌀/20kg" 형태
  item_name?: string;
  unit?: string;
  dpr1?: string; // 당일 (콤마 포함 문자열, 결측 "-")
  dpr2?: string; // 1일전
  lastest_day?: string; // 조사일 — API 원문 필드명 오타 그대로(lastest)
  direction?: string; // 0 하락 / 1 상승 / 2 등락없음
}

function toPrice(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * 주요 품목 당일 소매가 전체(dailySalesList). 6시간 캐시.
 * 실패/미설정 시 null.
 *
 * KAMIS 서버는 정상 호출도 20~90초 걸릴 수 있다(실측) — 타임아웃을 넉넉히 두고,
 * 호출부는 fetchKamisTodayFast()로 짧게만 기다린 뒤 폴백하는 것을 권장.
 * (이 함수의 프로미스는 계속 진행되어 캐시를 채우므로 다음 요청부터 시세가 반영된다)
 */
export async function fetchKamisToday(): Promise<{
  date: string;
  items: KamisPrice[];
} | null> {
  const key = process.env.KAMIS_CERT_KEY;
  const id = process.env.KAMIS_CERT_ID;
  if (!key || !id) return null;

  return withCache("kamis:daily", 6 * 60 * 60_000, async () => {
    const url =
      `https://www.kamis.or.kr/service/price/xml.do?action=dailySalesList` +
      `&p_cert_key=${encodeURIComponent(key)}&p_cert_id=${encodeURIComponent(id)}` +
      `&p_returntype=json`;
    const data = await safeJson<{
      price?: DailySalesItem[];
      error_code?: string;
    }>(await safeFetch(url, { timeoutMs: 55_000 }));
    // error_code "000"=성공 — 에러 시 price 가 없거나 형태가 달라질 수 있어 방어
    if (!data || (data.error_code && data.error_code !== "000")) return null;
    const rows = data.price;
    if (!rows || !Array.isArray(rows)) return null;

    const items: KamisPrice[] = [];
    let surveyDay: string | null = null;
    for (const r of rows) {
      // 소매가만 (product_cls_code "01")
      if (r.product_cls_code && r.product_cls_code !== "01") continue;
      const name = (r.productName || r.item_name || "").trim();
      const price = toPrice(r.dpr1);
      if (!name || price === null) continue;
      if (!surveyDay && r.lastest_day) surveyDay = r.lastest_day;
      const dir =
        r.direction === "1" ? "up" : r.direction === "0" ? "down" : "flat";
      items.push({ name, unit: (r.unit || "").trim(), price, direction: dir });
    }
    if (items.length === 0) return null;

    const { year, month, day } = kstParts();
    return { date: surveyDay ?? `${year}-${month}-${day}`, items };
  });
}

/**
 * 사용자 요청 경로용 — waitMs 안에 안 오면 null(폴백)을 돌려주되,
 * 원 호출은 백그라운드에서 계속되어 캐시를 채운다(stale-while-revalidate).
 */
export async function fetchKamisTodayFast(
  waitMs = 2500
): Promise<Awaited<ReturnType<typeof fetchKamisToday>>> {
  if (!isKamisConfigured()) return null;
  const inflight = fetchKamisToday().catch(() => null);
  return Promise.race([
    inflight,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), waitMs)),
  ]);
}

// 장보기 품목명과 KAMIS 품목명 매칭 (부분 포함, 긴 이름 우선)
export function matchKamis(
  itemName: string,
  kamis: KamisPrice[]
): KamisPrice | null {
  const q = itemName.replace(/\s/g, "");
  let best: KamisPrice | null = null;
  for (const k of kamis) {
    const name = k.name.replace(/\s/g, "").replace(/\(.+\)/, "");
    if (!name) continue;
    if (q.includes(name) || name.includes(q)) {
      if (!best || name.length > best.name.length) best = k;
    }
  }
  return best;
}

// 프롬프트 주입용 — 참고가격표 품목과 겹치는 오늘 시세만 골라 짧게
export function kamisPromptBlock(
  kamis: { date: string; items: KamisPrice[] },
  interestNames: string[]
): string | null {
  const lines: string[] = [];
  const seen = new Set<string>();
  for (const n of interestNames) {
    const hit = matchKamis(n, kamis.items);
    if (hit && !seen.has(hit.name)) {
      seen.add(hit.name);
      lines.push(`- ${hit.name}: ${hit.price.toLocaleString("ko-KR")}원/${hit.unit}`);
    }
    if (lines.length >= 20) break;
  }
  if (lines.length === 0) return null;
  return `[오늘 시세 — aT KAMIS ${kamis.date} 소매가]\n${lines.join("\n")}`;
}
