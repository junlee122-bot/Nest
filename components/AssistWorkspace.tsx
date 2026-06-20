"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import ResultCards from "./ResultCards";
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
}

export default function AssistWorkspace({ config }: { config: TopicConfig }) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistResult | null>(null);

  const canSubmit = (text.trim().length > 0 || !!image) && !loading;

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
      <header className="flow-bg border-b border-line">
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
        <div className="card p-5">
          <label htmlFor="assist-text" className="block text-base font-bold text-ink">
            {config.question}
          </label>

          {config.showPhoto && (
            <div className="mt-3">
              <PhotoUpload value={image} onChange={setImage} />
            </div>
          )}

          <textarea
            id="assist-text"
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
                  onClick={() => setText((prev) => (prev ? prev : c))}
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

        {/* 로딩 스켈레톤 */}
        {loading && <LoadingSkeleton text={config.loadingText} />}

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
            <button onClick={reset} className="btn-ghost w-full">
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

function LoadingSkeleton({ text }: { text: string }) {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="card flex items-center gap-3 p-4">
        <Loader2 size={18} className="animate-spin text-brand" />
        <span className="text-sm font-medium text-ink">{text}</span>
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
