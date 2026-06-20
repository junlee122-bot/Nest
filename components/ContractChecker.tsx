"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ScrollText,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Scale,
  Copy,
  Check,
  CircleCheck,
} from "lucide-react";
import NestMark from "./NestMark";
import { SAMPLE_CONTRACT, SAMPLE_CONTRACT_TEXT } from "@/lib/sample";
import type { ContractResponse, ContractResult, RiskLevel } from "@/lib/types";

const RISK_BADGE: Record<RiskLevel, { label: string; cls: string }> = {
  high: { label: "높음", cls: "bg-brand text-white" },
  medium: { label: "주의", cls: "bg-warn text-white" },
  low: { label: "참고", cls: "bg-gray-200 text-ink" },
};

const OVERALL: Record<
  ContractResult["overall_risk"],
  { label: string; box: string; text: string }
> = {
  high: { label: "위험한 조항이 있어요", box: "border-brand/20 bg-brand-tint", text: "text-brand" },
  medium: { label: "주의가 필요해요", box: "border-warn/40 bg-warn-tint", text: "text-[#9A6B00]" },
  low: { label: "가벼운 참고사항이 있어요", box: "border-line bg-bg", text: "text-ink" },
  none: { label: "특별히 위험한 조항은 없어요", box: "border-ok/30 bg-ok-tint", text: "text-ok" },
};

export default function ContractChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContractResult | null>(null);
  const [isSample, setIsSample] = useState(false);
  // 결과가 가리키는 원문(하이라이트용) — 분석 시점의 입력을 고정
  const [analyzed, setAnalyzed] = useState("");

  const canSubmit = text.trim().length > 0 && !loading;

  async function analyze() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setIsSample(false);
    try {
      const res = await fetch("/api/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data: ContractResponse = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setResult(data.result);
        setAnalyzed(text.trim());
        scrollToResult();
      }
    } catch {
      setError("연결에 문제가 생겼어요. 네트워크를 확인하고 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function fillSample() {
    setText(SAMPLE_CONTRACT_TEXT);
    setResult(null);
    setError(null);
  }

  function showSample() {
    setText(SAMPLE_CONTRACT_TEXT);
    setAnalyzed(SAMPLE_CONTRACT_TEXT);
    setResult(SAMPLE_CONTRACT);
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
      <header className="flow-bg border-b border-line">
        <div className="container-app py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <ArrowLeft size={16} /> 홈
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tint text-brand">
              <ScrollText size={22} />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
                계약서 독소조항 체커
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                  BETA
                </span>
              </h1>
              <p className="text-sm text-muted">세입자에게 불리한 조항을 찾아드려요</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-app space-y-5 pt-5">
        {!result && (
          <div className="card p-5">
            <label htmlFor="contract-text" className="block text-base font-bold text-ink">
              계약서 내용을 붙여넣으세요
            </label>
            <p className="mt-1 text-xs text-muted">
              특약사항을 포함해 붙여넣으면 더 정확해요. (입력은 저장하지 않아요)
            </p>
            <textarea
              id="contract-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="예) [특약사항] 1. 임차인은 계약갱신요구권을 포기한다. 2. ..."
              rows={8}
              className="mt-3 w-full resize-y rounded-xl border border-line bg-bg p-3.5 text-sm leading-relaxed text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={fillSample} className="chip">
                예시 계약서 채우기
              </button>
              <button type="button" onClick={showSample} className="chip">
                예시로 둘러보기
              </button>
            </div>

            <button
              type="button"
              onClick={analyze}
              disabled={!canSubmit}
              className="btn-primary mt-4 w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> 둥지가 계약서를 꼼꼼히 읽는 중…
                </>
              ) : (
                <>
                  <Scale size={18} /> 독소조항 검토하기
                </>
              )}
            </button>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-tint p-4"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
                <div className="space-y-2">
                  <p className="text-sm text-ink">{error}</p>
                  <button onClick={analyze} className="btn-ghost text-sm">
                    다시 시도
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div id="result-anchor" />

        {result && (
          <ContractResultView
            result={result}
            sourceText={analyzed}
            isSample={isSample}
            onReset={reset}
          />
        )}

        <p className="px-1 text-center text-xs leading-relaxed text-muted">
          둥지는 AI 도우미입니다. 본 분석은 참고용이며 법적 자문이 아닙니다. 입력한 계약서는 서버에
          저장하지 않습니다.
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

function ContractResultView({
  result,
  sourceText,
  isSample,
  onReset,
}: {
  result: ContractResult;
  sourceText: string;
  isSample: boolean;
  onReset: () => void;
}) {
  const o = OVERALL[result.overall_risk] || OVERALL.none;
  const none = result.overall_risk === "none" || result.findings.length === 0;

  return (
    <div className="space-y-4">
      {isSample && (
        <div className="rounded-xl border border-line bg-bg p-3 text-center text-xs font-medium text-muted">
          예시 결과입니다 — 실제로는 붙여넣은 계약서에 맞춰 분석해드려요.
        </div>
      )}

      {/* 종합 위험도 배너 */}
      <div className={`animate-fade-up rounded-2xl border p-5 ${o.box}`}>
        <div className="flex items-center gap-2">
          {none ? (
            <CircleCheck size={18} className="text-ok" />
          ) : (
            <Scale size={18} className={o.text} />
          )}
          <span className={`text-sm font-bold ${o.text}`}>{o.label}</span>
          {!none && (
            <span className="ml-auto text-xs font-semibold text-muted">
              {result.findings.length}개 항목
            </span>
          )}
        </div>
        {result.summary && (
          <p className="mt-2 text-sm leading-relaxed text-ink">{result.summary}</p>
        )}
      </div>

      {/* 원문 하이라이트 (best-effort) */}
      {!none && sourceText && (
        <HighlightedSource
          text={sourceText}
          clauses={result.findings.map((f) => f.clause_text)}
        />
      )}

      {/* 발견 항목 카드 */}
      {result.findings.map((f, i) => (
        <FindingCard key={i} finding={f} index={i + 1} />
      ))}

      {none && (
        <div className="card p-5 text-sm leading-relaxed text-ink">
          표준임대차계약서(국토교통부) 양식을 쓰면 더 안전해요. 그래도 보증금·기간·수선 책임 조항은
          꼭 한 번 더 확인하세요.
        </div>
      )}

      {/* disclaimer */}
      <div className="flex items-start gap-2 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-muted" />
        <p>{result.disclaimer}</p>
      </div>

      <button onClick={onReset} className="btn-ghost w-full">
        다른 계약서 검토하기
      </button>
    </div>
  );
}

function FindingCard({
  finding,
  index,
}: {
  finding: ContractResult["findings"][number];
  index: number;
}) {
  const b = RISK_BADGE[finding.risk] || RISK_BADGE.low;
  return (
    <section className="card animate-fade-up p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-bold text-brand">
          {index}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.cls}`}>위험 {b.label}</span>
      </div>

      {finding.clause_text && (
        <blockquote className="border-l-2 border-brand/40 bg-bg px-3 py-2 text-sm italic leading-relaxed text-ink">
          “{finding.clause_text}”
        </blockquote>
      )}

      {finding.legal_basis?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {finding.legal_basis.map((l, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-bg px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-line"
            >
              {l}
            </span>
          ))}
        </div>
      )}

      {finding.why && (
        <p className="mt-3 text-sm leading-relaxed text-ink">{finding.why}</p>
      )}

      {finding.action && (
        <div className="mt-3 rounded-xl border border-line bg-bg p-3">
          <p className="mb-2 text-xs font-bold text-muted">이렇게 요청해보세요</p>
          <p className="text-sm leading-relaxed text-ink">{finding.action}</p>
          <div className="mt-2 flex justify-end">
            <CopyChip text={finding.action} />
          </div>
        </div>
      )}
    </section>
  );
}

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button type="button" onClick={copy} className="btn-ghost text-sm">
      {copied ? (
        <>
          <Check size={15} className="text-brand" /> 복사됨
        </>
      ) : (
        <>
          <Copy size={15} /> 대응 문구 복사
        </>
      )}
    </button>
  );
}

// 원문에서 문제 조항을 형광펜 표시 (best-effort, 실패해도 카드로 충분)
function HighlightedSource({ text, clauses }: { text: string; clauses: string[] }) {
  const segments = useMemo(() => buildHighlight(text, clauses), [text, clauses]);
  if (segments.length <= 1) return null; // 매칭 없으면 표시 생략
  return (
    <details className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-ink">
        원문에서 표시해 보기
        <span className="ml-auto text-xs font-medium text-muted group-open:hidden">펼치기</span>
      </summary>
      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-bg p-3 text-sm leading-relaxed text-ink">
        {segments.map((s, i) =>
          s.mark ? (
            <mark key={i} className="rounded bg-warn-tint px-0.5 text-ink">
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </p>
    </details>
  );
}

function buildHighlight(
  text: string,
  clauses: string[]
): { text: string; mark: boolean }[] {
  // 매칭 구간 수집
  const ranges: [number, number][] = [];
  for (const c of clauses) {
    const needle = (c || "").trim();
    if (needle.length < 6) continue;
    const idx = text.indexOf(needle);
    if (idx !== -1) ranges.push([idx, idx + needle.length]);
  }
  if (ranges.length === 0) return [{ text, mark: false }];
  // 정렬 + 병합
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  // 세그먼트화
  const out: { text: string; mark: boolean }[] = [];
  let cur = 0;
  for (const [s, e] of merged) {
    if (s > cur) out.push({ text: text.slice(cur, s), mark: false });
    out.push({ text: text.slice(s, e), mark: true });
    cur = e;
  }
  if (cur < text.length) out.push({ text: text.slice(cur), mark: false });
  return out;
}
