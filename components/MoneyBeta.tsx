"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Landmark,
  Loader2,
  AlertCircle,
  Wallet,
  Info,
} from "lucide-react";
import NestMark from "./NestMark";
import ShareButton from "./ShareButton";

interface Category {
  key: string;
  label: string;
  amount: number;
  count: number;
}
interface AnalyzeData {
  ok: true;
  mock?: boolean;
  empty?: boolean;
  message?: string;
  total?: number;
  etc?: number;
  txCount?: number;
  categories?: Category[];
  comment?: string | null;
  period?: { from: string; to: string };
}

const BERROR_MSG: Record<string, string> = {
  config: "베타 설정이 아직 완료되지 않았어요. (오픈뱅킹 환경변수 필요)",
  state: "보안 검증에 실패했어요(state 불일치). 다시 시도해주세요.",
  token: "토큰 교환에 실패했어요. 잠시 후 다시 연결해주세요.",
};

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const fmtDate = (d?: string) =>
  d && d.length === 8 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6, 8)}` : "";

export default function MoneyBeta({ configured }: { configured: boolean }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [data, setData] = useState<AnalyzeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const berror = params.get("berror");
    if (berror) {
      setError(BERROR_MSG[berror] || "문제가 생겼어요. 다시 시도해주세요.");
      setStatus("error");
      return;
    }
    if (params.get("connected") === "1") {
      analyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/openbanking/analyze", { cache: "no-store" });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "분석에 실패했어요.");
        setStatus("error");
      } else {
        setData(j);
        setStatus("done");
      }
    } catch {
      setError("연결에 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-dvh pb-16">
      {/* 헤더 */}
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
              <Wallet size={22} />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
                주거비 자동분석
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                  BETA
                </span>
              </h1>
              <p className="text-sm text-muted">오픈뱅킹으로 월세·공과금 한눈에</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-app space-y-5 pt-5">
        {/* 테스트베드(모의계좌) 고지 — 항상 노출 */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-warn/40 bg-warn-tint p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-warn" />
          <p className="text-sm leading-relaxed text-ink">
            <b>베타 · 오픈뱅킹 테스트베드(모의계좌) 기반</b>이에요. 실제 계좌는 연동되지 않으며,
            금융결제원 테스트베드가 제공하는 <b>모의 거래내역</b>으로 동작합니다.
          </p>
        </div>

        {/* 설정 안됨 → 베타 준비중 안내 (대부분의 심사 환경) */}
        {!configured && (
          <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
            <NestMark size={44} className="text-brand/70" />
            <h2 className="text-base font-bold text-ink">베타 준비중 — 설정이 필요해요</h2>
            <p className="text-sm leading-relaxed text-muted">
              이 기능은 금융결제원 오픈뱅킹 테스트베드 연동 설정(환경변수)이 있어야 동작해요. 설정이
              완료되면 모의계좌의 거래내역으로 주거비를 자동 집계해 보여드립니다.
            </p>
            <Link href="/" className="btn-ghost mt-1">
              메인으로 돌아가기
            </Link>
          </div>
        )}

        {/* 설정됨 → 연결/분석 흐름 */}
        {configured && status !== "done" && (
          <div className="card p-5">
            <h2 className="text-base font-bold text-ink">내 주거비, 자동으로 분석해볼까요?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              오픈뱅킹 테스트베드 모의계좌를 연결하면 최근 약 2개월 거래내역에서 월세·관리비·전기·가스·
              수도·통신비를 자동으로 분류해드려요.
            </p>

            {status === "loading" ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-bg p-4">
                <Loader2 size={18} className="animate-spin text-brand" />
                <span className="text-sm font-medium text-ink">거래내역을 분석하는 중…</span>
              </div>
            ) : (
              <a href="/api/openbanking/connect" className="btn-primary mt-4 w-full">
                <Landmark size={18} /> 내 주거비 분석해보기 (베타)
              </a>
            )}

            {status === "error" && error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-tint p-4"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
                <div className="space-y-2">
                  <p className="text-sm text-ink">{error}</p>
                  <a href="/api/openbanking/connect" className="btn-ghost text-sm">
                    다시 연결
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 결과 */}
        {status === "done" && data && (
          <MoneyResult data={data} onRetry={analyze} />
        )}

        {/* 프라이버시 고지 */}
        <p className="px-1 text-center text-xs leading-relaxed text-muted">
          이 베타는 오픈뱅킹 테스트베드 모의데이터로만 동작하며, 실계좌·실금융정보를 저장하지 않습니다.
          토큰은 데모 세션에만 임시 보관되고 서버에 영구 저장되지 않습니다.
        </p>
      </div>
    </main>
  );
}

function MoneyResult({ data, onRetry }: { data: AnalyzeData; onRetry: () => void }) {
  if (data.empty) {
    return (
      <div className="card p-5">
        <MockBadge />
        <p className="mt-3 text-sm leading-relaxed text-ink">{data.message}</p>
        <button onClick={onRetry} className="btn-ghost mt-4 w-full">
          다시 분석
        </button>
      </div>
    );
  }

  const cats = (data.categories || []).filter((c) => c.amount > 0);
  const max = Math.max(1, ...cats.map((c) => c.amount));

  return (
    <div className="space-y-4">
      <div className="card animate-fade-up p-5">
        <MockBadge />
        <p className="mt-3 text-sm text-muted">
          {fmtDate(data.period?.from)} ~ {fmtDate(data.period?.to)} · 출금 {data.txCount}건 기준
        </p>
        <p className="mt-1 text-2xl font-extrabold text-ink">
          총 주거비 {won(data.total || 0)}
        </p>

        <div className="mt-4 space-y-3">
          {cats.length === 0 && (
            <p className="text-sm text-muted">주거비로 분류된 출금이 없어요.</p>
          )}
          {cats.map((c) => {
            const pct = Math.max(4, Math.round((c.amount / max) * 100));
            return (
              <div key={c.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">
                    {c.label}
                    <span className="ml-1 text-muted">· {c.count}건</span>
                  </span>
                  <span className="font-bold text-ink">{won(c.amount)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {typeof data.etc === "number" && data.etc > 0 && (
          <p className="mt-3 text-xs text-muted">
            그 외(주거비 외) 출금 합계 {won(data.etc)} — 주거비 총합에는 포함하지 않았어요.
          </p>
        )}
      </div>

      {data.comment && (
        <div className="card animate-fade-up p-5">
          <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-ink">
            <NestMark size={20} className="text-brand" /> 둥지의 한마디
          </h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{data.comment}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onRetry} className="btn-ghost">
          다시 분석
        </button>
        <ShareButton text={`[둥지] 주거비 분석 — 총 ${won(data.total || 0)}`} className="btn-ghost" />
      </div>
    </div>
  );
}

function MockBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">
      <Info size={12} /> 테스트베드 모의데이터
    </span>
  );
}
