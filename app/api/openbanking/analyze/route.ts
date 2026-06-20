import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getTransactions,
  getUserAccounts,
  recentRange,
  type ObToken,
  type ObTransaction,
} from "@/lib/openbanking";
import { summarize } from "@/lib/housing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export async function GET(req: NextRequest) {
  const raw = req.cookies.get("ob_token")?.value;
  if (!raw) {
    return NextResponse.json(
      { ok: false, error: "먼저 오픈뱅킹 연결이 필요해요.", needConnect: true },
      { status: 401 }
    );
  }

  let token: ObToken;
  try {
    token = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "연결 정보가 올바르지 않아요. 다시 연결해주세요.", needConnect: true },
      { status: 400 }
    );
  }

  if (!token.access_token || token.expires_at <= Date.now()) {
    return NextResponse.json(
      { ok: false, error: "연결이 만료됐어요. 다시 연결해주세요.", needConnect: true },
      { status: 401 }
    );
  }

  try {
    const accounts = await getUserAccounts(token);
    if (accounts.length === 0) {
      return NextResponse.json({
        ok: true,
        mock: true,
        empty: true,
        message: "연결된 계좌에서 거래내역을 찾지 못했어요. (테스트베드 모의계좌를 등록했는지 확인해주세요)",
      });
    }

    const { from, to } = recentRange(62);
    // 최대 3개 계좌까지 합산(테스트베드 PoC)
    const all: ObTransaction[] = [];
    for (const acc of accounts.slice(0, 3)) {
      if (!acc.fintech_use_num) continue;
      try {
        const txs = await getTransactions(token, acc.fintech_use_num, from, to);
        all.push(...txs);
      } catch {
        // 일부 계좌 실패는 건너뛰고 계속 (조회 전용 계좌 등)
      }
    }

    const summary = summarize(all);

    if (summary.txCount === 0) {
      return NextResponse.json({
        ok: true,
        mock: true,
        empty: true,
        message: "최근 약 2개월간 출금 거래가 없어요. (테스트베드 모의 거래내역을 등록해보세요)",
        period: { from, to },
      });
    }

    const comment = await maybeComment(summary.total, summary.categories);

    return NextResponse.json({
      ok: true,
      mock: true,
      period: { from, to },
      total: summary.total,
      etc: summary.etc,
      txCount: summary.txCount,
      categories: summary.categories,
      comment,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    // 토큰·금융정보는 로그에 남기지 않음 — 코드 식별자만
    console.error("[openbanking/analyze]", msg);
    if (msg === "org_code_missing") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "거래내역조회에는 이용기관코드(OPENBANKING_ORG_CODE) 설정이 필요해요. 설정 후 다시 시도해주세요.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "분석 중 문제가 생겼어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

// 선택: Claude 로 한 단락 요약/절약 코멘트 (키 없으면 생략, 과금 최소화)
async function maybeComment(
  total: number,
  categories: { label: string; amount: number }[]
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const lines = categories
    .filter((c) => c.amount > 0)
    .map((c) => `${c.label} ${c.amount.toLocaleString("ko-KR")}원`)
    .join(", ");
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        "당신은 자취생을 돕는 주거비 코치 '둥지'입니다. 주어진 최근 약 2개월 주거비 집계를 보고, " +
        "따뜻하고 신뢰감 있는 존댓말로 한 단락(3~4문장) 요약과 현실적인 절약 코멘트를 한국어로 제공하세요. " +
        "단정·과장 금지, 숫자는 자연스럽게 언급. JSON·머리말 없이 본문만 출력하세요.",
      messages: [
        {
          role: "user",
          content: `최근 약 2개월 주거비 합계 ${total.toLocaleString("ko-KR")}원. 항목별: ${lines}. (오픈뱅킹 테스트베드 모의데이터)`,
        },
      ],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || null;
  } catch {
    return null; // 코멘트는 부가기능 — 실패해도 분석 결과는 그대로
  }
}
