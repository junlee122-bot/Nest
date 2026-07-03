// 식약처 식품안전나라 조리식품 레시피 DB(COOKRCP01) (v6) — 서버 전용
//
// '남은 재료 처리'에 AI 추천과 별도로 검증된 공공 레시피(사진·열량 포함)를 곁들인다.
// 키가 없거나 실패하면 null → 해당 섹션 자체를 생략(기능 손실 없음).
// 발급: https://www.foodsafetykorea.go.kr/api/newDatasetDetail.do?searchDataName=COOKRCP01
//       (식품안전나라 회원가입 → 오픈API 인증키)

import { safeFetch, safeJson, withCache } from "./core";
import type { DbRecipe } from "@/lib/types";

export function isRecipeDbConfigured(): boolean {
  return !!process.env.FOODSAFETY_API_KEY;
}

interface CookRcpRow {
  RCP_NM?: string;
  RCP_PARTS_DTLS?: string;
  ATT_FILE_NO_MAIN?: string;
  INFO_ENG?: string; // 열량
  [key: string]: string | undefined; // MANUAL01..MANUAL20
}

function collectSteps(row: CookRcpRow): string[] {
  const steps: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const key = `MANUAL${String(i).padStart(2, "0")}`;
    const raw = row[key];
    if (!raw) continue;
    // "1. 손질한다\na" 형태 → 선두 번호·개행 정리
    const s = raw.replace(/^\s*\d+\s*[.)]?\s*/, "").replace(/\s+/g, " ").trim();
    if (s) steps.push(s);
    if (steps.length >= 6) break; // 자취 앱 화면엔 6단계면 충분
  }
  return steps;
}

/**
 * 재료명으로 공공 레시피 검색. 24시간 캐시.
 * @param ingredient 예: "두부"
 */
export async function fetchDbRecipes(
  ingredient: string,
  limit = 3
): Promise<DbRecipe[] | null> {
  const key = process.env.FOODSAFETY_API_KEY;
  if (!key) return null;
  const q = ingredient.trim().slice(0, 20);
  if (!q) return null;

  return withCache(`cookrcp:${q}:${limit}`, 24 * 60 * 60_000, async () => {
    const url =
      `https://openapi.foodsafetykorea.go.kr/api/${encodeURIComponent(key)}` +
      `/COOKRCP01/json/1/${limit}/RCP_PARTS_DTLS=${encodeURIComponent(q)}`;
    const data = await safeJson<{
      COOKRCP01?: { row?: CookRcpRow[]; RESULT?: { CODE?: string } };
    }>(await safeFetch(url, { timeoutMs: 8000 }));
    const rows = data?.COOKRCP01?.row;
    if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

    const recipes: DbRecipe[] = [];
    for (const r of rows) {
      if (!r.RCP_NM) continue;
      const steps = collectSteps(r);
      if (steps.length === 0) continue;
      recipes.push({
        name: r.RCP_NM.trim(),
        ingredients: (r.RCP_PARTS_DTLS || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 120),
        steps,
        image: r.ATT_FILE_NO_MAIN?.startsWith("http") ? r.ATT_FILE_NO_MAIN : null,
        kcal: r.INFO_ENG ? `${r.INFO_ENG}kcal` : null,
        source: "식약처 식품안전나라 조리식품 레시피DB",
      });
    }
    return recipes.length > 0 ? recipes : null;
  });
}
