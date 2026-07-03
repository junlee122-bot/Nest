"use client";

import { useMemo, useState } from "react";
import {
  Loader2,
  UtensilsCrossed,
  AlertCircle,
  Send,
  ShoppingCart,
  Refrigerator,
  Lightbulb,
  Clock,
  Printer,
  CircleAlert,
  Sprout,
  ChevronDown,
  CookingPot,
} from "lucide-react";
import AppBar from "./AppBar";
import Doongi from "./mascot/Doongi";
import ShareButton from "./ShareButton";
import { addGrowth } from "@/lib/growth";
import { SAMPLE_GROCERY_PLAN, SAMPLE_GROCERY_USE } from "@/lib/sample";
import { GROCERY_DATA_VERSION } from "@/lib/grocery/meta";
import type {
  GroceryMode,
  GroceryResponse,
  GroceryResult,
  GroceryPlanResult,
  GroceryUseResult,
} from "@/lib/types";

const won = (n: number) => (n || 0).toLocaleString("ko-KR") + "원";
const DIET_CHIPS = ["채식 위주", "매운 거 싫어요", "간단한 것만", "유제품 빼고"];
const INGREDIENT_CHIPS = ["계란", "양파", "김치", "대파", "두부", "밥", "참치캔", "당근"];

export default function GroceryCoach() {
  const [tab, setTab] = useState<GroceryMode>("plan");

  // 탭 A
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("7일");
  const [meals, setMeals] = useState("점심·저녁");
  const [diet, setDiet] = useState("");
  const [difficulty, setDifficulty] = useState("아주 간단");
  // 탭 B
  const [ingredients, setIngredients] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GroceryResult | null>(null);
  const [isSample, setIsSample] = useState(false);

  function switchTab(t: GroceryMode) {
    if (t === tab) return;
    setTab(t);
    setResult(null);
    setError(null);
    setIsSample(false);
  }

  const canSubmit = tab === "plan" ? budget.trim().length > 0 : ingredients.trim().length > 0;

  async function run() {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setIsSample(false);
    try {
      const payload =
        tab === "plan"
          ? { mode: "plan", budget: budget.trim(), days, meals, diet: diet.trim(), difficulty }
          : { mode: "use", ingredients: ingredients.trim() };
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: GroceryResponse = await res.json();
      if (!data.ok) setError(data.error);
      else {
        setResult(data.result);
        addGrowth("grocery"); // 둥지 키우기 (이 기기에만 저장)
        scrollToResult();
      }
    } catch {
      setError("연결에 문제가 생겼어요. 네트워크를 확인하고 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function showSample() {
    setResult(tab === "plan" ? SAMPLE_GROCERY_PLAN : SAMPLE_GROCERY_USE);
    setIsSample(true);
    setError(null);
    scrollToResult();
  }

  function reset() {
    setResult(null);
    setError(null);
    setIsSample(false);
  }

  return (
    <main className="min-h-dvh pb-16">
      <AppBar title="혼밥 장보기 코치" />
      <div className="no-print container-app pt-3">
        <p className="px-1 text-[13px] font-medium text-muted">
          제철·시세·보관까지 챙기는 식비 절약 코치
        </p>
      </div>

      <div className="container-app space-y-5 pt-5">
        {/* 탭 토글 */}
        <div
          role="tablist"
          aria-label="장보기 모드"
          className="no-print grid grid-cols-2 rounded-2xl bg-[#F0F2F0] p-1"
        >
          {(
            [
              ["plan", "식단 짜기"],
              ["use", "남은 재료 처리"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => switchTab(t)}
              className={`rounded-xl px-4 py-2.5 text-sm transition-all ${
                tab === t ? "bg-card font-bold text-ink shadow-card" : "font-semibold text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 입력 카드 */}
        <div className="no-print card p-5">
          {tab === "plan" ? (
            <PlanForm
              budget={budget}
              setBudget={setBudget}
              days={days}
              setDays={setDays}
              meals={meals}
              setMeals={setMeals}
              diet={diet}
              setDiet={setDiet}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
            />
          ) : (
            <UseForm ingredients={ingredients} setIngredients={setIngredients} />
          )}

          <button onClick={run} disabled={!canSubmit || loading} className="btn-primary mt-4 w-full">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {tab === "plan" ? " 둥지가 식단을 짜는 중…" : " 만들 수 있는 걸 찾는 중…"}
              </>
            ) : (
              <>
                <Send size={18} /> {tab === "plan" ? "식단·장보기 짜기" : "메뉴 추천받기"}
              </>
            )}
          </button>
          <button type="button" onClick={showSample} className="btn-ghost mt-2 w-full text-sm">
            예시로 둘러보기
          </button>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-tint p-4"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
              <div className="space-y-2">
                <p className="text-sm text-ink">{error}</p>
                <button onClick={run} className="btn-ghost text-sm">
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </div>

        <div id="result-anchor" />

        {/* 로딩 — 둥이가 궁리 중 */}
        {loading && (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            <div className="card flex items-center gap-3 p-4">
              <Doongi mood="thinking" size={72} withNest={false} className="shrink-0" />
              <p className="text-sm font-medium text-ink">
                {tab === "plan"
                  ? "예산에 맞는 식단을 궁리하고 있어요."
                  : "남은 재료로 만들 수 있는 걸 찾고 있어요."}
              </p>
            </div>
            <div className="card space-y-3 p-5">
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          </div>
        )}

        {result && !loading && (
          <>
            {isSample && (
              <div className="no-print rounded-xl border border-line bg-bg p-3 text-center text-xs font-medium text-muted">
                예시 결과예요. 실제로는 입력하신 조건에 맞춰 짜드려요.
              </div>
            )}
            {result.mode === "plan" ? (
              <PlanView r={result as GroceryPlanResult} />
            ) : (
              <UseView r={result as GroceryUseResult} />
            )}
            <div className="no-print grid grid-cols-2 gap-2">
              <button onClick={reset} className="btn-ghost">
                새로 짜기
              </button>
              <ShareButton
                text={
                  result.mode === "plan"
                    ? `[둥지] 장보기: 예상 식비 ${won((result as GroceryPlanResult).total_est_price)}`
                    : `[둥지] 장보기: 남은 재료 메뉴 ${(result as GroceryUseResult).recipes?.length || 0}개`
                }
                className="btn-ghost"
              />
            </div>
          </>
        )}

        <p className="px-1 text-center text-xs leading-relaxed text-muted">
          가격·식비·유통기한은 지역·시점에 따라 다른 <b>예상치(참고용)</b>예요. 입력 내용은 저장하지 않습니다.
        </p>
      </div>
    </main>
  );
}

function scrollToResult() {
  setTimeout(() => {
    document.getElementById("result-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

/* ── 입력 폼 ── */
function PlanForm(props: {
  budget: string;
  setBudget: (v: string) => void;
  days: string;
  setDays: (v: string) => void;
  meals: string;
  setMeals: (v: string) => void;
  diet: string;
  setDiet: (v: string | ((p: string) => string)) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="grocery-budget" className="text-sm font-bold text-ink">
          1주 예산
        </label>
        <input
          id="grocery-budget"
          value={props.budget}
          onChange={(e) => props.setBudget(e.target.value)}
          inputMode="numeric"
          placeholder="예) 30000원"
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {["2만원", "3만원", "5만원", "7만원"].map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => props.setBudget(b)}
              aria-pressed={props.budget === b}
              className={`chip ${props.budget === b ? "bg-brand-tint font-bold text-brand-deep" : ""}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="grocery-days" className="text-sm font-bold text-ink">
            기간
          </label>
          <select
            id="grocery-days"
            value={props.days}
            onChange={(e) => props.setDays(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand"
          >
            <option>3일</option>
            <option>5일</option>
            <option>7일</option>
          </select>
        </div>
        <div>
          <label htmlFor="grocery-meals" className="text-sm font-bold text-ink">
            끼니
          </label>
          <select
            id="grocery-meals"
            value={props.meals}
            onChange={(e) => props.setMeals(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand"
          >
            <option>점심·저녁</option>
            <option>아침·점심·저녁</option>
            <option>저녁만</option>
          </select>
        </div>
      </div>
      <div>
        <span className="text-sm font-bold text-ink">조리 난이도</span>
        <div
          role="group"
          aria-label="조리 난이도"
          className="mt-1.5 grid grid-cols-3 rounded-2xl bg-[#F0F2F0] p-1"
        >
          {["아주 간단", "보통", "제대로 요리"].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => props.setDifficulty(d)}
              aria-pressed={props.difficulty === d}
              className={`rounded-xl px-2 py-2 text-[13px] transition-all ${
                props.difficulty === d
                  ? "bg-card font-bold text-ink shadow-card"
                  : "font-semibold text-muted"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="grocery-diet" className="text-sm font-bold text-ink">
          식성·제약 (선택)
        </label>
        <input
          id="grocery-diet"
          value={props.diet}
          onChange={(e) => props.setDiet(e.target.value)}
          placeholder="예) 매운 거 싫어요, 채식 위주"
          className="mt-1.5 w-full rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {DIET_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() =>
                props.setDiet((prev) => (prev.includes(c) ? prev : prev ? `${prev}, ${c}` : c))
              }
              className="chip"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function UseForm({
  ingredients,
  setIngredients,
}: {
  ingredients: string;
  setIngredients: (v: string | ((p: string) => string)) => void;
}) {
  return (
    <div>
      <label htmlFor="ingredients" className="text-sm font-bold text-ink">
        냉장고에 있는 재료
      </label>
      <p className="mt-1 text-xs text-muted">쉼표나 줄바꿈으로 적어주세요. 상하기 쉬운 것부터 써드려요.</p>
      <textarea
        id="ingredients"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        rows={3}
        placeholder="예) 계란, 김치, 두부, 대파"
        className="mt-2 w-full resize-none rounded-xl border border-line bg-bg p-3.5 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {INGREDIENT_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() =>
              setIngredients((prev: string) =>
                prev
                  .split(/[,\n]/)
                  .map((s) => s.trim())
                  .includes(c)
                  ? prev
                  : prev
                    ? `${prev}, ${c}`
                    : c
              )
            }
            className="chip"
          >
            + {c}
          </button>
        ))}
      </div>
    </div>
  );
}

const CHANNEL_ORDER = ["채소·과일", "정육·계란", "유제품", "냉동·가공", "양념·기타", "기타"];

// 가격 출처 배지 (v7 P3) — 오늘 시세 / 참고가 / AI 추정 구분
function PriceSourceBadge({ it }: { it: { today_price?: string; price_ref?: string; est_price: number } }) {
  if (it.today_price) {
    return (
      <span className="inline-flex rounded-full bg-sky-tint px-1.5 py-0.5 text-[10px] font-bold text-sky-deep">
        오늘 시세
      </span>
    );
  }
  if (it.price_ref) {
    return (
      <span className="inline-flex rounded-full bg-straw-tint px-1.5 py-0.5 text-[10px] font-bold text-straw-deep">
        참고가
      </span>
    );
  }
  if (!it.est_price) {
    return (
      <span className="inline-flex rounded-full bg-[#EEF0EE] px-1.5 py-0.5 text-[10px] font-bold text-muted">
        데이터 없음
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-[#EEF0EE] px-1.5 py-0.5 text-[10px] font-bold text-muted">
      AI 추정
    </span>
  );
}

/* ── 결과: 식단 ── */
function PlanView({ r }: { r: GroceryPlanResult }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  // 마트 동선대로 코너별 그룹핑 (원래 index 보존 → 체크 상태 유지)
  const grouped = useMemo(() => {
    const m = new Map<string, { it: (typeof r.shopping_list)[number]; idx: number }[]>();
    (r.shopping_list || []).forEach((it, idx) => {
      const cat = it.category && CHANNEL_ORDER.includes(it.category) ? it.category : "기타";
      if (!m.has(cat)) m.set(cat, []);
      m.get(cat)!.push({ it, idx });
    });
    return CHANNEL_ORDER.filter((c) => m.has(c)).map((c) => ({ cat: c, items: m.get(c)! }));
  }, [r]);
  return (
    <div className="space-y-4">
      {/* 예상 식비 */}
      <div className="card animate-fade-up p-5">
        <p className="text-sm text-muted">예상 식비 (참고용)</p>
        <p className="mt-1 text-2xl font-extrabold text-ink">{won(r.total_est_price)}</p>
        {r.budget_note && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-warn-tint p-3 text-sm leading-relaxed text-ink">
            <Lightbulb size={15} className="mt-0.5 shrink-0 text-warn" />
            <span>{r.budget_note}</span>
          </div>
        )}
      </div>

      {/* 이번 달 제철 (서버 부착 메타) */}
      {r.meta && (
        <section className="card animate-fade-up p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
              <Sprout size={18} />
            </span>
            {r.meta.month}월 제철 재료
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.meta.seasonal_picks.map((pk) => (
              <span
                key={pk.name}
                title={pk.note}
                className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand-deep"
              >
                {pk.name}
              </span>
            ))}
          </div>
          {r.meta.seasonal_used.length > 0 && (
            <p className="mt-2.5 text-xs leading-relaxed text-muted">
              이번 장보기에 제철 재료{" "}
              <b className="text-brand-deep">{r.meta.seasonal_used.join(", ")}</b>
              를 담았어요. 제철이 맛도 값도 유리해요.
            </p>
          )}
        </section>
      )}

      {/* 요일별 식단 */}
      <section className="card animate-fade-up p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun-tint text-sun-deep">
            <UtensilsCrossed size={18} />
          </span>
          요일별 식단
        </h2>
        <div className="space-y-3">
          {(r.plan_days || []).map((d, i) => (
            <div key={i} className="rounded-xl border border-line p-3.5">
              <p className="mb-2 text-sm font-bold text-brand">{d.day}</p>
              <div className="space-y-2">
                {(d.meals || []).map((m, j) => (
                  <div key={j} className="flex gap-2 text-sm">
                    <span className="shrink-0 rounded-md bg-bg px-2 py-0.5 text-xs font-semibold text-muted">
                      {m.slot}
                    </span>
                    <div>
                      <span className="font-medium text-ink">{m.name}</span>
                      {m.why && <span className="ml-1 text-xs text-muted">· {m.why}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 장보기 리스트 */}
      <section className="card animate-fade-up p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun-tint text-sun-deep">
              <ShoppingCart size={18} />
            </span>
            장보기 리스트
          </h2>
          <button onClick={() => window.print()} className="no-print btn-ghost text-sm">
            <Printer size={15} /> 저장
          </button>
        </div>
        <div className="space-y-3">
          {grouped.map((g) => (
            <div key={g.cat}>
              <p className="mb-1 text-xs font-bold text-muted">{g.cat}</p>
              <ul className="space-y-1">
                {g.items.map(({ it, idx }) => (
                  <li key={idx}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1.5">
                      <input
                        type="checkbox"
                        checked={!!checked[idx]}
                        onChange={() => setChecked((p) => ({ ...p, [idx]: !p[idx] }))}
                        className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-brand"
                      />
                      <span className="min-w-0 flex-1">
                        {/* 한 줄 요약 (v7 P3): 이름 · 수량 · 가격 + 출처 배지 */}
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-medium ${checked[idx] ? "text-muted line-through" : "text-ink"}`}>
                            {it.item} <span className="text-xs text-muted">· {it.qty}</span>
                            {it.seasonal && (
                              <span className="ml-1.5 rounded-full bg-brand-tint px-1.5 py-0.5 text-[10px] font-bold text-brand-deep">
                                제철
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-bold text-ink">{won(it.est_price)}</span>
                            <PriceSourceBadge it={it} />
                          </span>
                        </span>
                        {/* 펼치면 상세 (줄바꿈 허용 — truncate 금지) */}
                        {(it.today_price || it.price_ref || it.storage_days || it.used_in?.length > 0 || it.fresh_label) && (
                          <details className="group/it mt-1 [&_summary::-webkit-details-marker]:hidden">
                            <summary className="inline-flex cursor-pointer list-none items-center gap-0.5 text-[12px] font-semibold text-muted hover:text-ink">
                              자세히
                              <ChevronDown size={12} className="transition-transform group-open/it:rotate-180" />
                            </summary>
                            <span className="mt-1 block space-y-0.5 rounded-lg bg-bg p-2">
                              {it.today_price && (
                                <span className="block text-[12px] leading-relaxed text-ink">
                                  오늘 시세 <b className="text-brand-deep">{it.today_price}</b>
                                  <span className="text-muted"> (공공데이터 소매 기준 단가)</span>
                                </span>
                              )}
                              {it.price_ref && (
                                <span className="block text-[12px] leading-relaxed text-muted">
                                  참고가 {it.price_ref}
                                </span>
                              )}
                              {it.fresh_label && (
                                <span className="block text-[12px] leading-relaxed text-[#9A6B00]">
                                  {it.fresh_label} 소비 권장
                                </span>
                              )}
                              {it.storage_days && (
                                <span className="block text-[12px] leading-relaxed text-muted">
                                  {it.storage_days}
                                  {it.storage_tip ? ` · ${it.storage_tip}` : ""}
                                </span>
                              )}
                              {it.used_in?.length > 0 && (
                                <span className="block text-[12px] leading-relaxed text-muted">
                                  쓰이는 곳: {it.used_in.join(", ")}
                                </span>
                              )}
                            </span>
                          </details>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm font-bold text-ink">합계 (예상)</span>
          <span className="text-base font-extrabold text-brand-deep">{won(r.total_est_price)}</span>
        </div>
        {r.meta && (
          <p className="mt-2 text-[12px] leading-relaxed text-muted">
            {r.meta.price_source === "kamis"
              ? `오늘 시세는 공공데이터(aT KAMIS, ${r.meta.kamis_date ?? ""})의 소매 기준 단가예요.`
              : "가격은 내장 참고 가격표 기준 예상치예요."}{" "}
            표기된 단위 기준이며 실제 마트·온라인·행사가와 다를 수 있어요.
            <span className="mt-0.5 block text-muted/80">
              내장 데이터 v{GROCERY_DATA_VERSION} · 참고용
            </span>
          </p>
        )}
      </section>

      {r.tips?.length > 0 && (
        <section className="card animate-fade-up p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun-tint text-sun-deep">
              <Lightbulb size={18} />
            </span>
            팁
          </h2>
          <ul className="space-y-2.5">
            {r.tips.map((t, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ── 결과: 남은 재료 ── */
function UseView({ r }: { r: GroceryUseResult }) {
  return (
    <div className="space-y-4">
      {r.priority_note && (
        <div className="animate-fade-up flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn-tint p-4">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-warn" />
          <div>
            <p className="text-sm font-bold text-[#9A6B00]">먼저 쓸 재료</p>
            <p className="mt-1 text-sm leading-relaxed text-ink">{r.priority_note}</p>
          </div>
        </div>
      )}

      {/* 먼저 쓸 순서 — 내장 보관법 DB (서버 부착) */}
      {r.storage_notes && r.storage_notes.length > 0 && (
        <section className="card animate-fade-up p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-tint text-sky-deep">
              <Refrigerator size={18} />
            </span>
            먼저 쓸 순서
          </h2>
          <ol className="space-y-3">
            {r.storage_notes.map((n, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-bold text-brand-deep">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {n.name}
                    <span className="ml-1.5 text-xs font-medium text-muted">
                      {n.method} {n.days}
                    </span>
                    {n.freezable && (
                      <span className="ml-1.5 rounded-full bg-sky-tint px-1.5 py-0.5 text-[10px] font-bold text-sky-deep">
                        냉동 가능
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.tip}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            보관 기간은 일반적인 참고 기준이에요. 냄새·색이 이상하면 기한과 무관하게 버리세요.
          </p>
        </section>
      )}

      {(r.recipes || []).map((rec, i) => (
        <section key={i} className="card animate-fade-up overflow-hidden p-5">
          {rec.photo && (
            <div className="-mx-5 -mt-5 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rec.photo.url}
                alt={`${rec.name} 참고 이미지`}
                loading="lazy"
                decoding="async"
                className="h-40 w-full object-cover"
              />
              <p className="bg-black/45 px-3 py-1 text-right text-[10px] font-medium text-white/90 backdrop-blur-sm -mt-6 relative">
                사진:{" "}
                <a
                  href={rec.photo.photographerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {rec.photo.photographer}
                </a>{" "}
                ·{" "}
                <a
                  href={rec.photo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Pexels
                </a>{" "}
                · 참고 이미지
              </p>
            </div>
          )}
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun-tint text-sun-deep">
              <Refrigerator size={18} />
            </span>
            <h2 className="text-base font-bold text-ink">{rec.name}</h2>
            {typeof rec.time_min === "number" && rec.time_min > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-muted">
                <Clock size={13} /> {rec.time_min}분
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(rec.uses || []).map((u, j) => (
              <span
                key={`u${j}`}
                className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand"
              >
                {u}
              </span>
            ))}
            {(rec.missing || []).map((m, j) => (
              <span
                key={`m${j}`}
                className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-line"
              >
                + {m}
              </span>
            ))}
          </div>

          {rec.steps?.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {rec.steps.map((s, j) => (
                <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-bold text-brand">
                    {j + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}

          {rec.note && <p className="mt-3 rounded-xl bg-bg p-2.5 text-xs leading-relaxed text-muted">{rec.note}</p>}
        </section>
      ))}

      {(r.recipes || []).some((rec) => rec.photo) && (
        <p className="px-1 text-[11px] leading-relaxed text-muted">
          요리 사진은 Pexels 참고 이미지로, 실제 완성 모습과 다를 수 있어요.
        </p>
      )}

      {/* 공공 레시피 DB — 식약처 (키 있을 때만 서버가 부착) */}
      {r.db_recipes && r.db_recipes.length > 0 && (
        <section className="card animate-fade-up p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sun-tint text-sun-deep">
              <CookingPot size={18} />
            </span>
            공공 레시피로 더 해먹기
          </h2>
          <div className="space-y-3">
            {r.db_recipes.map((d, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-line">
                {d.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.image}
                    alt={d.name}
                    loading="lazy"
                    decoding="async"
                    className="h-36 w-full object-cover"
                  />
                )}
                <div className="p-3.5">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 truncate font-bold text-ink">{d.name}</p>
                    {d.kcal && (
                      <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[10px] font-bold text-muted">
                        {d.kcal}
                      </span>
                    )}
                  </div>
                  {d.ingredients && (
                    <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                      {d.ingredients}
                    </p>
                  )}
                  {d.steps.length > 0 && (
                    <details className="group mt-2 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-bold text-brand-deep">
                        만드는 법 보기
                        <ChevronDown size={13} className="transition-transform group-open:rotate-180" />
                      </summary>
                      <ol className="mt-2 space-y-1.5">
                        {d.steps.map((st, j) => (
                          <li key={j} className="flex gap-2 text-xs leading-relaxed text-ink">
                            <span className="shrink-0 font-bold text-muted">{j + 1}.</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-muted">출처: {r.db_recipes[0].source}</p>
        </section>
      )}

      {(!r.recipes || r.recipes.length === 0) && (
        <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
          <Doongi mood="sleepy" size={96} />
          <p className="text-sm text-muted">재료를 조금 더 알려주시면 메뉴를 찾아드릴게요.</p>
        </div>
      )}
    </div>
  );
}
