// 예산 초과 대체재 (C-1) — 내장 큐레이션 스왑 테이블
// 참고가격표(PRICE_REFS)에 실제로 있는 품목으로만 대체를 제안한다.
// 새 API·DB 없이 서버 후처리로 동작하며, 절약액은 참고가 기준 추정치다.

import { PRICE_REFS, type PriceRef } from "./prices";

export interface SwapRule {
  from: string[]; // 리스트 품목명 매칭 키워드
  to: string; // PRICE_REFS 내 품목명
  why: string; // 요리 관점에서 대체가 성립하는 이유
}

// 자취 요리에서 실제로 역할이 겹치는 조합만 — 억지 대체는 넣지 않는다.
const SWAP_RULES: SwapRule[] = [
  {
    from: ["삼겹살", "목살", "삼겹"],
    to: "돼지 앞다리살",
    why: "볶음·구이에 두루 쓰이고 100g당 가격이 절반 수준이에요",
  },
  {
    from: ["소고기", "한우", "우삼겹", "차돌"],
    to: "돼지 앞다리살",
    why: "볶음·국거리는 돼지고기로 바꾸면 가장 크게 줄어요",
  },
  {
    from: ["닭다리", "닭정육", "닭날개"],
    to: "닭가슴살(냉장)",
    why: "볶음·덮밥용이면 100g당 단가가 더 낮은 부위로 충분해요",
  },
  {
    from: ["스팸", "런천미트", "햄"],
    to: "참치캔",
    why: "단백질 반찬 역할은 같고 캔당 가격이 낮아요",
  },
  {
    from: ["비엔나", "소시지"],
    to: "사각어묵",
    why: "볶음 반찬 대체로 한 봉 가격이 더 낮아요",
  },
  // 즉석밥→쌀은 끼니당 단가는 낮아지지만 이번 주 지출은 오히려 커져서
  // '예산 초과 줄이기' 맥락에는 넣지 않는다.
  {
    from: ["사과", "방울토마토", "딸기", "포도", "샤인머스캣"],
    to: "바나나",
    why: "과일 몫은 단가가 가장 낮은 바나나로 채울 수 있어요",
  },
  {
    from: ["파스타", "스파게티"],
    to: "소면",
    why: "면 요리 몫을 소면으로 바꾸면 g당 가격이 낮아요",
  },
  {
    from: ["냉동만두", "왕교자", "만두"],
    to: "떡볶이떡",
    why: "간단 한 끼 몫이라면 떡 요리가 봉당 가격이 낮아요",
  },
];

export interface SubstituteHit {
  to: PriceRef; // 대체재 참고가 정보
  why: string;
}

const norm = (s: string) => s.replace(/\s/g, "").replace(/\(.+?\)/g, "");

/** 품목명에 대응하는 대체재 룰 (없으면 null) */
export function findSubstitute(itemName: string): SubstituteHit | null {
  const q = norm(itemName);
  if (!q) return null;
  for (const rule of SWAP_RULES) {
    if (!rule.from.some((k) => q.includes(norm(k)))) continue;
    // 이미 대체재 자체를 산 경우(예: '돼지 앞다리살')는 제안하지 않음
    if (q.includes(norm(rule.to))) continue;
    const ref = PRICE_REFS.find((p) => p.name === rule.to);
    if (!ref) continue;
    return { to: ref, why: rule.why };
  }
  return null;
}

/**
 * 예산 문자열 → 원 단위 숫자.
 * "35000" / "35,000원" / "3만5천" / "3만 5000" / "5만원" / "3.5만" 지원.
 * "주당 3만원"처럼 앞뒤에 말이 붙어도 금액 토큰만 뽑아 해석한다.
 * 해석이 안 되면 null — 초과 카드를 잘못 띄우느니 안 띄우는 쪽이 안전하다.
 */
export function parseBudgetWon(input: string): number | null {
  const token = input.match(
    /\d[\d,.]*\s*만(?:\s*\d[\d,.]*\s*천?)?\s*원?|\d[\d,.]*\s*천\s*원?|\d[\d,.]*\s*원?/
  );
  if (!token) return null;
  const t = token[0].replace(/\s/g, "").replace(/,/g, "").replace(/원$/, "");
  if (!t) return null;
  const man = t.match(/^(\d+(?:\.\d+)?)만(.*)$/);
  if (man) {
    let total = Math.round(parseFloat(man[1]) * 10000);
    const rest = man[2];
    if (rest) {
      const chon = rest.match(/^(\d+(?:\.\d+)?)천원?$/);
      const plain = rest.match(/^(\d+)원?$/);
      if (chon) total += Math.round(parseFloat(chon[1]) * 1000);
      else if (plain) total += parseInt(plain[1], 10);
      else return total; // 해석 불가한 꼬리는 만 단위까지만
    }
    return total;
  }
  const chonOnly = t.match(/^(\d+(?:\.\d+)?)천원?$/);
  if (chonOnly) return Math.round(parseFloat(chonOnly[1]) * 1000);
  const digits = t.match(/^(\d+)원?$/);
  if (digits) return parseInt(digits[1], 10);
  return null;
}
