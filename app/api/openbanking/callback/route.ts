import { NextRequest, NextResponse } from "next/server";
import { exchangeToken } from "@/lib/openbanking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 인가코드 → 토큰 교환 후 httpOnly 쿠키(데모 세션)에 저장. DB 영구저장 없음.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("ob_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/money?berror=state", req.url));
  }

  try {
    const token = await exchangeToken(code);
    const res = NextResponse.redirect(new URL("/money?connected=1", req.url));
    // 토큰은 httpOnly 쿠키에만(클라이언트 JS 접근 불가), 만료시간까지만 보관
    res.cookies.set("ob_token", JSON.stringify(token), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Math.max(60, Math.floor((token.expires_at - Date.now()) / 1000)),
      path: "/",
    });
    res.cookies.delete("ob_state");
    return res;
  } catch {
    // 토큰·금융정보는 로그에 남기지 않음
    return NextResponse.redirect(new URL("/money?berror=token", req.url));
  }
}
