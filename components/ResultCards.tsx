"use client";

import { useEffect, useState } from "react";
import { m } from "framer-motion";
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
  MapPin,
  Phone,
  Wrench,
} from "lucide-react";
import type {
  AssistResult,
  RepairResult,
  AdminResult,
  UtilityResult,
  Verdict,
  Urgency,
  UtilityStatus,
} from "@/lib/types";
import SafetyBanner from "./SafetyBanner";
import Doongi from "./mascot/Doongi";
import { addGrowth } from "@/lib/growth";
import { fadeUp, springSoft, stagger } from "@/lib/motion";
import { CONTACTS_VERIFIED, DISPUTE_HELP, emergencyContactsFor } from "@/lib/contacts";
import {
  naverMapSearchUrl,
  kakaoMapSearchUrl,
  categoryLabel,
  searchTermFor,
  SPONSORED_PROVIDERS,
} from "@/lib/services";

export default function ResultCards({ result }: { result: AssistResult }) {
  if (result.kind === "repair") return <RepairCards r={result} />;
  if (result.kind === "admin") return <AdminCards r={result} />;
  if (result.kind === "utility") return <UtilityCards r={result} />;
  return null;
}

/* ── 공통 섹션 래퍼 (collapsible 지원) ── */
function Section({
  index,
  icon,
  title,
  children,
  collapsible = false,
  defaultOpen = true,
}: {
  index?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const head = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-deep">
        {icon}
      </span>
      <h2 className="flex items-center gap-2 text-base font-bold text-ink">
        {index && <span className="text-brand">{index}</span>}
        {title}
      </h2>
      {collapsible && (
        <ChevronDown
          size={18}
          className="ml-auto shrink-0 text-muted transition-transform group-open:rotate-180"
        />
      )}
    </>
  );

  if (collapsible) {
    return (
      <m.div variants={fadeUp}>
        <details
          open={defaultOpen}
          className="card group p-5 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2.5">
            {head}
          </summary>
          <div className="mt-3">{children}</div>
        </details>
      </m.div>
    );
  }

  return (
    <m.section variants={fadeUp} className="card p-5">
      <div className="mb-3 flex items-center gap-2.5">{head}</div>
      {children}
    </m.section>
  );
}

/* ───────────────── 집 수리 (메인) ───────────────── */
function RepairCards({ r }: { r: RepairResult }) {
  const [tone, setTone] = useState<"polite" | "firm">("polite");
  const msg =
    (tone === "polite" ? r.message_polite : r.message_firm) ||
    "문구를 생성하지 못했어요. 다시 시도해 주세요.";
  const emergency =
    r.emergency && r.emergency.length > 0
      ? r.emergency
      : ["우선 안전을 확인하고, 문제 부위를 사진으로 남겨두세요."];
  return (
    <m.div variants={stagger()} initial="hidden" animate="show" className="space-y-4">
      {r.safety && (
        <m.div variants={fadeUp}>
          <SafetyBanner safety={r.safety} />
        </m.div>
      )}

      {/* 긴급도 신호등 + 지금 당장 할 한 가지 */}
      <UrgencySignal urgency={r.urgency} firstAction={r.firstAction} />

      {/* 핵심 결론을 스크롤 없이 먼저 — 큰 책임 판단 배너 */}
      <VerdictHero responsibility={r.responsibility} />

      <Section index="①" icon={<ClipboardCheck size={18} />} title="지금 당장 할 수 있는 것">
        <ul className="space-y-2.5">
          {emergency.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        index="②"
        icon={<Scale size={18} />}
        title="왜 그런지 근거 보기"
        collapsible
        defaultOpen={false}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1 text-xs font-semibold text-muted ring-1 ring-line">
          <BookOpen size={12} /> 참고: 민법 제623조
        </span>
        <p className="mt-3 text-sm leading-relaxed text-ink">
          {r.responsibility?.reason || "근거 정보를 충분히 불러오지 못했어요. 다시 시도해 주세요."}
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-muted" />
          <p>
            {r.responsibility?.disclaimer ||
              "본 판단은 참고용이며 법적 자문이 아닙니다. 분쟁 시 주택임대차분쟁조정위원회 또는 변호사 상담을 권장합니다."}
          </p>
        </div>
      </Section>

      {/* 문구를 보지 않고 하단 복사/문자를 누르는 사고 방지 — 기본 열기 (v7 P2) */}
      <Section
        index="③"
        icon={<MessageSquareText size={18} />}
        title="집주인에게 보낼 연락 문구"
        collapsible
        defaultOpen
      >
        <ToneMessage tone={tone} setTone={setTone} message={msg} />
        {r.certified_mail_suggested && <CertifiedMailAccordion />}
      </Section>

      {/* 다음 단계 미니 체크리스트 (접힘) */}
      <NextSteps r={r} />

      {/* 도움받기 — verdict/urgency 맥락에 맞춰 업체·긴급 연결 */}
      <HelpConnect r={r} />

      {/* 한 손 사용 — 하단 고정 액션 바 (복사·문자·저장) */}
      <MessageActionBar message={msg} />
      <div className="no-print h-2" aria-hidden />
    </m.div>
  );
}

function UrgencySignal({
  urgency,
  firstAction,
}: {
  urgency?: Urgency;
  firstAction?: string;
}) {
  if (!urgency && !firstAction) return null;
  const map: Record<
    Urgency,
    { label: string; dot: string; box: string; text: string }
  > = {
    emergency: {
      label: "지금 조치 필요",
      dot: "bg-danger",
      box: "border-danger/30 bg-danger-tint",
      text: "text-danger",
    },
    soon: {
      label: "곧 해결하세요",
      dot: "bg-warn",
      box: "border-warn/40 bg-warn-tint",
      text: "text-[#9A6B00]",
    },
    routine: {
      label: "급하지 않아요",
      dot: "bg-ok",
      box: "border-ok/30 bg-ok-tint",
      text: "text-ok",
    },
  };
  const u = urgency && map[urgency] ? map[urgency] : map.routine;
  return (
    <m.div variants={fadeUp} className={`rounded-2xl border p-4 ${u.box}`}>
      <div className="flex items-center gap-2.5">
        {/* 신호등 */}
        <span className="flex items-center gap-1" aria-hidden>
          {(["emergency", "soon", "routine"] as const).map((lvl) => (
            <span
              key={lvl}
              className={`h-2.5 w-2.5 rounded-full ${
                lvl === urgency ? map[lvl].dot : "bg-line"
              }`}
            />
          ))}
        </span>
        <span className={`text-sm font-bold ${u.text}`}>{u.label}</span>
      </div>
      {firstAction && (
        <p className="mt-2.5 text-sm leading-relaxed text-ink">
          <span className="font-bold">먼저 이것부터: </span>
          {firstAction}
        </p>
      )}
    </m.div>
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
  const confidence =
    verdict === "depends"
      ? "단정하기 어려운 사안이에요"
      : "비교적 분명한 편이에요";
  return (
    <m.div variants={fadeUp} className={`rounded-2xl border p-5 ${v.box}`}>
      <p className="mb-2 text-xs font-semibold text-muted">이 문제, 누구 책임일까요?</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full px-3.5 py-1.5 text-sm font-bold ${v.badge}`}>
          {v.label}
        </span>
        <span className="text-xs font-medium text-muted">· {confidence}</span>
      </div>
      {responsibility?.summary && (
        <p className="mt-3 text-base font-semibold leading-snug text-ink">
          {responsibility.summary}
        </p>
      )}
    </m.div>
  );
}

function ToneMessage({
  tone,
  setTone,
  message,
}: {
  tone: "polite" | "firm";
  setTone: (t: "polite" | "firm") => void;
  message: string;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex rounded-2xl bg-[#F0F2F0] p-1">
        {(["polite", "firm"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            aria-pressed={tone === t}
            className={`rounded-xl px-4 py-2 text-sm transition-all ${
              tone === t ? "bg-card font-bold text-ink shadow-card" : "font-semibold text-muted"
            }`}
          >
            {t === "polite" ? "정중하게" : "단호하게"}
          </button>
        ))}
      </div>
      <div className="whitespace-pre-wrap rounded-xl border border-line bg-bg p-4 text-sm leading-relaxed text-ink">
        {message}
      </div>
    </div>
  );
}

// 하단 고정 액션 바 — 엄지로 닿는 위치, 인쇄 시 숨김
function MessageActionBar({ message }: { message: string }) {
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
      <m.div
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springSoft}
        className="no-print fixed inset-x-0 bottom-[64px] z-30 border-t border-line bg-card/95 backdrop-blur"
      >
        <div className="container-app grid grid-cols-3 gap-2 py-3">
          <button type="button" onClick={copyText} className="btn-ghost text-sm">
            <Copy size={16} /> 복사
          </button>
          <button type="button" onClick={sendSms} className="btn-primary text-sm">
            <Send size={16} /> 문자로
          </button>
          <button type="button" onClick={save} className="btn-ghost text-sm">
            <Printer size={16} /> 저장
          </button>
        </div>
      </m.div>
      {toast && (
        <div
          role="status"
          className="no-print fixed inset-x-0 bottom-44 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-ink/90 px-4 py-2.5 text-sm font-medium text-white shadow-lift backdrop-blur animate-fade-up"
        >
          <Check size={15} className="text-brand" /> {toast}
        </div>
      )}
    </>
  );
}

// 다음 단계 — 체크는 localStorage 에만 저장
const REPAIR_STEPS = [
  "집주인에게 위 문구 전송하기",
  "회신 없으면 3~7일 뒤 한 번 더 요청하기",
  "사진·대화 기록을 보관해두기",
  "그래도 미해결이면 주택임대차분쟁조정위원회에 문의하기",
];

// 결과 내용 기반 짧은 해시 — 문제(결과)마다 체크 상태를 분리 (v7 P2)
function resultHash(r: RepairResult): string {
  const src = `${r.responsibility?.summary ?? ""}|${r.firstAction ?? ""}|${(r.message_polite ?? "").slice(0, 60)}`;
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

function NextSteps({ r }: { r: RepairResult }) {
  const STORAGE = `nest:nextsteps:repair:v2:${resultHash(r)}`;
  const [checked, setChecked] = useState<boolean[]>(() => REPAIR_STEPS.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const a = JSON.parse(raw);
        if (Array.isArray(a)) setChecked(REPAIR_STEPS.map((_, i) => !!a[i]));
        return;
      }
    } catch {
      /* noop */
    }
    setChecked(REPAIR_STEPS.map(() => false)); // 다른 결과로 바뀌면 초기화
  }, [STORAGE]);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      try {
        localStorage.setItem(STORAGE, JSON.stringify(next));
      } catch {
        /* noop */
      }
      if (next.every(Boolean)) addGrowth("steps_done"); // 둥지 키우기
      return next;
    });
  }

  return (
    <Section icon={<ListChecks size={18} />} title="다음 단계" collapsible defaultOpen={false}>
      <ul className="space-y-1">
        {REPAIR_STEPS.map((s, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg py-1.5">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-brand"
              />
              <span
                className={`text-sm leading-relaxed ${
                  checked[i] ? "text-muted line-through" : "text-ink"
                }`}
              >
                {s}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {checked.every(Boolean) ? (
        <div className="mt-2 flex items-center gap-2 rounded-xl bg-ok-tint p-2.5">
          <Doongi mood="cheer" size={44} withNest={false} className="shrink-0" />
          <p className="text-sm font-semibold text-ok">
            전부 해냈어요! 기록만 잘 보관하면 든든해요.
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">체크 상태는 이 기기에만 저장돼요.</p>
      )}
    </Section>
  );
}

/* ── 도움받기 (수리 업체·긴급 연결) ── */
function HelpConnect({ r }: { r: RepairResult }) {
  const [region, setRegion] = useState("");
  const cat = r.category;
  const label = categoryLabel(cat);

  const findButtons = (
    <div>
      <input
        type="text"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="동네(구/동) 예: 마포구 (선택)"
        aria-label="업체 검색 동네 입력 (선택)"
        className="w-full rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <div className="mt-2 space-y-2">
        <a
          href={naverMapSearchUrl(cat, region)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary w-full"
        >
          <MapPin size={17} /> 내 주변 {label} 업체 찾기
        </a>
        <a
          href={kakaoMapSearchUrl(cat, region)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost w-full text-sm"
        >
          카카오맵으로 찾기
        </a>
      </div>
      {/* 주변 업체 미리보기 (카카오 로컬, v3 P5) — 키 없으면 조용히 숨김 */}
      <PlacesPreview query={`${region.trim()} ${searchTermFor(cat)}`.trim()} />
      {/* 향후 제휴/스폰서 업체 자리 — 데모에는 비어 있음 */}
      {SPONSORED_PROVIDERS.length > 0 && (
        <div className="mt-2 space-y-2">
          {SPONSORED_PROVIDERS.map((p) => (
            <div key={p.name} className="rounded-xl border border-line p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink">{p.name}</span>
                {p.badge && (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-bold text-brand">
                    {p.badge}
                  </span>
                )}
              </div>
              {p.region && <p className="text-xs text-muted">{p.region}</p>}
              {p.tel && (
                <a href={`tel:${p.tel.replace(/[^0-9+]/g, "")}`} className="text-xs text-brand">
                  {p.tel}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const trustLine = (
    <p className="mt-3 text-xs leading-relaxed text-muted">
      둥지는 특정 업체를 보증하지 않아요. 견적·계약은 직접 확인하세요. 위치·연락처는 저장하지 않아요.
    </p>
  );

  // 긴급: 공식 긴급 연락처(tel:)를 최우선, 그 다음 업체 찾기
  if (r.urgency === "emergency") {
    const contacts = emergencyContactsFor(cat);
    return (
      <Section icon={<Phone size={18} />} title="도움받기: 긴급 연락">
        <p className="text-sm leading-relaxed text-ink">
          위험할 수 있어요. 직접 손대지 말고 먼저 공식 기관에 연락하세요.
        </p>
        <div className="mt-3 space-y-2">
          {contacts.map((c, i) =>
            c.tel ? (
              <a
                key={i}
                href={`tel:${c.tel.replace(/[^0-9+]/g, "")}`}
                className="btn-primary w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <Phone size={16} /> {c.label}
                </span>
                <span className="font-bold">{c.tel}</span>
              </a>
            ) : (
              <p key={i} className="rounded-xl bg-bg p-3 text-sm text-muted">
                {c.label}
              </p>
            )
          )}
        </div>
        <p className="mt-2 text-[11px] text-muted">
          연락처는 변경될 수 있어요 ({CONTACTS_VERIFIED}, 최신 확인 권장).
        </p>
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-2 text-sm font-semibold text-ink">급한 수리 업체 찾기</p>
          {findButtons}
        </div>
        {trustLine}
      </Section>
    );
  }

  // 세입자 부담: 업체 찾기가 1순위
  if (r.responsibility?.verdict === "tenant") {
    return (
      <Section icon={<Wrench size={18} />} title="도움받기: 직접 해결" collapsible defaultOpen={false}>
        <p className="mb-1 text-sm leading-relaxed text-ink">
          이 문제는 보통 세입자가 직접 처리하는 사안이에요. 가까운 업체를 찾아보세요.
        </p>
        {findButtons}
        {trustLine}
      </Section>
    );
  }

  // 집주인 책임(비긴급): 집주인 문구가 1순위 — 업체 찾기는 '대안'으로 접어둠
  if (r.responsibility?.verdict === "landlord") {
    return (
      <Section icon={<Wrench size={18} />} title="도움받기: 집주인이 응답 없을 때" collapsible defaultOpen={false}>
        <p className="text-sm leading-relaxed text-ink">
          이 문제는 보통 <b>집주인 수선의무</b>예요. 먼저 위 문구로 집주인에게 요청하세요. 집주인이
          응답이 없거나 급할 땐 직접 수리할 수 있고, 그 비용은 집주인에게 청구할 수 있어요(민법
          제626조). <b>견적서·영수증을 꼭 보관하세요.</b>
        </p>
        <details className="group mt-3 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-brand">
            직접 업체 찾아보기
            <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3">{findButtons}</div>
        </details>
        {trustLine}
      </Section>
    );
  }

  // 사안에 따라 다름(depends): 상의 우선 + 업체 점검은 보조
  return (
    <Section icon={<Wrench size={18} />} title="도움받기" collapsible defaultOpen={false}>
      <p className="text-sm leading-relaxed text-ink">
        원인에 따라 책임이 갈리는 사안이에요. 집주인과 상의가 우선이며, 필요하면 업체에 점검을 의뢰해
        원인을 확인할 수 있어요.
      </p>
      <details className="group mt-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-brand">
          업체 찾아보기
          <ChevronDown size={15} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3">{findButtons}</div>
      </details>
      {trustLine}
    </Section>
  );
}

// 주변 업체 미리보기 — 카카오 로컬 검색 (서버 키 없으면 버튼 자체가 사라짐)
function PlacesPreview({ query }: { query: string }) {
  const [state, setState] = useState<"idle" | "loading" | "hidden" | "done">("idle");
  const [places, setPlaces] = useState<
    { name: string; phone: string | null; address: string | null; mapUrl: string | null }[]
  >([]);

  async function run() {
    setState("loading");
    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.places) && json.places.length > 0) {
        setPlaces(json.places);
        setState("done");
      } else {
        // 키 미설정·결과 없음 → 지도 딥링크만으로 충분하므로 조용히 숨김
        setState("hidden");
      }
    } catch {
      setState("hidden");
    }
  }

  if (state === "hidden") return null;

  if (state === "done") {
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-bold text-muted">주변 업체 미리보기</p>
        {places.map((p, i) => (
          <div key={i} className="rounded-xl border border-line p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate font-semibold text-ink">{p.name}</span>
              {p.phone && (
                <a
                  href={`tel:${p.phone.replace(/[^0-9+]/g, "")}`}
                  className="shrink-0 text-xs font-semibold text-brand"
                >
                  {p.phone}
                </a>
              )}
            </div>
            {p.address && <p className="mt-0.5 text-xs text-muted">{p.address}</p>}
            {p.mapUrl && (
              <a
                href={p.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-brand"
              >
                카카오맵에서 보기
              </a>
            )}
          </div>
        ))}
        <p className="text-[11px] leading-relaxed text-muted">
          카카오 검색 결과로, 둥지가 업체를 보증하지 않아요.
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === "loading"}
      className="btn-ghost mt-2 w-full text-sm"
    >
      {state === "loading" ? "찾는 중…" : "주변 업체 미리보기"}
    </button>
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
          분쟁이 풀리지 않으면 <b className="text-ink">{DISPUTE_HELP.label}</b>에 조정을 신청할 수
          있어요. 비용 부담이 적고 변호사 없이도 진행할 수 있습니다. {DISPUTE_HELP.note}
        </p>
        <p className="text-[11px] text-muted">연락처·접수처는 변경될 수 있어요 ({CONTACTS_VERIFIED}).</p>
      </div>
    </details>
  );
}

/* ───────────────── 이사·행정 ───────────────── */
function AdminCards({ r }: { r: AdminResult }) {
  return (
    <m.div variants={stagger()} initial="hidden" animate="show" className="space-y-4">
      {r.intro && (
        <m.p variants={fadeUp} className="rounded-2xl bg-brand-tint p-4 text-sm leading-relaxed text-ink">
          {r.intro}
        </m.p>
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
    </m.div>
  );
}

/* ───────────────── 공과금 ───────────────── */
function UtilityCards({ r }: { r: UtilityResult }) {
  const map: Record<UtilityStatus, { label: string; cls: string }> = {
    high: { label: "평균보다 높아요", cls: "bg-coral text-white" },
    normal: { label: "평균 범위예요", cls: "bg-gray-100 text-ink ring-1 ring-line" },
    low: { label: "평균보다 낮아요", cls: "bg-gray-100 text-ink ring-1 ring-line" },
    unknown: { label: "판단이 어려워요", cls: "bg-warn-tint text-[#9A6B00] ring-1 ring-warn/40" },
  };
  const s = map[r.status] || map.unknown;
  return (
    <m.div variants={stagger()} initial="hidden" animate="show" className="space-y-4">
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
        <m.p variants={fadeUp} className="rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
          출처: {r.sources.join(" · ")}
        </m.p>
      )}
    </m.div>
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
            ? "bg-coral"
            : "bg-brand"
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
