// 거래내역 → 주거비 카테고리 분류 (1차: 키워드 규칙)
import type { ObTransaction } from "./openbanking";

export type HousingKey =
  | "rent"
  | "maintenance"
  | "electric"
  | "gas"
  | "water"
  | "telecom"
  | "etc";

export const HOUSING_LABEL: Record<HousingKey, string> = {
  rent: "월세",
  maintenance: "관리비",
  electric: "전기",
  gas: "가스",
  water: "수도",
  telecom: "통신비",
  etc: "기타",
};

// 주거비로 집계할 카테고리(기타 제외)
export const HOUSING_KEYS: HousingKey[] = [
  "rent",
  "maintenance",
  "electric",
  "gas",
  "water",
  "telecom",
];

const RULES: { key: HousingKey; keywords: string[] }[] = [
  { key: "electric", keywords: ["한국전력", "한전", "전기", "KEPCO"] },
  { key: "gas", keywords: ["도시가스", "가스", "지역난방", "예스코", "삼천리"] },
  { key: "water", keywords: ["상수도", "수도", "워터", "물세"] },
  {
    key: "telecom",
    keywords: ["SKT", "KT", "LGU", "LG유플러스", "유플러스", "통신", "텔레콤", "브로드밴드", "인터넷", "헬로"],
  },
  { key: "maintenance", keywords: ["관리비", "관리사무소", "아파트관리", "주택관리"] },
  { key: "rent", keywords: ["월세", "임대", "집세", "RENT", "전월세"] },
];

export function classify(content: string): HousingKey {
  const c = (content || "").toUpperCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => c.includes(k.toUpperCase()))) return rule.key;
  }
  return "etc";
}

export interface CategorySum {
  key: HousingKey;
  label: string;
  amount: number;
  count: number;
}

export interface HousingSummary {
  categories: CategorySum[]; // 주거비 6종(0원 포함, 큰 순)
  total: number; // 총 주거비(기타 제외)
  etc: number; // 기타 출금 합계(참고)
  txCount: number; // 분석한 출금 건수
}

export function summarize(txs: ObTransaction[]): HousingSummary {
  const sums = new Map<HousingKey, { amount: number; count: number }>();
  let etc = 0;
  let txCount = 0;

  for (const t of txs) {
    // 출금(지출)만 집계
    if (!t.inout.includes("출금")) continue;
    txCount++;
    const key = classify(t.content);
    if (key === "etc") {
      etc += t.amount;
      continue;
    }
    const cur = sums.get(key) || { amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    sums.set(key, cur);
  }

  const categories: CategorySum[] = HOUSING_KEYS.map((key) => ({
    key,
    label: HOUSING_LABEL[key],
    amount: sums.get(key)?.amount || 0,
    count: sums.get(key)?.count || 0,
  })).sort((a, b) => b.amount - a.amount);

  const total = categories.reduce((s, c) => s + c.amount, 0);
  return { categories, total, etc, txCount };
}
