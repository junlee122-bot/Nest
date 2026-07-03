import { NextRequest, NextResponse } from "next/server";
import { grocerySystemPrompt } from "@/lib/prompts";
import { callClaudeJson } from "@/lib/llm";
import { RATE_LIMIT_MESSAGE, rateLimited } from "@/lib/ratelimit";
import { validateGrocery } from "@/lib/validate";
import {
  findPriceRef,
  findStorage,
  matchSeasonal,
  parseIngredients,
  priceRefNames,
  priceRefPromptBlock,
  seasonalPicks,
  seasonalPromptBlock,
  storagePromptBlock,
} from "@/lib/grocery";
import { findSubstitute, parseBudgetWon } from "@/lib/grocery/substitutes";
import {
  fetchKamisToday,
  fetchKamisTodayFast,
  kamisPromptBlock,
  matchKamis,
} from "@/lib/integrations/kamis";
import { fetchDbRecipes } from "@/lib/integrations/recipeDb";
import { fetchFoodImage } from "@/lib/integrations/foodImages";
import { kstParts } from "@/lib/integrations/core";
import type {
  BudgetFix,
  BudgetSwap,
  GroceryMeta,
  GroceryMode,
  GroceryPlanResult,
  GroceryResponse,
  GroceryResult,
  GroceryUseResult,
  ShoppingItem,
  StorageNote,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const won = (n: number) => n.toLocaleString("ko-KR");

export async function POST(req: NextRequest): Promise<NextResponse<GroceryResponse>> {
  if (rateLimited(req)) {
    return NextResponse.json({ ok: false, error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }
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

  const month = parseInt(kstParts().month, 10);

  // ── 요청별 데이터 컨텍스트 구성 (v6) ─────────────────────────
  // 정적 DB(제철·참고가·보관기한)는 항상, KAMIS는 키가 있을 때만.
  const dynamicBlocks: string[] = [];
  let userText: string;
  let ingredients: string[] = [];
  let kamis: Awaited<ReturnType<typeof fetchKamisToday>> = null;

  if (mode === "plan") {
    const budget = (body.budget || "").trim();
    const days = (body.days || "7일").trim();
    const meals = (body.meals || "점심·저녁").trim();
    const diet = (body.diet || "").trim();
    const difficulty = (body.difficulty || "간단한 것").trim();
    if (!budget) {
      return NextResponse.json({ ok: false, error: "예산을 입력해주세요." }, { status: 400 });
    }
    userText =
      `1주 예산: ${budget}\n기간: ${days}\n끼니 범위: ${meals}\n` +
      `식성/제약: ${diet || "특별히 없음"}\n조리 난이도 선호: ${difficulty}\n` +
      `위 조건으로 1인 가구 식단과 장보기 리스트를 짜주세요.`;

    const seasonBlock = seasonalPromptBlock(month);
    if (seasonBlock) dynamicBlocks.push(seasonBlock);
    dynamicBlocks.push(priceRefPromptBlock());

    // KAMIS는 매우 느릴 수 있어(실측 20~90초) 2.5초만 기다리고 폴백 —
    // 백그라운드에서 완료되면 캐시에 들어가 다음 요청부터 '오늘 시세'가 붙는다.
    kamis = await fetchKamisTodayFast(2500);
    if (kamis) {
      const block = kamisPromptBlock(kamis, priceRefNames());
      if (block) dynamicBlocks.push(block);
    }
  } else {
    const raw = (body.ingredients || "").trim();
    if (!raw) {
      return NextResponse.json(
        { ok: false, error: "가지고 있는 재료를 입력해주세요." },
        { status: 400 }
      );
    }
    if (raw.length > 1000) {
      return NextResponse.json(
        { ok: false, error: "재료 목록이 너무 길어요. 줄여서 입력해주세요." },
        { status: 400 }
      );
    }
    userText = `가지고 있는 재료: ${raw}\n이 재료들을 최대한 소진하는 메뉴를 추천해주세요.`;
    ingredients = parseIngredients(raw);
    const block = storagePromptBlock(ingredients);
    if (block) dynamicBlocks.push(block);
  }

  try {
    const call = await callClaudeJson({
      systemStatic: grocerySystemPrompt(mode),
      systemDynamic: dynamicBlocks.length > 0 ? dynamicBlocks.join("\n\n") : undefined,
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

    let result = { mode, ...call.parsed } as GroceryResult;

    // ── 서버 후처리: 내장 DB·시세 매칭 부착 (AI 출력과 분리) ────
    if (result.mode === "plan") {
      result = enrichPlan(result as GroceryPlanResult, month, kamis, (body.budget || "").trim());
    } else {
      result = await enrichUse(result as GroceryUseResult, ingredients);
    }

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

function enrichPlan(
  r: GroceryPlanResult,
  month: number,
  kamis: Awaited<ReturnType<typeof fetchKamisToday>>,
  budgetRaw: string
): GroceryPlanResult {
  const list: ShoppingItem[] = (r.shopping_list || []).map((it) => {
    const seasonal = it.seasonal === true || !!matchSeasonal(it.item, month);
    const st = findStorage(it.item);
    const pr = findPriceRef(it.item);
    const km = kamis ? matchKamis(it.item, kamis.items) : null;
    return {
      ...it,
      seasonal,
      storage_days: st ? `${st.method} ${st.days}` : undefined,
      storage_tip: st?.tip,
      price_ref: pr ? `${won(pr.low)}~${won(pr.high)}원/${pr.unit}` : undefined,
      today_price: km ? `${won(km.price)}원/${km.unit}` : undefined,
    };
  });

  const meta: GroceryMeta = {
    month,
    seasonal_picks: seasonalPicks(month),
    seasonal_used: list.filter((i) => i.seasonal).map((i) => i.item),
    price_source: kamis ? "kamis" : "reference",
    kamis_date: kamis?.date,
  };

  return {
    ...r,
    shopping_list: list,
    meta,
    budget_fix: buildBudgetFix(r, list, kamis, budgetRaw),
  };
}

// ── C-1: 예산 초과 시 대체재 추천 (내장 스왑 테이블 + 참고가, 서버 후처리) ──
function buildBudgetFix(
  r: GroceryPlanResult,
  list: ShoppingItem[],
  kamis: Awaited<ReturnType<typeof fetchKamisToday>>,
  budgetRaw: string
): BudgetFix | undefined {
  const budget = parseBudgetWon(budgetRaw);
  if (!budget || budget <= 0) return undefined;

  // UI에 표시되는 합계와 같은 기준을 쓴다 (없으면 항목 합)
  const itemSum = list.reduce((acc, it) => acc + (it.est_price > 0 ? it.est_price : 0), 0);
  const total = r.total_est_price > 0 ? r.total_est_price : itemSum;
  const over = total - budget;
  if (over <= 0) return undefined;

  const clean = (s: string) => s.replace(/\s/g, "").replace(/\(.+?\)/g, "");
  const swaps: BudgetSwap[] = [];
  const listNames = list.map((it) => clean(it.item));
  const suggested = new Set<string>();
  // 비싼 항목부터 검토 — 큰 절약이 먼저 보이도록
  const sorted = [...list].sort((a, b) => (b.est_price || 0) - (a.est_price || 0));
  for (const it of sorted) {
    if (swaps.length >= 3) break;
    const sub = findSubstitute(it.item);
    if (!sub) continue;
    // 대체재를 이미 리스트에 담았거나 이미 제안했으면 중복 제안하지 않음
    const to = clean(sub.to.name);
    if (suggested.has(to)) continue;
    if (listNames.some((n) => n.includes(to) || to.includes(n))) continue;
    suggested.add(to);
    const mid = Math.round((sub.to.low + sub.to.high) / 2);
    const saving = (it.est_price || 0) - mid;
    const km = kamis ? matchKamis(sub.to.name, kamis.items) : null;
    swaps.push({
      from: it.item,
      to: sub.to.name,
      why: sub.why,
      est_saving: saving > 0 ? saving : undefined,
      to_price_ref: `${won(sub.to.low)}~${won(sub.to.high)}원/${sub.to.unit}`,
      to_today_price: km ? `${won(km.price)}원/${km.unit}` : undefined,
    });
  }

  // 스왑 후보가 없어도 초과 사실 자체는 카드로 알린다 (UI가 일반 가이드 표시)
  return { budget, total, over, swaps };
}

// days 문자열("3~5일", "1~2주")에서 최소 일수 추출 — 먼저 쓸 순서 정렬용
function minDays(days: string): number {
  const m = days.match(/(\d+)/);
  if (!m) return 99;
  const n = parseInt(m[1], 10);
  return days.includes("주") ? n * 7 : days.includes("개월") ? n * 30 : n;
}

async function enrichUse(
  r: GroceryUseResult,
  ingredients: string[]
): Promise<GroceryUseResult> {
  // 1) 가진 재료의 보관 요령 (내장 DB, 기한 짧은 순)
  const seen = new Set<string>();
  const notes: StorageNote[] = [];
  for (const ing of ingredients) {
    const s = findStorage(ing);
    if (!s || seen.has(s.name)) continue;
    seen.add(s.name);
    notes.push({
      name: ing,
      method: s.method,
      days: s.days,
      tip: s.tip,
      freezable: s.freezable,
    });
  }
  notes.sort((a, b) => minDays(a.days) - minDays(b.days));

  // 2) 공공 레시피 DB — 가장 급한 재료 기준 검색 (키 없으면 null)
  const query = notes[0]?.name ?? ingredients[0];
  const dbPromise = query ? fetchDbRecipes(query, 3).catch(() => null) : Promise.resolve(null);

  // 3) AI 레시피 참고 사진 (Pexels, /grocery 한정) — 키 없으면 텍스트 카드 폴백
  const recipes = await Promise.all(
    (r.recipes || []).slice(0, 4).map(async (rec) => {
      const photo = await fetchFoodImage(rec.name).catch(() => null);
      return photo ? { ...rec, photo } : rec;
    })
  );

  const db = await dbPromise;

  return {
    ...r,
    recipes: recipes.length > 0 ? recipes : r.recipes,
    storage_notes: notes.length > 0 ? notes : undefined,
    db_recipes: db ?? undefined,
  };
}
