// ① 법제처 국가법령정보 공동활용 API (v3 P5) — 서버 전용
//
// 계약서 체커의 법령 근거를 '요약(gist)'에서 '현행 원문 조문'으로 승격.
// 키(OC)가 없거나 실패하면 null → 호출부는 기존 lib/legal/laws.ts 요약으로 폴백.
// 발급: https://open.law.go.kr (기관코드 OC = 가입 시 이메일 ID)

import { safeFetch, safeJson, withCache } from "./core";

const BASE = "https://www.law.go.kr/DRF";

export function isLawConfigured(): boolean {
  return !!process.env.LAW_API_OC;
}

interface LawSearchResponse {
  LawSearch?: {
    law?: Array<{ 법령ID?: string; 법령명한글?: string; 시행일자?: string }> | {
      법령ID?: string;
      법령명한글?: string;
      시행일자?: string;
    };
  };
}

// 조문단위 구조 (법제처 JSON) — 필요한 필드만
interface Ho {
  호내용?: string;
}
interface Hang {
  항내용?: string;
  호?: Ho[] | Ho;
}
interface Article {
  조문번호?: string;
  조문여부?: string;
  조문내용?: string;
  항?: Hang[] | Hang;
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function articleText(a: Article): string {
  const parts: string[] = [];
  if (a.조문내용) parts.push(String(a.조문내용).trim());
  for (const h of toArray(a.항)) {
    if (h?.항내용) parts.push(String(h.항내용).trim());
    for (const ho of toArray(h?.호)) {
      if (ho?.호내용) parts.push(String(ho.호내용).trim());
    }
  }
  return parts.join("\n");
}

/**
 * 법령명으로 현행 법령의 특정 조문 원문을 가져온다.
 * @param lawName 예: "주택임대차보호법"
 * @param articles 필요한 조문 번호 (예: [3, 4, 6, 7, 8, 10])
 * @returns 조문 텍스트 묶음 or null(미설정/실패)
 */
export async function fetchLawArticles(
  lawName: string,
  articles: number[]
): Promise<{ name: string; effectiveDate?: string; text: string } | null> {
  const oc = process.env.LAW_API_OC;
  if (!oc) return null;

  return withCache(`law:${lawName}:${articles.join(",")}`, 24 * 60 * 60_000, async () => {
    // 1) 법령 검색 → 법령ID
    const searchUrl = `${BASE}/lawSearch.do?OC=${encodeURIComponent(oc)}&target=law&type=JSON&query=${encodeURIComponent(lawName)}&display=5`;
    const search = await safeJson<LawSearchResponse>(await safeFetch(searchUrl));
    const laws = toArray(search?.LawSearch?.law);
    const exact = laws.find((l) => l.법령명한글?.trim() === lawName) ?? laws[0];
    if (!exact?.법령ID) return null;

    // 2) 본문 조회 → 조문 추출
    const bodyUrl = `${BASE}/lawService.do?OC=${encodeURIComponent(oc)}&target=law&type=JSON&ID=${encodeURIComponent(exact.법령ID)}`;
    const body = await safeJson<{
      법령?: { 조문?: { 조문단위?: Article[] | Article } };
    }>(await safeFetch(bodyUrl, { timeoutMs: 8000 }));
    const units = toArray(body?.법령?.조문?.조문단위);
    if (units.length === 0) return null;

    const wanted = new Set(articles.map(String));
    const picked = units.filter(
      (u) => u.조문여부 !== "전문" && u.조문번호 && wanted.has(String(u.조문번호))
    );
    if (picked.length === 0) return null;

    const text = picked
      .map((u) => articleText(u))
      .join("\n\n")
      // 프롬프트 예산 보호 — 조문이 비정상적으로 길면 자름
      .slice(0, 6000);

    return {
      name: exact.법령명한글 ?? lawName,
      effectiveDate: exact.시행일자,
      text,
    };
  });
}
