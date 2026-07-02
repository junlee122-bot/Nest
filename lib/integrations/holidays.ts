// ⑦ 공휴일 API (v3 P5) — 서버 전용
//
// "오늘/내일이 공휴일이면 관리사무소·집주인 응답이 늦을 수 있다"는 생활 맥락 제공.
// 키가 없거나 실패하면 null → 맥락 문장 생략(기능 손실 없음).
// 발급: 공공데이터포털 "한국천문연구원_특일 정보" (DATA_GO_KR_SERVICE_KEY 공용)

import { kstParts, safeFetch, safeJson, withCache } from "./core";

interface RestDayItem {
  dateName?: string;
  isHoliday?: string; // "Y"
  locdate?: number | string; // YYYYMMDD
}

export async function fetchHolidays(
  year: string,
  month: string
): Promise<{ date: string; name: string }[] | null> {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) return null;

  return withCache(`holidays:${year}-${month}`, 24 * 60 * 60_000, async () => {
    const url =
      `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo` +
      `?serviceKey=${encodeURIComponent(key)}&solYear=${year}&solMonth=${month}&numOfRows=30&_type=json`;
    const data = await safeJson<{
      response?: { body?: { items?: { item?: RestDayItem[] | RestDayItem } } };
    }>(await safeFetch(url));
    const raw = data?.response?.body?.items?.item;
    if (!raw) return null;
    const items = Array.isArray(raw) ? raw : [raw];
    return items
      .filter((i) => i.isHoliday === "Y" && i.locdate && i.dateName)
      .map((i) => ({ date: String(i.locdate), name: String(i.dateName) }));
  });
}

// 오늘/내일 공휴일이면 프롬프트 맥락 한 줄 (아니면 null)
export async function holidayContextLine(): Promise<string | null> {
  const { year, month, day } = kstParts();
  const holidays = await fetchHolidays(year, month);
  if (!holidays) return null;

  const today = `${year}${month}${day}`;
  const tomorrowDate = new Date(Date.UTC(+year, +month - 1, +day) + 24 * 60 * 60 * 1000);
  const tomorrow = `${tomorrowDate.getUTCFullYear()}${String(tomorrowDate.getUTCMonth() + 1).padStart(2, "0")}${String(tomorrowDate.getUTCDate()).padStart(2, "0")}`;

  const t = holidays.find((h) => h.date === today);
  if (t) {
    return `오늘은 공휴일(${t.name})이라 관리사무소·수리업체·기관 응답이 늦을 수 있음. 급하지 않은 연락은 다음 영업일을 안내에 반영할 것.`;
  }
  const n = holidays.find((h) => h.date === tomorrow);
  if (n) {
    return `내일이 공휴일(${n.name})임 — 오늘 중 연락·조치를 권하는 쪽이 유리하면 그렇게 안내할 것.`;
  }
  return null;
}
