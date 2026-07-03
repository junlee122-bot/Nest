// Pexels 음식 참고 이미지 (v8) — 서버 전용
//
// '남은 재료 처리'의 AI 레시피 카드에 요리 참고 사진을 곁들인다(/grocery 한정).
// - 키(PEXELS_API_KEY)가 없거나 검색 실패 시 null → 텍스트 카드 그대로(무손실 폴백)
// - Pexels 가이드라인에 따라 작가·출처 크레딧을 UI에 표기한다
// - 실제 완성 모습과 다를 수 있는 "참고 이미지"임을 함께 고지
// 발급: https://www.pexels.com/api/ (무료, 시간당 200회)

import { safeFetch, safeJson, withCache } from "./core";
import type { FoodPhoto } from "@/lib/types";

export function isPexelsConfigured(): boolean {
  return !!process.env.PEXELS_API_KEY;
}

interface PexelsPhoto {
  src?: { medium?: string; landscape?: string };
  photographer?: string;
  photographer_url?: string;
  url?: string;
  alt?: string;
}

/**
 * 요리명으로 참고 사진 1장 검색. 24시간 캐시.
 * @param dish 예: "두부 김치덮밥"
 */
export async function fetchFoodImage(dish: string): Promise<FoodPhoto | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  // 괄호·수식어 제거 후 '음식'을 붙여 요리 사진 위주로
  const q = dish.replace(/\(.+?\)/g, "").trim().slice(0, 30);
  if (!q) return null;

  return withCache(`pexels:${q}`, 24 * 60 * 60_000, async () => {
    const url =
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(`${q} 음식`)}` +
      `&per_page=1&orientation=landscape&locale=ko-KR`;
    const data = await safeJson<{ photos?: PexelsPhoto[] }>(
      await safeFetch(url, { headers: { Authorization: key } })
    );
    const photo = data?.photos?.[0];
    const src = photo?.src?.landscape || photo?.src?.medium;
    if (!photo || !src) return null;
    return {
      url: src,
      photographer: photo.photographer ?? "Pexels 작가",
      photographerUrl: photo.photographer_url ?? "https://www.pexels.com",
      sourceUrl: photo.url ?? "https://www.pexels.com",
    };
  });
}
