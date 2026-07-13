// 제품 검색 결과 정규화·점수화 (v16) — 순수 함수, 단위 테스트 대상
//
// 검색 결과는 그대로 노출하지 않는다: 제목 정규화 → 점수화 → 상위 3개.
// 모델번호 "완전 일치"가 가장 중요한 기준. 후보가 하나여도 자동 확정하지 않는다
// (적용은 사용자가 "내 에어컨이 맞아요"를 눌렀을 때만 — UI 계약).

import type { AirconType } from "@/lib/electricity";
import type { AirconProductCandidate } from "./types";
import { modelsMatch, modelsPartialMatch, normalizeModelNumber, stripHtml } from "./normalize";

/** 네이버 검색 API 원시 아이템 (쇼핑/이미지 공통 부분집합) */
export interface RawSearchItem {
  title?: string;
  link?: string;
  image?: string;
  thumbnail?: string;
  mallName?: string;
  brand?: string;
  maker?: string;
  category3?: string;
  category4?: string;
}

export interface SearchQuery {
  brand: string | null;
  modelNumber: string;
  productType?: AirconType | "unknown";
}

// multi를 먼저 검사한다 — 멀티형 상품 제목은 관례상 구성품(벽걸이+스탠드)을
// 함께 표기하므로, 뒤에 두면 항상 wall/standing으로 오분류된다.
const TYPE_KEYWORDS: { type: AirconType; words: string[] }[] = [
  { type: "multi", words: ["멀티형", "멀티 에어컨", "2in1", "2 in 1", "투인원", "홈멀티"] },
  { type: "window", words: ["창문형", "창호형"] },
  { type: "portable", words: ["이동식", "포터블"] },
  { type: "wall", words: ["벽걸이"] },
  { type: "standing", words: ["스탠드", "타워"] },
];

/** 상품 제목에서 에어컨 유형 추정 */
export function detectProductType(title: string): AirconType | "unknown" {
  const t = title.toLowerCase().replace(/\s+/g, "");
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.some((w) => t.includes(w.toLowerCase().replace(/\s+/g, "")))) return type;
  }
  return "unknown";
}

const ACCESSORY_WORDS = ["리모컨", "리모콘", "필터", "커버", "부품", "호환", "받침대", "거치대", "청소", "세척"];
const NON_PRODUCT_WORDS = ["렌탈", "렌트", "중고", "설치비", "이전설치", "철거"];
const OFFICIAL_MALL_HINTS = ["삼성", "lg전자", "엘지", "캐리어", "위니아", "쿠쿠", "신일", "파세코", "공식"];

/**
 * 제목에 모델번호가 "토큰 단위 완전 일치"로 포함되는지.
 * 정규화한 제목 전체에 대한 includes()는 접두어(AR07T917 ⊂ AR07T9170HZS)를
 * 완전 일치로 오판하므로, 영숫자 토큰을 최대 3개까지 이어붙여 등호 비교한다
 * ("SQ07-EJ1 WAS"처럼 공백·하이픈으로 쪼개진 표기 대응).
 */
export function titleContainsExactModel(title: string, queryNorm: string): boolean {
  if (queryNorm.length < 4) return false;
  const tokens = title.match(/[A-Za-z0-9-]+/g) ?? [];
  for (let i = 0; i < tokens.length; i++) {
    let joined = "";
    for (let j = i; j < Math.min(i + 3, tokens.length); j++) {
      joined += normalizeModelNumber(tokens[j]);
      if (joined === queryNorm) return true;
      if (joined.length >= queryNorm.length) break;
    }
  }
  return false;
}

/** 점수 규칙 — 명세 고정값 */
export function scoreCandidate(
  item: { title: string; brand: string | null; mallName: string | null; modelInTitle: string | null },
  query: SearchQuery
): { score: number; exactModelMatch: boolean } {
  let score = 0;
  const title = item.title;
  const titleNorm = normalizeModelNumber(title);
  const queryNorm = normalizeModelNumber(query.modelNumber);

  // 모델번호 일치 — 가장 중요한 기준
  const exactInTitle = titleContainsExactModel(title, queryNorm);
  const exactField = modelsMatch(item.modelInTitle, query.modelNumber);
  const exactModelMatch = exactField || exactInTitle;
  if (exactField) score += 100;
  else if (exactInTitle) score += 90; // 공백·하이픈 제거 후 일치
  else if (
    modelsPartialMatch(item.modelInTitle, query.modelNumber) ||
    (queryNorm.length >= 4 && titleNorm.includes(queryNorm)) ||
    (queryNorm.length >= 6 && titleNorm.includes(queryNorm.slice(0, queryNorm.length - 2)))
  ) {
    score -= 25; // 부분 일치만 함 (접두·포함 관계)
  }

  // 제조사 일치
  if (query.brand) {
    const qb = query.brand.toLowerCase().replace(/\s+/g, "");
    const hay = `${item.brand ?? ""} ${title}`.toLowerCase().replace(/\s+/g, "");
    if (qb.length >= 2 && hay.includes(qb)) score += 30;
  }

  if (title.includes("에어컨") || title.toLowerCase().includes("air conditioner")) score += 20;

  if (query.productType && query.productType !== "unknown") {
    if (detectProductType(title) === query.productType) score += 15;
  }

  const mall = (item.mallName ?? "").toLowerCase();
  if (OFFICIAL_MALL_HINTS.some((h) => mall.includes(h))) score += 10;

  if (ACCESSORY_WORDS.some((w) => title.includes(w))) score -= 50;
  if (NON_PRODUCT_WORDS.some((w) => title.includes(w))) score -= 30;

  return { score, exactModelMatch };
}

// 모델번호로 오인하기 쉬운 마케팅 토큰 접두어
const NON_MODEL_PREFIXES = /^(WIFI|USB|LED|IOT|UHD|QLED|BTU|KC|A[0-9]$)/i;

/**
 * 제목에서 모델번호처럼 보이는 토큰 추출 — 정규화 기준 6자 이상,
 * 마케팅 토큰(WiFi2024 등) 제외, 여러 개면 가장 긴 것을 선택.
 */
export function extractModelToken(title: string): string | null {
  const matches = title.match(/\b[A-Za-z]{1,4}[A-Za-z0-9-]*\d[A-Za-z0-9-]{3,}\b/g) ?? [];
  let best: string | null = null;
  for (const m of matches) {
    if (NON_MODEL_PREFIXES.test(m)) continue;
    if (normalizeModelNumber(m).length < 6) continue;
    if (!best || m.length > best.length) best = m;
  }
  return best;
}

/**
 * 원시 검색 결과 → 정규화·점수화된 후보 상위 maxCount개.
 * items가 null/빈 배열이어도 안전하게 [] 반환 (검색 실패가 계산기를 막지 않도록).
 */
export function rankCandidates(
  items: RawSearchItem[] | null | undefined,
  query: SearchQuery,
  source: "naver-shopping" | "naver-image",
  maxCount = 3
): AirconProductCandidate[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const seen = new Set<string>();
  const scored: AirconProductCandidate[] = [];

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    const title = stripHtml(raw?.title ?? "");
    const productUrl = (raw?.link ?? "").trim();
    if (!title || !productUrl) continue;
    // 같은 제목+링크 중복 제거
    const dedupeKey = `${normalizeModelNumber(title)}|${productUrl}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const brand = (raw?.brand || raw?.maker || "").trim() || null;
    const modelInTitle = extractModelToken(title);
    const { score, exactModelMatch } = scoreCandidate(
      { title, brand, mallName: raw?.mallName ?? null, modelInTitle },
      query
    );

    scored.push({
      id: `${source}-${i}`,
      brand,
      modelNumber: exactModelMatch ? query.modelNumber : modelInTitle,
      title,
      imageUrl: (raw?.image ?? "").trim() || null,
      thumbnailUrl: (raw?.thumbnail ?? raw?.image ?? "").trim() || null,
      productUrl,
      mallName: (raw?.mallName ?? "").trim() || null,
      productType: detectProductType(title),
      exactModelMatch,
      matchScore: score,
      source,
      sourceLabel: source === "naver-shopping" ? "네이버 쇼핑 검색" : "네이버 이미지 검색",
    });
  }

  scored.sort((a, b) => {
    // 완전 일치가 최우선, 그 다음 점수
    if (a.exactModelMatch !== b.exactModelMatch) return a.exactModelMatch ? -1 : 1;
    return b.matchScore - a.matchScore;
  });

  // 액세서리·비상품으로 점수가 크게 깎인 결과는 상위에 올리지 않는다
  return scored.filter((c) => c.matchScore > 0).slice(0, maxCount);
}
