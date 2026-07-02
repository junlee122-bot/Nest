// ② 국토교통부 전월세 실거래가 (v3 P5) — 서버 전용
//
// 자취생이 계약 전 "이 동네 이 정도가 정상 시세인가?"를 확인하는 근거.
// 응답이 XML이라 의존성 없이 정규식으로 <item> 블록만 가볍게 파싱한다.
// 키가 없거나 실패하면 null → /rent 페이지는 예시 데이터+발급 안내로 폴백.
// 발급: 공공데이터포털 "국토교통부_아파트/오피스텔/단독다가구 전월세 실거래가" (DATA_GO_KR_SERVICE_KEY 공용)

import { safeFetch, withCache } from "./core";

export function isRtmsConfigured(): boolean {
  return !!process.env.DATA_GO_KR_SERVICE_KEY;
}

export type RentHouseType = "apt" | "offi" | "sh";

export const RENT_TYPE_LABEL: Record<RentHouseType, string> = {
  apt: "아파트",
  offi: "오피스텔",
  sh: "단독·다가구(원룸 등)",
};

const ENDPOINT: Record<RentHouseType, { path: string; op: string }> = {
  apt: { path: "RTMSDataSvcAptRent", op: "getRTMSDataSvcAptRent" },
  offi: { path: "RTMSDataSvcOffiRent", op: "getRTMSDataSvcOffiRent" },
  sh: { path: "RTMSDataSvcSHRent", op: "getRTMSDataSvcSHRent" },
};

export interface RentDeal {
  name: string; // 단지/건물명 (단독다가구는 동 이름)
  dong: string; // 법정동
  deposit: number; // 보증금(만원)
  monthlyRent: number; // 월세(만원, 0이면 전세)
  areaM2: number | null; // 전용/계약 면적
  floor: number | null;
  yearMonth: string; // 계약 연월 YYYYMM
}

function num(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}>([^<]*)</${name}>`));
  return m?.[1]?.trim() || undefined;
}

/**
 * 법정동코드 앞 5자리(LAWD_CD)와 연월(YYYYMM)로 전월세 실거래 목록 조회.
 */
export async function fetchRentDeals(
  lawdCd: string,
  yearMonth: string,
  type: RentHouseType
): Promise<RentDeal[] | null> {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) return null;
  if (!/^\d{5}$/.test(lawdCd) || !/^\d{6}$/.test(yearMonth)) return null;

  return withCache(`rtms:${type}:${lawdCd}:${yearMonth}`, 6 * 60 * 60_000, async () => {
    const { path, op } = ENDPOINT[type];
    const url =
      `https://apis.data.go.kr/1613000/${path}/${op}` +
      `?serviceKey=${encodeURIComponent(key)}&LAWD_CD=${lawdCd}&DEAL_YMD=${yearMonth}` +
      `&numOfRows=300&pageNo=1`;
    const res = await safeFetch(url, { timeoutMs: 8000 });
    if (!res) return null;
    let xml: string;
    try {
      xml = await res.text();
    } catch {
      return null;
    }
    // 인증 실패 등 에러 응답 감지
    if (/<resultCode>(?!0{2,3}<)/.test(xml) && !/<resultCode>0+<\/resultCode>/.test(xml)) {
      return null;
    }

    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g);
    if (!blocks) return [];

    const deals: RentDeal[] = [];
    for (const b of blocks) {
      const deposit = num(tag(b, "deposit"));
      if (deposit === null) continue;
      const monthly = num(tag(b, "monthlyRent")) ?? 0;
      const area =
        num(tag(b, "excluUseAr")) ?? num(tag(b, "totalFloorAr")) ?? num(tag(b, "contractArea"));
      const name =
        tag(b, "aptNm") ?? tag(b, "offiNm") ?? tag(b, "mhouseNm") ?? tag(b, "umdNm") ?? "이름 없음";
      const y = tag(b, "dealYear");
      const m = tag(b, "dealMonth");
      deals.push({
        name,
        dong: tag(b, "umdNm") ?? "",
        deposit,
        monthlyRent: monthly,
        areaM2: area,
        floor: num(tag(b, "floor")),
        yearMonth: y && m ? `${y}${m.padStart(2, "0")}` : yearMonth,
      });
    }
    return deals;
  });
}

// 간단 요약 통계 — 중앙값 위주(극단값에 강함)
export function summarizeDeals(deals: RentDeal[]) {
  const jeonse = deals.filter((d) => d.monthlyRent === 0);
  const wolse = deals.filter((d) => d.monthlyRent > 0);
  const median = (ns: number[]) => {
    if (ns.length === 0) return null;
    const s = [...ns].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  };
  return {
    total: deals.length,
    jeonseCount: jeonse.length,
    wolseCount: wolse.length,
    jeonseDepositMedian: median(jeonse.map((d) => d.deposit)),
    wolseDepositMedian: median(wolse.map((d) => d.deposit)),
    wolseRentMedian: median(wolse.map((d) => d.monthlyRent)),
  };
}
