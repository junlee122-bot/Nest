// GET /api/aircon/products?brand=&model=&type= — 제품 검색 (서버 전용)
//
// 1차: 네이버 쇼핑 검색 API → 없으면 네이버 이미지 검색 fallback.
// Client ID/Secret은 환경변수로만 읽는다 (클라이언트 노출 금지).
// 키 미설정·검색 실패여도 ok:true + 빈 후보로 응답해 계산기를 막지 않는다.

import { NextRequest, NextResponse } from "next/server";
import { RATE_LIMIT_MESSAGE, rateLimited } from "@/lib/ratelimit";
import { safeFetch } from "@/lib/integrations/core";
import { rankCandidates, type RawSearchItem, type SearchQuery } from "@/lib/aircon/search";
import type { AirconProductsResponse } from "@/lib/aircon/types";
import type { AirconType } from "@/lib/electricity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AIRCON_TYPES: (AirconType | "unknown")[] = [
  "wall",
  "standing",
  "window",
  "portable",
  "multi",
  "unknown",
];

async function naverSearch(
  path: "shop" | "image",
  query: string,
  clientId: string,
  clientSecret: string
): Promise<RawSearchItem[] | null> {
  const url = `https://openapi.naver.com/v1/search/${path}.json?query=${encodeURIComponent(
    query
  )}&display=20`;
  const res = await safeFetch(url, {
    timeoutMs: 4000,
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });
  if (!res) return null;
  try {
    const json = (await res.json()) as { items?: RawSearchItem[] };
    return Array.isArray(json.items) ? json.items : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<AirconProductsResponse>> {
  if (rateLimited(req, "aircon-search")) {
    return NextResponse.json({ ok: false, error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  const sp = req.nextUrl.searchParams;
  const model = (sp.get("model") ?? "").trim().slice(0, 60);
  const brand = (sp.get("brand") ?? "").trim().slice(0, 40) || null;
  const typeParam = (sp.get("type") ?? "unknown") as AirconType | "unknown";
  const productType = AIRCON_TYPES.includes(typeParam) ? typeParam : "unknown";

  if (model.length < 3) {
    return NextResponse.json(
      { ok: false, error: "모델번호를 3자 이상 입력해주세요." },
      { status: 400 }
    );
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    // 키 미설정 — 기능은 조용히 비활성, 계산기는 계속 동작
    return NextResponse.json({ ok: true, configured: false, candidates: [] });
  }

  const query: SearchQuery = { brand, modelNumber: model, productType };
  const searchTerm = `${brand ? `${brand} ` : ""}${model} 에어컨`;

  // 1차: 쇼핑 검색
  const shopItems = await naverSearch("shop", searchTerm, clientId, clientSecret);
  let candidates = rankCandidates(shopItems, query, "naver-shopping");

  // 쇼핑 결과가 없을 때만 이미지 검색 fallback — 실패해도 빈 후보로 계속
  if (candidates.length === 0) {
    const imageItems = await naverSearch("image", searchTerm, clientId, clientSecret);
    candidates = rankCandidates(imageItems, query, "naver-image");
  }

  return NextResponse.json({ ok: true, configured: true, candidates });
}
