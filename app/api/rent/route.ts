// 전월세 실거래가 조회 (v3 P5) — 국토교통부 RTMS 공공데이터
// 키 미설정이면 { ok:false, reason:"config" } → 클라이언트는 예시 데이터로 폴백.
import { NextRequest, NextResponse } from "next/server";
import {
  fetchRentDeals,
  isRtmsConfigured,
  summarizeDeals,
  type RentHouseType,
} from "@/lib/integrations/rtms";
import { PUBLIC_DATA_NOTICE, kstParts } from "@/lib/integrations/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES: RentHouseType[] = ["apt", "offi", "sh"];
const MAX_ROWS = 40;

function prevYearMonth(ym: string): string {
  let y = +ym.slice(0, 4);
  let m = +ym.slice(4);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}${String(m).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  let body: { lawdCd?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const lawdCd = (body.lawdCd || "").trim();
  const type = (body.type || "sh") as RentHouseType;
  if (!/^\d{5}$/.test(lawdCd) || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!isRtmsConfigured()) {
    return NextResponse.json({ ok: false, reason: "config" });
  }

  // 실거래 신고는 1~2달 지연될 수 있어 이번 달부터 최대 3개월 거슬러 조회
  const { year, month } = kstParts();
  let ym = `${year}${month}`;
  for (let i = 0; i < 3; i++) {
    const deals = await fetchRentDeals(lawdCd, ym, type);
    if (deals === null) {
      return NextResponse.json({ ok: false, reason: "upstream" });
    }
    if (deals.length > 0) {
      return NextResponse.json({
        ok: true,
        yearMonth: ym,
        type,
        summary: summarizeDeals(deals),
        // 최근 계약 위주 상위 N건만 (payload 절약)
        deals: deals.slice(0, MAX_ROWS),
        truncated: deals.length > MAX_ROWS ? deals.length - MAX_ROWS : 0,
        notice: PUBLIC_DATA_NOTICE,
        source: "국토교통부 실거래가 공개시스템",
      });
    }
    ym = prevYearMonth(ym);
  }
  return NextResponse.json({ ok: false, reason: "empty" });
}
