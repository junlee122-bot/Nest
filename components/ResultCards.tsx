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
} from "lucide-react";
import type {
  AssistResult,
  RepairResult,
  AdminResult,
  UtilityResult,
  Verdict,
  UtilityStatus,
} from "@/lib/types";
import CopyButton from "./CopyButton";
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
        <VerdictBadge verdict={r.responsibility?.verdict} />
        <p className="mt-3 text-sm leading-relaxed text-ink">{r.responsibility?.reason}</p>
        <p className="mt-3 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
          {r.responsibility?.disclaimer}
        </p>
      </Section>

      <Section index="③" icon={<MessageSquareText size={18} />} title="집주인에게 보낼 연락 문구">
        <ToneMessage polite={r.message_polite} firm={r.message_firm} />
        {r.certified_mail_suggested && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
            <FileText size={15} className="mt-0.5 shrink-0 text-brand" />
            <span>
              상황이 가볍지 않아요. 집주인이 응하지 않으면 <b className="text-ink">내용증명</b>{" "}
              발송을 고려해보세요. 내용증명은 우체국(인터넷우체국)에서 보낼 수 있고, 같은 문구를
              그대로 활용할 수 있어요.
            </span>
          </div>
        )}
      </Section>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict?: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string }> = {
    landlord: { label: "집주인 수선의무 가능성 높음", cls: "bg-brand text-white" },
    tenant: { label: "세입자 부담 가능성", cls: "bg-gray-100 text-ink ring-1 ring-line" },
    depends: { label: "사안에 따라 다름", cls: "bg-warn-tint text-[#9A6B00] ring-1 ring-warn/40" },
  };
  const v = verdict && map[verdict] ? map[verdict] : map.depends;
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${v.cls}`}>
      {v.label}
    </span>
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
      <div className="mt-3 flex justify-end">
        <CopyButton text={msg} label="문구 복사" />
      </div>
    </div>
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
