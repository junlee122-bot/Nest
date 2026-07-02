"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  Wrench,
  ClipboardList,
  Zap,
  type LucideIcon,
} from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import ResultCards from "./ResultCards";
import Doongi from "./mascot/Doongi";
import ShareButton from "./ShareButton";
import { fadeUp } from "@/lib/motion";
import { addHistory, deriveTitle, getHistoryEntry } from "@/lib/history";
import type { AssistResponse, AssistResult, Clarify, Topic } from "@/lib/types";

const REPAIR_FOLLOWUPS = [
  "그래도 안 되면?",
  "집주인이 무시하면?",
  "비용은 누가 내나요?",
  "전문가를 불러야 하나요?",
];

function shareSummary(r: AssistResult): string {
  if (r.kind === "repair") return `[둥지] 집수리 진단 — ${r.responsibility?.summary || "결과 확인"}`;
  if (r.kind === "admin") return `[둥지] 이사·행정 체크리스트 (${r.checklist?.length || 0}단계)`;
  return `[둥지] 공과금 점검 — ${r.summary || "결과 확인"}`;
}

// 주제별 헤더 아이콘 — 홈 카드와 동일 아이콘으로 일관성 유지 (v3 P4)
const TOPIC_ICON: Record<Topic, LucideIcon> = {
  repair: Wrench,
  admin: ClipboardList,
  utility: Zap,
};

export interface TopicConfig {
  topic: Topic;
  /** @deprecated v3 P4부터 TOPIC_ICON 사용 — 하위 호환용으로만 남김 */
  emoji?: string;
  title: string;
  subtitle: string;
  question: string;
  placeholder: string;
  chips: string[];
  showPhoto: boolean;
  loadingText: string;
  loadingStages?: string[]; // 단계적 로딩 문구 (없으면 loadingText 한 줄)
  sampleResult?: AssistResult; // "예시로 둘러보기"용 정적 결과
}

export default function AssistWorkspace({ config }: { config: TopicConfig }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistResult | null>(null);
  const [clarify, setClarify] = useState<Clarify | null>(null);
  const [clarifyAsked, setClarifyAsked] = useState(false);
  const [slow, setSlow] = useState(false); // 응답 지연(>12s) 안내
  const [isSample, setIsSample] = useState(false); // 예시 결과 표시 여부
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 최근 기록에서 열기 (?h=<id>) — API 재호출 없이 저장된 결과 표시
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("h");
    if (!id) return;
    const entry = getHistoryEntry(id);
    if (entry && entry.topic === config.topic) {
      setResult(entry.result);
      scrollToResult();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 텍스트 영역 자동 높이
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 240) + "px";
    }
  }, [text]);

  const canSubmit = (text.trim().length > 0 || !!image) && !loading;
  // 집주인 문구 결과에는 하단 고정 액션 바가 있으므로 여백 확보
  const stickyBar = result?.kind === "repair" && !loading;

  function scrollToResult() {
    setTimeout(() => {
      document
        .getElementById("result-anchor")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function fillFromChip(sentence: string) {
    setText(sentence);
    // 입력창으로 포커스 (사진을 덧붙일 수 있게 자동 제출은 하지 않음)
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  }

  async function runAssist(payloadText: string, opts?: { disallowClarify?: boolean }) {
    const disallow = opts?.disallowClarify ?? clarifyAsked;
    setLoading(true);
    setError(null);
    setResult(null);
    setClarify(null);
    setIsSample(false);
    setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 12000);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: config.topic,
          text: payloadText,
          imageDataUrl: config.showPhoto ? image : null,
          disallowClarify: disallow,
        }),
      });
      const data: AssistResponse = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else if ("clarify" in data) {
        setClarify(data.clarify);
        setClarifyAsked(true);
        scrollToResult();
      } else {
        setResult(data.result);
        // 최근 기록 저장 (이 기기에만, 사진 제외)
        addHistory({
          topic: config.topic,
          title: deriveTitle(payloadText),
          result: data.result,
        });
        scrollToResult();
      }
    } catch {
      setError("연결에 문제가 생겼어요. 네트워크를 확인하고 다시 시도해주세요.");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
    }
  }

  function submit() {
    if (!canSubmit) return;
    runAssist(text.trim());
  }

  // 예시로 둘러보기 — 실제 호출 없이 샘플 결과 표시 (기록 저장 안 함)
  function showSample() {
    if (!config.sampleResult) return;
    setError(null);
    setClarify(null);
    setResult(config.sampleResult);
    setIsSample(true);
    scrollToResult();
  }

  // 되묻기 답변 → 맥락에 더해 다시 호출(추가 질문 없이 최종 결과)
  function answerClarify(answer: string) {
    runAssist(`${text.trim()}\n\n추가 정보: ${answer}`, { disallowClarify: true });
  }

  function reset() {
    setResult(null);
    setError(null);
    setClarify(null);
    setClarifyAsked(false);
    setIsSample(false);
  }

  function focusInput() {
    requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      textareaRef.current?.focus();
    });
  }

  // 새 문제: 입력 비우고 처음부터
  function otherProblem() {
    setText("");
    setImage(null);
    reset();
    focusInput();
  }

  // 비슷한 문제: 같은 주제 예시 칩이 있는 입력으로
  function similarProblem() {
    reset();
    focusInput();
  }

  // 후속 질문(집수리): 같은 맥락에 질문을 더해 다시 호출
  function followUp(q: string) {
    const base = text.trim();
    runAssist(`${base}\n\n추가 질문: ${q}`, { disallowClarify: true });
  }

  return (
    <main className={`min-h-dvh ${stickyBar ? "pb-28" : "pb-16"}`}>
      {/* 헤더 */}
      <header className="no-print flow-bg border-b border-line">
        <div className="container-app py-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft size={16} /> 홈
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand"
              aria-hidden
            >
              {(() => {
                const Icon = TOPIC_ICON[config.topic];
                return <Icon size={22} strokeWidth={2.2} />;
              })()}
            </span>
            <div>
              <h1 className="text-xl font-bold text-ink">{config.title}</h1>
              <p className="text-sm text-muted">{config.subtitle}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-app space-y-5 pt-5">
        {/* 입력 카드 */}
        <div className="no-print card p-5">
          <label htmlFor="assist-text" className="block text-base font-bold text-ink">
            {config.question}
          </label>
          {config.showPhoto && (
            <p className="mt-1 text-xs text-muted">사진과 함께 설명하면 더 정확해요.</p>
          )}

          {config.showPhoto && (
            <div className="mt-3">
              <PhotoUpload value={image} onChange={setImage} />
            </div>
          )}

          <textarea
            id="assist-text"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={config.placeholder}
            rows={2}
            className="mt-3 w-full resize-none overflow-hidden rounded-xl border border-line bg-bg p-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          {config.showPhoto && image && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand">
              📷 사진 첨부됨
            </span>
          )}

          {/* 예시 칩 */}
          {config.chips.length > 0 && (
            <p className="mt-3 text-xs font-semibold text-muted">이런 걸 물어보세요</p>
          )}
          {config.chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {config.chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => fillFromChip(c)}
                  className="chip"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="btn-primary mt-4 w-full"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {config.loadingText}
              </>
            ) : (
              <>
                <Send size={18} /> 둥지에게 물어보기
              </>
            )}
          </button>

          {config.sampleResult && !loading && (
            <button type="button" onClick={showSample} className="btn-ghost mt-2 w-full text-sm">
              예시로 둘러보기
            </button>
          )}
        </div>

        <div id="result-anchor" />

        {/* 되묻기 — 정확도를 위해 한 번 더 묻기 */}
        {clarify && !loading && !error && !result && (
          <div className="card animate-fade-up p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand">
                <HelpCircle size={18} />
              </span>
              <h2 className="text-base font-bold text-ink">조금만 더 알려주세요</h2>
            </div>
            <p className="text-sm leading-relaxed text-ink">{clarify.question}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {clarify.chips.map((c) => (
                <button key={c} type="button" onClick={() => answerClarify(c)} className="chip">
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">
              고르면 그 내용을 더해 다시 살펴보고 최종 결과를 알려드릴게요.
            </p>
          </div>
        )}

        {/* 빈 상태 — 둥이가 맞아주는 자리 */}
        {!loading && !error && !result && !clarify && (
          <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Doongi mood="hello" size={104} />
            <p className="text-sm leading-relaxed text-muted">
              어떤 점이 불편하세요?
              <br />
              둥이가 같이 봐드릴게요.
            </p>
          </div>
        )}

        {/* 로딩 스켈레톤 (단계적 문구) */}
        {loading && (
          <LoadingSkeleton stages={config.loadingStages ?? [config.loadingText]} slow={slow} />
        )}

        {/* 에러 */}
        {error && !loading && (
          <div role="alert" className="card flex items-start gap-3 border-danger/20 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-danger" />
            <div className="space-y-2">
              <p className="text-sm text-ink">{error}</p>
              <button onClick={submit} className="btn-ghost text-sm">
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 결과 */}
        {result && !loading && (
          <>
            {isSample && (
              <div className="rounded-xl border border-line bg-bg p-3 text-center text-xs font-medium text-muted">
                예시 결과입니다 — 실제로는 입력하신 내용에 맞춰 답해드려요.
              </div>
            )}
            <ResultHerald result={result} />
            <ResultCards result={result} />

            {/* 후속 질문 (집수리) */}
            {config.topic === "repair" && result.kind === "repair" && (
              <div className="no-print card p-4">
                <p className="mb-2 text-xs font-bold text-muted">이어서 물어보기</p>
                <div className="flex flex-wrap gap-2">
                  {REPAIR_FOLLOWUPS.map((q) => (
                    <button key={q} type="button" onClick={() => followUp(q)} className="chip">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="no-print grid grid-cols-3 gap-2">
              <button onClick={otherProblem} className="btn-ghost text-sm">
                다른 문제
              </button>
              <button onClick={similarProblem} className="btn-ghost text-sm">
                비슷한 문제
              </button>
              <ShareButton text={shareSummary(result)} />
            </div>
            <p className="px-1 pt-1 text-center text-xs leading-relaxed text-muted">
              둥지는 AI 도우미입니다. 안내는 참고용이며 법적 자문이 아닙니다. 업로드한 사진·내용은
              서버에 저장하지 않습니다.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

// 결과 도착을 알리는 둥이 한 줄 — 카드(판단·법적 근거) 바깥에만 등장
function ResultHerald({ result }: { result: AssistResult }) {
  const worried =
    result.kind === "repair" &&
    (result.safety?.level === "danger" || result.urgency === "emergency");
  return (
    <m.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="no-print flex items-center gap-2.5 px-1"
    >
      <Doongi mood={worried ? "warning" : "found"} size={52} withNest={false} />
      <p className="text-sm font-semibold text-ink">
        {worried
          ? "먼저 안전부터 확인해요. 아래 순서대로 따라와 주세요."
          : "찾았어요! 아래에 순서대로 정리했어요."}
      </p>
    </m.div>
  );
}

function LoadingSkeleton({ stages, slow }: { stages: string[]; slow?: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (stages.length <= 1) return;
    const id = setInterval(() => {
      // 마지막 단계에서 멈춤 (실제 응답 도착 시 결과로 전환)
      setStep((s) => (s < stages.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(id);
  }, [stages.length]);

  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="card flex items-center gap-3 p-4">
        <Doongi mood="thinking" size={72} withNest={false} className="shrink-0" />
        <div className="min-w-0 space-y-1">
          <span key={step} className="block animate-fade-up text-sm font-medium text-ink">
            {stages[step]}
          </span>
          {slow && (
            <p className="text-xs text-muted">조금 더 걸리고 있어요. 잠시만 기다려 주세요…</p>
          )}
        </div>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="skeleton h-5 w-1/3" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
