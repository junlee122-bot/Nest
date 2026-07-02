// ⑥ 카카오 로컬 키워드 검색 (v3 P5) — 서버 전용
//
// 업체 찾기(HelpConnect)를 지도 딥링크에서 '앱 안 미리보기 목록'으로 강화.
// 키가 없거나 실패하면 null → 기존 지도 딥링크만 노출(기능 손실 없음).
// 발급: https://developers.kakao.com (REST API 키)
// 원칙: 검색어만 전달 — 사용자 위치·연락처는 받지도 저장하지도 않는다.

import { safeFetch, safeJson, withCache } from "./core";

export function isKakaoConfigured(): boolean {
  return !!process.env.KAKAO_REST_API_KEY;
}

export interface PlaceItem {
  name: string;
  phone: string | null;
  address: string | null;
  mapUrl: string | null; // 카카오맵 상세
}

interface KakaoDoc {
  place_name?: string;
  phone?: string;
  road_address_name?: string;
  address_name?: string;
  place_url?: string;
}

export async function searchPlaces(query: string): Promise<PlaceItem[] | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  const q = query.trim().slice(0, 60);
  if (!q) return null;

  return withCache(`kakao:${q}`, 60 * 60_000, async () => {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&size=5`;
    const data = await safeJson<{ documents?: KakaoDoc[] }>(
      await safeFetch(url, {
        headers: { Authorization: `KakaoAK ${key}` },
      })
    );
    if (!data?.documents) return null;
    return data.documents.map((d) => ({
      name: d.place_name ?? "이름 없음",
      phone: d.phone || null,
      address: d.road_address_name || d.address_name || null,
      mapUrl: d.place_url || null,
    }));
  });
}
