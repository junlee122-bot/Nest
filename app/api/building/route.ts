// 건축물대장 표제부 조회 (v3 P5) — 키 미설정이면 reason:"config"로 폴백
import { NextRequest, NextResponse } from "next/server";
import { fetchBuildingInfo, isBuildingConfigured } from "@/lib/integrations/building";
import { PUBLIC_DATA_NOTICE } from "@/lib/integrations/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { bcode?: string; bun?: string; ji?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const bcode = (body.bcode || "").trim();
  const bun = (body.bun || "").trim();
  if (!/^\d{10}$/.test(bcode) || !bun) {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!isBuildingConfigured()) {
    return NextResponse.json({ ok: false, reason: "config" });
  }

  const info = await fetchBuildingInfo(bcode, bun, body.ji || "0");
  if (!info) {
    return NextResponse.json({ ok: false, reason: "empty" });
  }
  return NextResponse.json({
    ok: true,
    info,
    notice: PUBLIC_DATA_NOTICE,
    source: "국토교통부 건축물대장(건축HUB)",
  });
}
