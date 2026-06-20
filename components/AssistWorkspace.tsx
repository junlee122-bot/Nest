"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import ResultCards from "./ResultCards";
import NestMark from "./NestMark";
import type { AssistResponse, AssistResult, Topic } from "@/lib/types";

export interface TopicConfig {
  topic: Topic;
  emoji: string;
  title: string;
  subtitle: string;
  question: string;
  placeholder: string;
  chips: string[];
  showPhoto: boolean;
  loadingText: string;
  loadingStages?: string[]; // 단계적 로딩 문구 (없으면 loadingText 한 줄)
}

export default function AssistWorkspace({ config }: { config: TopicConfig }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = (text.trim().length > 0 || !!image) && !loading;

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

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: config.topic,
          text: text.trim(),
          imageDataUrl: config.showPhoto ? image : null,
        }),
      });
      const data: AssistResponse = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setResult(data.result);
        // 결과로 부드럽게 스크롤
        setTimeout(() => {
          document.getElementById("result-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
    } catch {
      setError("연결에 문제가 생겼어요. 네트워크를 확인하고 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-dvh pb-16">
      {/* 헤더 */}
      <header className="no-print flow-bg border-b border-line">
        <div className="container-app py-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft size={16} /> 홈
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              {config.emoji}
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
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-line bg-bg p-3.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          {/* 예시 칩 */}
          {config.chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
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
        </div>

        <div id="result-anchor" />

        {/* 빈 상태 — 둥지 보이스 */}
        {!loading && !error && !result && (
          <div className="card flex flex-col items-center gap-3 px-6 py-9 text-center">
            <NestMark size={44} className="text-brand/70" />
            <p className="text-sm leading-relaxed text-muted">
              어떤 점이 불편하세요?
              <br />
              둥지가 같이 봐드릴게요.
            </p>
          </div>
        )}

        {/* 로딩 스켈레톤 (단계적 문구) */}
        {loading && (
          <LoadingSkeleton stages={config.loadingStages ?? [config.loadingText]} />
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
            <ResultCards result={result} />
            <button onClick={reset} className="no-print btn-ghost w-full">
              새로 물어보기
            </button>
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

function LoadingSkeleton({ stages }: { stages: string[] }) {
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
        <Loader2 size={18} className="animate-spin text-brand" />
        <span key={step} className="animate-fade-up text-sm font-medium text-ink">
          {stages[step]}
        </span>
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
