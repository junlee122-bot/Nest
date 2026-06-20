import { NextRequest, NextResponse } from "next/server";
import { authorizeUrl, isOpenBankingConfigured } from "@/lib/openbanking";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 오픈뱅킹 동의 페이지로 리다이렉트 (state 는 httpOnly 쿠키로 CSRF 방지)
export async function GET(req: NextRequest) {
  if (!isOpenBankingConfigured()) {
    return NextResponse.redirect(new URL("/money?berror=config", req.url));
  }
  const state = randomUUID().replace(/-/g, "");
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("ob_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
