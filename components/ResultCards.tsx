"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Scale,
  MessageSquareText,
  ListChecks,
  Lightbulb,
  CalendarClock,
  FileText,
  BookOpen,
  Copy,
  Send,
  Printer,
  Check,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import type {
  AssistResult,
  RepairResult,
  AdminResult,
  UtilityResult,
  Verdict,
  UtilityStatus,
} from "@/lib/types";
import SafetyBanner from "./SafetyBanner";

export default function ResultCards({ result }: { result: AssistResult }) {
  if (result.kind === "repair") return <RepairCards r={result} />;
  if (result.kind === "admin") return <AdminCards r={result} />;
  if (result.kind === "utility") return <UtilityCards r={result} />;
  return null;
}

/* ── 공통 섹션 래퍼 ── */
function Section({
  index,
  icon,
  title,
  children,
}: {
  index?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card animate-fade-up p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand">
          {icon}
        </span>
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          {index && <span className="text-brand">{index}</span>}
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/* ───────────────── 집 수리 (메인) ───────────────── */
function RepairCards({ r }: { r: RepairResult }) {
  return (
    <div className="space-y-4">
      {r.safety && <SafetyBanner safety={r.safety} />}

      {/* 핵심 결론을 스크롤 없이 먼저 — 큰 책임 판단 배너 */}
      <VerdictHero responsibility={r.responsibility} />

      <Section index="①" icon={<ClipboardCheck size={18} />} title="지금 당장 할 수 있는 것">
        <ul className="space-y-2.5">
          {(r.emergency || []).map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section index="②" icon={<Scale size={18} />} title="이거 누구 책임?">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">
          <BookOpen size={12} /> 참고: 민법 제623조
        </span>
        <p className="mt-3 text-sm leading-relaxed text-ink">{r.responsibility?.reason}</p>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-muted" />
          <p>{r.responsibility?.disclaimer}</p>
        </div>
      </Section>

      <Section index="③" icon={<MessageSquareText size={18} />} title="집주인에게 보낼 연락 문구">
        <ToneMessage polite={r.message_polite} firm={r.message_firm} />
        {r.certified_mail_suggested && <CertifiedMailAccordion />}
      </Section>
    </div>
  );
}

function VerdictHero({ responsibility }: { responsibility?: RepairResult["responsibility"] }) {
  const map: Record<
    Verdict,
    { label: string; box: string; badge: string }
  > = {
    landlord: {
      label: "집주인 수선의무 가능성 높음",
      box: "border-brand/20 bg-brand-tint",
      badge: "bg-brand text-white",
    },
    tenant: {
      label: "세입자 부담 가능성",
      box: "border-line bg-bg",
      badge: "bg-gray-200 text-ink",
    },
    depends: {
      label: "사안에 따라 다름",
      box: "border-warn/30 bg-warn-tint",
      badge: "bg-warn text-white",
    },
  };
  const verdict = responsibility?.verdict;
  const v = verdict && map[verdict] ? map[verdict] : map.depends;
  return (
    <div className={`animate-fade-up rounded-2xl border p-5 ${v.box}`}>
      <p className="mb-2 text-xs font-semibold text-muted">이 문제, 누구 책임일까요?</p>
      <span className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-bold ${v.badge}`}>
        {v.label}
      </span>
      {responsibility?.summary && (
        <p className="mt-3 text-base font-semibold leading-snug text-ink">
          {responsibility.summary}
        </p>
      )}
    </div>
  );
}

function ToneMessage({ polite, firm }: { polite: string; firm: string }) {
  const [tone, setTone] = useState<"polite" | "firm">("polite");
  const msg = tone === "polite" ? polite : firm;
  return (
    <div>
      <div className="mb-3 inline-flex rounded-xl bg-bg p-1">
        {(["polite", "firm"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
              tone === t ? "bg-card text-brand shadow-sm" : "text-muted"
            }`}
          >
            {t === "polite" ? "정중하게" : "단호하게"}
          </button>
        ))}
      </div>
      <div className="whitespace-pre-wrap rounded-xl border border-line bg-bg p-4 text-sm leading-relaxed text-ink">
        {msg}
      </div>
      <MessageActions message={msg} />
    </div>
  );
}

function MessageActions({ message }: { message: string }) {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(t: string) {
    setToast(t);
    setTimeout(() => setToast(null), 1900);
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = message;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showToast("문구가 복사됐어요");
  }

  function sendSms() {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    if (!isMobile) {
      // 데스크톱 등 미지원 환경 → 복사로 자연스럽게 폴백
      copyText();
      showToast("문구를 복사했어요. 문자 앱에 붙여넣어 보내세요");
      return;
    }
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const body = encodeURIComponent(message);
    // iOS 와 Android 의 본문 파라미터 구분자가 다름
    window.location.href = isIOS ? `sms:&body=${body}` : `sms:?body=${body}`;
  }

  function save() {
    window.print();
  }

  return (
    <>
      <div className="no-print mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={copyText} className="btn-ghost text-sm">
          <Copy size={16} /> 복사
        </button>
        <button type="button" onClick={sendSms} className="btn-ghost text-sm">
          <Send size={16} /> 문자로
        </button>
        <button type="button" onClick={save} className="btn-ghost text-sm">
          <Printer size={16} /> 저장
        </button>
      </div>
      {toast && (
        <div
          role="status"
          className="no-print fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-ink/90 px-4 py-2.5 text-sm font-medium text-white shadow-lift backdrop-blur animate-fade-up"
        >
          <Check size={15} className="text-brand" /> {toast}
        </div>
      )}
    </>
  );
}

function CertifiedMailAccordion() {
  return (
    <details className="group mt-3 rounded-xl border border-line bg-bg p-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-semibold text-ink">
        <FileText size={15} className="shrink-0 text-brand" />
        내용증명이 필요할 수도 있어요
        <ChevronDown
          size={16}
          className="ml-auto shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-2 px-3 pb-3 text-xs leading-relaxed text-muted">
        <p>
          상황이 가볍지 않아요. 집주인이 수선 요청에 응하지 않으면{" "}
          <b className="text-ink">내용증명</b> 발송을 고려해보세요. 내용증명은 &quot;내가 언제 어떤
          요청을 했다&quot;는 사실을 공적으로 남기는 우편으로, 위에서 만든 문구를 거의 그대로 쓸 수
          있어요. 인터넷우체국이나 가까운 우체국에서 보낼 수 있습니다.
        </p>
        <p>
          분쟁이 풀리지 않으면 <b className="text-ink">주택임대차분쟁조정위원회</b>에 조정을 신청할
          수 있어요. 비용 부담이 적고 변호사 없이도 진행할 수 있습니다.
          {/* 연락처/링크는 최신 확인 필요 — 화면 표기 시 검증된 정보 사용 */}
        </p>
      </div>
    </details>
  );
}

/* ───────────────── 이사·행정 ───────────────── */
function AdminCards({ r }: { r: AdminResult }) {
  return (
    <div className="space-y-4">
      {r.intro && (
        <p className="animate-fade-up rounded-2xl bg-brand-tint p-4 text-sm leading-relaxed text-ink">
          {r.intro}
        </p>
      )}
      <Section icon={<ListChecks size={18} />} title="맞춤 체크리스트">
        <ol className="space-y-3">
          {(r.checklist || []).map((item, i) => (
            <li key={i} className="rounded-xl border border-line p-3.5">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-sm leading-relaxed text-muted">{item.detail}</p>
                  {item.deadline && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warn-tint px-2.5 py-0.5 text-xs font-semibold text-[#9A6B00]">
                      <CalendarClock size={12} /> {item.deadline}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>
      {r.tips && r.tips.length > 0 && <TipsCard tips={r.tips} />}
    </div>
  );
}

/* ───────────────── 공과금 ───────────────── */
function UtilityCards({ r }: { r: UtilityResult }) {
  const map: Record<UtilityStatus, { label: string; cls: string }> = {
    high: { label: "평균보다 높아요", cls: "bg-brand text-white" },
    normal: { label: "평균 범위예요", cls: "bg-gray-100 text-ink ring-1 ring-line" },
    low: { label: "평균보다 낮아요", cls: "bg-gray-100 text-ink ring-1 ring-line" },
    unknown: { label: "판단이 어려워요", cls: "bg-warn-tint text-[#9A6B00] ring-1 ring-warn/40" },
  };
  const s = map[r.status] || map.unknown;
  return (
    <div className="space-y-4">
      <Section icon={<Scale size={18} />} title="공과금 진단">
        {r.summary && <p className="mb-3 text-sm leading-relaxed text-ink">{r.summary}</p>}
        <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${s.cls}`}>
          {s.label}
        </span>
        <UtilityChart
          amount={r.amount}
          average={r.average}
          unit={r.unit || "원"}
          over={r.status === "high"}
        />
        {r.assessment && (
          <p className="mt-3 text-sm leading-relaxed text-ink">{r.assessment}</p>
        )}
      </Section>
      {r.tips && r.tips.length > 0 && <TipsCard tips={r.tips} title="절약 팁" />}
      {r.sources && r.sources.length > 0 && (
        <p className="rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
          출처: {r.sources.join(" · ")}
        </p>
      )}
    </div>
  );
}

// 차트 라이브러리 없이 div 막대로 가볍게 — 내 요금 vs 평균 비교
function UtilityChart({
  amount,
  average,
  unit,
  over,
}: {
  amount?: number | null;
  average?: number | null;
  unit: string;
  over: boolean;
}) {
  if (typeof amount !== "number" || typeof average !== "number" || average <= 0) {
    return null;
  }
  const max = Math.max(amount, average);
  const fmt = (n: number) => n.toLocaleString("ko-KR") + unit;
  const rows = [
    { label: "내 요금", value: amount, accent: true },
    { label: "1인 가구 평균", value: average, accent: false },
  ];
  return (
    <div className="mt-4 space-y-3 rounded-xl border border-line bg-bg p-4">
      {rows.map((row) => {
        const pct = Math.max(6, Math.round((row.value / max) * 100));
        const barColor = row.accent
          ? over
            ? "bg-brand"
            : "bg-gray-400"
          : "bg-gray-300";
        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-muted">{row.label}</span>
              <span className="font-bold text-ink">{fmt(row.value)}</span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-line"
              role="img"
              aria-label={`${row.label} ${fmt(row.value)}`}
            >
              <div
                className={`h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted">
        {over
          ? `평균보다 약 ${fmt(amount - average)} 더 나왔어요.`
          : amount <= average
            ? `평균보다 약 ${fmt(average - amount)} 적게 나왔어요.`
            : "평균 범위 안이에요."}
      </p>
    </div>
  );
}

function TipsCard({ tips, title = "알아두면 좋아요" }: { tips: string[]; title?: string }) {
  return (
    <Section icon={<Lightbulb size={18} />} title={title}>
      <ul className="space-y-2.5">
        {tips.map((t, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
