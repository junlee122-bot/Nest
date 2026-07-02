// ④ 건축물대장 표제부 (v3 P5) — 서버 전용
//
// 계약 전 "이 건물, 준공 언제? 용도는 주거 맞나?"를 확인하는 참고 정보.
// 키가 없거나 실패하면 null → UI에서 섹션 자체를 숨긴다.
// 발급: 공공데이터포털 "국토교통부_건축HUB_건축물대장정보 서비스" (DATA_GO_KR_SERVICE_KEY 공용)

import { safeFetch, safeJson, withCache } from "./core";

export function isBuildingConfigured(): boolean {
  return !!process.env.DATA_GO_KR_SERVICE_KEY;
}

export interface BuildingInfo {
  name: string | null; // 건물명
  approvedAt: string | null; // 사용승인일 YYYYMMDD
  mainUse: string | null; // 주용도 (예: 다가구주택)
  structure: string | null; // 구조 (예: 철근콘크리트구조)
  groundFloors: number | null;
  undergroundFloors: number | null;
  elevators: number | null; // 승용 승강기 수
}

interface BrTitleItem {
  bldNm?: string;
  useAprDay?: string | number;
  mainPurpsCdNm?: string;
  strctCdNm?: string;
  grndFlrCnt?: string | number;
  ugrndFlrCnt?: string | number;
  rideUseElvtCnt?: string | number;
}

function toNum(v: string | number | undefined): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param bcode 법정동코드 10자리 (Daum 주소검색의 bcode)
 * @param bun 번 (4자리 zero-pad)
 * @param ji 지 (4자리 zero-pad)
 */
export async function fetchBuildingInfo(
  bcode: string,
  bun: string,
  ji: string
): Promise<BuildingInfo | null> {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) return null;
  if (!/^\d{10}$/.test(bcode)) return null;

  const sigunguCd = bcode.slice(0, 5);
  const bjdongCd = bcode.slice(5);
  const bun4 = bun.replace(/\D/g, "").padStart(4, "0");
  const ji4 = (ji || "0").replace(/\D/g, "").padStart(4, "0");

  return withCache(`bld:${bcode}:${bun4}:${ji4}`, 24 * 60 * 60_000, async () => {
    const url =
      `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo` +
      `?serviceKey=${encodeURIComponent(key)}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}` +
      `&bun=${bun4}&ji=${ji4}&numOfRows=5&pageNo=1&_type=json`;
    const data = await safeJson<{
      response?: { body?: { items?: { item?: BrTitleItem[] | BrTitleItem } } };
    }>(await safeFetch(url, { timeoutMs: 8000 }));
    const raw = data?.response?.body?.items?.item;
    if (!raw) return null;
    const item = Array.isArray(raw) ? raw[0] : raw;
    if (!item) return null;

    return {
      name: item.bldNm?.trim() || null,
      approvedAt: item.useAprDay ? String(item.useAprDay) : null,
      mainUse: item.mainPurpsCdNm?.trim() || null,
      structure: item.strctCdNm?.trim() || null,
      groundFloors: toNum(item.grndFlrCnt),
      undergroundFloors: toNum(item.ugrndFlrCnt),
      elevators: toNum(item.rideUseElvtCnt),
    };
  });
}
