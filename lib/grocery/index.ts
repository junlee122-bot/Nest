// 장보기 코치 데이터 레이어 (v6) — 내장 큐레이션 DB 매칭·프롬프트 주입 헬퍼
//
// 3종 정적 DB(제철 달력·보관법·참고가격)는 키 없이 항상 동작하는 기본 데이터이고,
// KAMIS(오늘 시세)·식약처 레시피DB는 키가 있을 때 위에 얹힌다.

import { SEASONAL, type SeasonalItem, type SeasonalMonth } from "./seasonal";
import { STORAGE_DB, type StorageInfo } from "./storage";
import { PRICE_REFS, type PriceRef } from "./prices";

export type { SeasonalItem, SeasonalMonth, StorageInfo, PriceRef };

// ── 제철 ─────────────────────────────────────────────────────
export function seasonalForMonth(month: number): SeasonalMonth | null {
  return SEASONAL.find((m) => m.month === month) ?? null;
}

/** 이번 달 제철 전체 이름 목록 (매칭용) */
export function seasonalNames(month: number): SeasonalItem[] {
  const m = seasonalForMonth(month);
  if (!m) return [];
  return [...m.vegetables, ...m.fruits, ...m.seafood];
}

const norm = (s: string) => s.replace(/\s/g, "").replace(/\(.+?\)/g, "");

/** 품목명이 이번 달 제철 목록과 매칭되는지 */
export function matchSeasonal(itemName: string, month: number): SeasonalItem | null {
  const q = norm(itemName);
  if (!q) return null;
  for (const it of seasonalNames(month)) {
    const n = norm(it.name);
    if (q.includes(n) || n.includes(q)) return it;
  }
  return null;
}

/** 이번 달 제철 추천 상위 n개 (채소·과일·수산 섞어서) — UI 표시용 */
export function seasonalPicks(month: number): SeasonalItem[] {
  const m = seasonalForMonth(month);
  if (!m) return [];
  return [
    ...m.vegetables.slice(0, 3),
    ...m.fruits.slice(0, 2),
    ...m.seafood.slice(0, 2),
  ];
}

export function seasonalPromptBlock(month: number): string | null {
  const m = seasonalForMonth(month);
  if (!m) return null;
  const fmt = (arr: SeasonalItem[]) => arr.map((i) => i.name).join(", ");
  return (
    `[이번 달 제철 — ${month}월, 한국 기준]\n` +
    `채소: ${fmt(m.vegetables)}\n과일: ${fmt(m.fruits)}\n수산물: ${fmt(m.seafood)}`
  );
}

// ── 보관법 ────────────────────────────────────────────────────
export function findStorage(itemName: string): StorageInfo | null {
  const q = norm(itemName);
  if (!q) return null;
  let best: StorageInfo | null = null;
  let bestLen = 0;
  for (const s of STORAGE_DB) {
    for (const cand of [s.name, ...s.aliases]) {
      const n = norm(cand);
      if (!n) continue;
      if ((q.includes(n) || n.includes(q)) && n.length > bestLen) {
        best = s;
        bestLen = n.length;
      }
    }
  }
  return best;
}

/** 남은 재료 입력을 재료명 배열로 (쉼표/줄바꿈/가운뎃점 구분) */
export function parseIngredients(input: string): string[] {
  return input
    .split(/[,\n·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 20)
    .slice(0, 20);
}

/** '남은 재료' 프롬프트 주입용 — 입력 재료들의 보관 기한 */
export function storagePromptBlock(ingredients: string[]): string | null {
  const lines: string[] = [];
  for (const ing of ingredients) {
    const s = findStorage(ing);
    if (s) lines.push(`- ${ing}: ${s.method} ${s.days}`);
  }
  if (lines.length === 0) return null;
  return `[보관 기한 정보 — 개봉/구매 후 신선 소비 목안]\n${lines.join("\n")}`;
}

// ── 참고 가격 ─────────────────────────────────────────────────
export function findPriceRef(itemName: string): PriceRef | null {
  const q = norm(itemName);
  if (!q) return null;
  let best: PriceRef | null = null;
  let bestLen = 0;
  for (const p of PRICE_REFS) {
    const n = norm(p.name);
    if ((q.includes(n) || n.includes(q)) && n.length > bestLen) {
      best = p;
      bestLen = n.length;
    }
  }
  return best;
}

export function priceRefPromptBlock(): string {
  const lines = PRICE_REFS.map(
    (p) =>
      `- ${p.name}(${p.unit}): ${p.low.toLocaleString("ko-KR")}~${p.high.toLocaleString("ko-KR")}원`
  );
  return `[참고 가격 — 서울 소매가 범위, 내장 데이터]\n${lines.join("\n")}`;
}

export function priceRefNames(): string[] {
  return PRICE_REFS.map((p) => p.name);
}
