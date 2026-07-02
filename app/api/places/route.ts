// 주변 업체 미리보기 (v3 P5) — 카카오 로컬 키워드 검색
// 키 미설정이면 reason:"config" → 클라이언트는 지도 딥링크만 노출(기존 동작).
// 위치·연락처는 받지 않는다 — 사용자가 적은 검색어만 전달.
import { NextRequest, NextResponse } from "next/server";
import { isKakaoConfigured, searchPlaces } from "@/lib/integrations/kakaoLocal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q || q.length > 60) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!isKakaoConfigured()) {
    return NextResponse.json({ ok: false, reason: "config" });
  }
  const places = await searchPlaces(q);
  if (!places) {
    return NextResponse.json({ ok: false, reason: "upstream" });
  }
  return NextResponse.json({
    ok: true,
    places,
    notice: "카카오 검색 결과로, 둥지가 업체를 보증하지 않아요.",
  });
}
