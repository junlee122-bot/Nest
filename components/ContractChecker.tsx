"use client";

import { useState, useMemo } from "react";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  Scale,
  Copy,
  Check,
  CircleCheck,
  ChevronDown,
} from "lucide-react";
import NestMark from "./NestMark";
import AppBar from "./AppBar";
import Doongi from "./mascot/Doongi";
import ShareButton from "./ShareButton";
import { addGrowth } from "@/lib/growth";
import { SAMPLE_CONTRACT, SAMPLE_CONTRACT_TEXT } from "@/lib/sample";
import type { ContractResponse, ContractResult, RiskLevel } from "@/lib/types";

// 위험도는 안전 시맨틱 컬러(레드·앰버) 고정 — 브랜드 컬러와 분리 (v4)
const RISK_BADGE: Record<RiskLevel, { label: string; cls: string }> = {
  high: { label: "높음", cls: "bg-danger text-white" },
  medium: { label: "주의", cls: "bg-warn text-white" },
  low: { label: "참고", cls: "bg-gray-200 text-ink" },
};

// 자주 문제되는 특약 예시 — 입력창에 한 줄씩 추가하는 칩
const TOXIC_EXAMPLES: { label: string; clause: string }[] = [
  { label: "모든 수선비 임차인 부담", clause: "임차인은 모든 수선비를 부담한다." },
  { label: "보증금 반환은 새 세입자 후", clause: "보증금 반환은 신규 임차인 입주 후 지급한다." },
  { label: "원상복구 과도 요구", clause: "퇴거 시 도배·장판 등 원상복구 비용은 임차인이 전액 부담한다." },
  { label: "관리비 내역 미기재", clause: "관리비는 임대인이 정하는 바에 따르며 세부 내역은 별도로 고지하지 않는다." },
];

const OVERALL: Record<
  ContractResult["overall_risk"],
  { label: string; box: string; text: string }
> = {
  high: { label: "위험한 조항이 있어요", box: "border-danger/20 bg-danger-tint", text: "text-danger" },
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
        addGrowth("contract"); // 둥지 키우기 (이 기기에만 저장)
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
      <AppBar
        title="계약서 독소조항 체커"
        right={
          <span className="rounded-full bg-[#EEF0EE] px-2 py-0.5 text-[10px] font-bold text-muted">
            BETA
          </span>
        }
      />
      <div className="container-app pt-3">
        <p className="px-1 text-[13px] font-medium text-muted">
          세입자에게 불리한 조항을 찾아드려요
        </p>
      </div>

      <div className="container-app space-y-5 pt-5">
        {!result && (
          <div className="card p-5">
            <label htmlFor="contract-text" className="block text-base font-bold text-ink">
              계약서 내용을 붙여넣으세요
            </label>
            <p className="mt-1 text-xs text-muted">
              전체가 아니어도 돼요. <b className="text-ink">특약사항만 붙여넣어도</b> 검토해드려요.
              입력한 내용은 서버에 저장하지 않아요.
            </p>
            <textarea
              id="contract-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="예) [특약사항] 1. 임차인은 계약갱신요구권을 포기한다. 2. ..."
              rows={8}
              className="mt-3 w-full resize-y rounded-xl border border-line bg-bg p-3.5 text-base leading-relaxed text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />

            {text.length > 9000 && (
              <p
                className={`mt-1 text-right text-xs ${
                  text.length > 12000 ? "font-bold text-danger" : "text-muted"
                }`}
              >
                {text.length.toLocaleString("ko-KR")} / 12,000자
                {text.length > 12000 && " · 나눠서 검토해주세요"}
              </p>
            )}

            <p className="mt-3 text-xs font-semibold text-muted">이런 특약, 자주 문제돼요</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {TOXIC_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setText((prev) => (prev.includes(ex.clause) ? prev : prev ? `${prev}\n${ex.clause}` : ex.clause))
                  }
                  className="chip"
                >
                  + {ex.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={fillSample} disabled={loading} className="chip">
                예시 계약서 채우기
              </button>
              <button type="button" onClick={showSample} disabled={loading} className="chip">
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

        {/* 로딩 — 둥이가 읽는 중 */}
        {loading && (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            <div className="card flex items-center gap-3 p-4">
              <Doongi mood="thinking" size={72} withNest={false} className="shrink-0" />
              <p className="text-sm font-medium text-ink">
                둥지가 계약서를 꼼꼼히 읽고 있어요. 조항이 많으면 조금 걸려요.
              </p>
            </div>
            <div className="card space-y-3 p-5">
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
            </div>
          </div>
        )}

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
  // 위험 높은 조항이 먼저 보이도록 정렬 (원래 순서는 risk 안에서 유지)
  const RANK: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
  const findings = [...result.findings].sort(
    (a, b) => (RANK[a.risk] ?? 3) - (RANK[b.risk] ?? 3)
  );
  const highN = result.findings.filter((f) => f.risk === "high").length;
  const medN = result.findings.filter((f) => f.risk === "medium").length;
  const gradeLabel =
    result.overall_risk === "high" ? "높음" : result.overall_risk === "medium" ? "주의" : result.overall_risk === "low" ? "낮음" : "양호";

  return (
    <div className="space-y-4">
      {isSample && (
        <div className="rounded-xl border border-line bg-bg p-3 text-center text-xs font-medium text-muted">
          예시 결과예요. 실제로는 붙여넣은 계약서에 맞춰 분석해드려요.
        </div>
      )}

      {/* 결과 도착 안내 — 법률 화면이라 마스코트 없이 담백하게 (v7 P6 규칙) */}
      <p className="no-print px-1 text-sm font-semibold text-ink">
        {result.overall_risk === "high"
          ? "짚고 넘어갈 조항이 있어요. 아래에서 확인하세요."
          : "검토를 마쳤어요. 아래에 정리했어요."}
      </p>

      {/* 종합 위험도 배너 */}
      <div className={`animate-fade-up rounded-2xl border p-5 ${o.box}`}>
        <div className="flex items-center gap-2">
          {none ? (
            <CircleCheck size={18} className="text-ok" />
          ) : (
            <Scale size={18} className={o.text} />
          )}
          <span className="text-xs font-semibold text-muted">이 계약서 위험도</span>
          <span className={`text-base font-extrabold ${o.text}`}>{gradeLabel}</span>
        </div>
        <p className={`mt-1 text-sm font-bold ${o.text}`}>{o.label}</p>
        {!none && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-card px-2.5 py-1 text-xs font-bold text-ink ring-1 ring-line">
              독소조항 {result.findings.length}건
            </span>
            {highN > 0 && (
              <span className="rounded-full bg-danger px-2.5 py-1 text-xs font-bold text-white">
                높음 {highN}
              </span>
            )}
            {medN > 0 && (
              <span className="rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white">
                주의 {medN}
              </span>
            )}
          </div>
        )}
        {result.summary && (
          <p className="mt-3 text-sm leading-relaxed text-ink">{result.summary}</p>
        )}
      </div>

      {/* 원문 하이라이트 (best-effort, 위험도별 색) */}
      {!none && sourceText && (
        <HighlightedSource
          text={sourceText}
          clauses={findings.map((f) => ({ text: f.clause_text, risk: f.risk }))}
        />
      )}

      {/* 발견 항목 카드 — 위험 높은 순 */}
      {findings.map((f, i) => (
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

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onReset} className="btn-ghost">
          다른 계약서 검토
        </button>
        <ShareButton
          text={`[둥지] 계약서 검토: ${o.label} · 독소조항 ${result.findings.length}건`}
          className="btn-ghost"
        />
      </div>
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
        <div>
          <p className="mb-1 text-[11px] font-bold text-muted">계약서 원문</p>
          <blockquote
            className={`rounded-r-lg border-l-[3px] px-3 py-2 text-sm leading-relaxed text-ink ${
              finding.risk === "high"
                ? "border-danger bg-danger-tint/60"
                : finding.risk === "medium"
                  ? "border-warn bg-warn-tint/60"
                  : "border-line bg-bg"
            }`}
          >
            “{finding.clause_text}”
          </blockquote>
        </div>
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
        <div className="mt-2 rounded-xl border border-ok/30 bg-ok-tint p-3">
          <p className="mb-1.5 text-[11px] font-bold text-ok">이렇게 수정을 요청해보세요</p>
          <p className="text-sm leading-relaxed text-ink">{finding.action}</p>
          <div className="mt-2 flex justify-end">
            <CopyChip text={finding.action} />
          </div>
        </div>
      )}

      {finding.case_note && (
        <details className="group mt-3 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-brand">
            더 알아보기
            <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-2 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
            {finding.case_note}
          </p>
        </details>
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

// 원문에서 문제 조항을 위험도별 형광펜으로 표시 (best-effort, 실패해도 카드로 충분)
const MARK_CLS: Record<RiskLevel, string> = {
  high: "bg-danger-tint",
  medium: "bg-warn-tint",
  low: "bg-sky-tint",
};

function HighlightedSource({
  text,
  clauses,
}: {
  text: string;
  clauses: { text: string; risk: RiskLevel }[];
}) {
  const segments = useMemo(() => buildHighlight(text, clauses), [text, clauses]);
  if (segments.length <= 1) return null; // 매칭 없으면 표시 생략
  return (
    <details className="card group p-5 [&_summary::-webkit-details-marker]:hidden" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-ink">
        원문에서 표시해 보기
        <span className="ml-auto text-xs font-medium text-muted group-open:hidden">펼치기</span>
      </summary>
      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-bg p-3 text-sm leading-relaxed text-ink">
        {segments.map((s, i) =>
          s.risk ? (
            <mark key={i} className={`rounded px-0.5 text-ink ${MARK_CLS[s.risk]}`}>
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-semibold text-muted" aria-hidden>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-danger-tint ring-1 ring-danger/30 align-middle" />위험 높음</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-warn-tint ring-1 ring-warn/40 align-middle" />주의</span>
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-sky-tint ring-1 ring-sky/40 align-middle" />참고</span>
      </p>
    </details>
  );
}

function buildHighlight(
  text: string,
  clauses: { text: string; risk: RiskLevel }[]
): { text: string; risk: RiskLevel | null }[] {
  const RANK: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };
  // 매칭 구간 수집 (위험도 포함)
  const ranges: { s: number; e: number; risk: RiskLevel }[] = [];
  for (const c of clauses) {
    const needle = (c.text || "").trim();
    if (needle.length < 6) continue;
    const idx = text.indexOf(needle);
    if (idx !== -1) ranges.push({ s: idx, e: idx + needle.length, risk: c.risk });
  }
  if (ranges.length === 0) return [{ text, risk: null }];
  // 정렬 + 병합 (겹치면 더 높은 위험도 유지)
  ranges.sort((a, b) => a.s - b.s);
  const merged: { s: number; e: number; risk: RiskLevel }[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.s <= last.e) {
      last.e = Math.max(last.e, r.e);
      if (RANK[r.risk] < RANK[last.risk]) last.risk = r.risk;
    } else {
      merged.push({ ...r });
    }
  }
  // 세그먼트화
  const out: { text: string; risk: RiskLevel | null }[] = [];
  let cur = 0;
  for (const { s, e, risk } of merged) {
    if (s > cur) out.push({ text: text.slice(cur, s), risk: null });
    out.push({ text: text.slice(s, e), risk });
    cur = e;
  }
  if (cur < text.length) out.push({ text: text.slice(cur), risk: null });
  return out;
}
