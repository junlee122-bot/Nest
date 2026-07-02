import { NextRequest, NextResponse } from "next/server";
import { grocerySystemPrompt } from "@/lib/prompts";
import { callClaudeJson } from "@/lib/llm";
import { validateGrocery } from "@/lib/validate";
import type { GroceryMode, GroceryResponse, GroceryResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse<GroceryResponse>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "서버에 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }

  let body: {
    mode?: string;
    budget?: string;
    days?: string;
    meals?: string;
    diet?: string;
    difficulty?: string;
    ingredients?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const mode = body.mode as GroceryMode;
  if (mode !== "plan" && mode !== "use") {
    return NextResponse.json({ ok: false, error: "알 수 없는 요청입니다." }, { status: 400 });
  }

  let userText: string;
  if (mode === "plan") {
    const budget = (body.budget || "").trim();
    const days = (body.days || "7일").trim();
    const meals = (body.meals || "점심·저녁").trim();
    const diet = (body.diet || "").trim();
    const difficulty = (body.difficulty || "간단한 것").trim();
    if (!budget) {
      return NextResponse.json(
        { ok: false, error: "예산을 입력해주세요." },
        { status: 400 }
      );
    }
    userText =
      `1주 예산: ${budget}\n기간: ${days}\n끼니 범위: ${meals}\n` +
      `식성/제약: ${diet || "특별히 없음"}\n조리 난이도 선호: ${difficulty}\n` +
      `위 조건으로 1인 가구 식단과 장보기 리스트를 짜주세요.`;
  } else {
    const ingredients = (body.ingredients || "").trim();
    if (!ingredients) {
      return NextResponse.json(
        { ok: false, error: "가지고 있는 재료를 입력해주세요." },
        { status: 400 }
      );
    }
    if (ingredients.length > 1000) {
      return NextResponse.json(
        { ok: false, error: "재료 목록이 너무 길어요. 줄여서 입력해주세요." },
        { status: 400 }
      );
    }
    userText = `가지고 있는 재료: ${ingredients}\n이 재료들을 최대한 소진하는 메뉴를 추천해주세요.`;
  }

  try {
    const call = await callClaudeJson({
      systemStatic: grocerySystemPrompt(mode),
      messages: [{ role: "user", content: userText }],
      maxTokens: 2800,
      // 식단은 약간의 다양성이 좋아 상한(0.3)을 사용
      temperature: 0.3,
      validate: validateGrocery(mode),
    });
    if (!call) {
      return NextResponse.json(
        { ok: false, error: "결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const result = { mode, ...call.parsed } as GroceryResult;
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const e = err as { status?: number };
    if (e?.status === 429) {
      return NextResponse.json(
        { ok: false, error: "지금 요청이 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    console.error("[grocery] error status:", e?.status ?? "unknown");
    return NextResponse.json(
      { ok: false, error: "둥지가 잠시 응답하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
