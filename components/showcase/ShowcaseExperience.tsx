"use client";

import Link from "next/link";
import { AnimatePresence, m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  DatabaseZap,
  FileText,
  Home,
  Image as ImageIcon,
  MapPin,
  MessageSquareText,
  Pause,
  Play,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Utensils,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import NestMark from "@/components/NestMark";

type ScenarioId = "repair" | "contract" | "grocery";

type Scenario = {
  id: ScenarioId;
  label: string;
  icon: typeof Wrench;
  eyebrow: string;
  title: string;
  userLine: string;
  mediaLabel: string;
  primarySignal: string;
  secondarySignal: string;
  actionTitle: string;
  actionBody: string;
  resultBadge: string;
  chips: string[];
  accent: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "repair",
    label: "누수 사진 진단",
    icon: Wrench,
    eyebrow: "집수리 AI",
    title: "천장 얼룩 사진 1장 → 응급처치와 집주인 문구까지",
    userLine: "천장에서 물이 떨어지고 벽지가 젖었어요. 지금 뭘 해야 하나요?",
    mediaLabel: "사진 분석 중 · 누수/곰팡이 징후",
    primarySignal: "위험도: 오늘 기록·연락 필요",
    secondarySignal: "책임 가능성: 임대인 수선의무 우선 검토",
    actionTitle: "집주인에게 보낼 문장 자동 작성",
    actionBody: "안녕하세요. 오늘 21시경 거실 천장 누수와 벽지 젖음이 확인되어 사진과 영상을 남겼습니다. 추가 피해 방지를 위해 수리 확인 부탁드립니다.",
    resultBadge: "오늘 할 일 3개",
    chips: ["증거 촬영", "누전 주의", "문자 복사", "분쟁기관 안내"],
    accent: "from-brand/25 via-sky/20 to-sun/25",
  },
  {
    id: "contract",
    label: "계약서 위험 조항",
    icon: FileText,
    eyebrow: "계약서 체크",
    title: "특약 문장을 붙여넣으면 위험 조항을 카드로 분리",
    userLine: "임차인은 모든 수선비를 부담하며, 보증금 반환은 신규 임차인 입주 후로 한다.",
    mediaLabel: "텍스트 스캔 · 위험 표현 하이라이트",
    primarySignal: "위험도: 높음 · 일방 부담 조항",
    secondarySignal: "근거: 수선의무·보증금 반환 리스크",
    actionTitle: "수정 요청 문구 제안",
    actionBody: "모든 수선비를 임차인이 부담한다는 표현은 과도할 수 있어, 고의·과실 또는 소모품에 한정하는 문구로 조정 요청하는 것을 권장합니다.",
    resultBadge: "수정 후보 2개",
    chips: ["위험 조항", "근거 표시", "수정 문구", "주의 고지"],
    accent: "from-danger/20 via-coral/20 to-sun/25",
  },
  {
    id: "grocery",
    label: "혼밥 장보기",
    icon: Utensils,
    eyebrow: "생활비 코치",
    title: "예산·재료 → 식단, 시세, 제철, 음식 사진까지 연결",
    userLine: "3만 5천 원으로 7일치 점심·저녁을 간단하게 먹고 싶어요.",
    mediaLabel: "음식 이미지 API · 오늘 시세 매칭",
    primarySignal: "예산: 34,800원 예상 · 초과 없음",
    secondarySignal: "데이터: 제철 재료 3개 · KAMIS/참고가 혼합",
    actionTitle: "사진이 붙은 식단 카드 생성",
    actionBody: "두부계란덮밥, 김치볶음밥, 대파계란국처럼 반복 활용 가능한 메뉴를 만들고 음식 사진·보관 팁·먼저 먹을 순서를 붙입니다.",
    resultBadge: "데이터 접지 완료",
    chips: ["Pexels 이미지", "KAMIS 시세", "제철", "보관 팁"],
    accent: "from-brand/25 via-sun/20 to-coral/20",
  },
];

// tag는 실제 동작 기준의 정직한 상태 표기 — 키가 없을 때 앱이 어떻게 폴백하는지 그대로 씁니다.
const DATA_SIGNALS = [
  { key: "법령", icon: ShieldCheck, title: "수선의무·임대차 룰북", tag: "내장 · 항상 동작", body: "민법 제623조와 판례 기반 룰북으로 AI 판단을 한 번 더 검증합니다. 법제처 API를 연동하면 근거가 현행 법령 원문으로 승격됩니다." },
  { key: "RTMS", icon: Home, title: "실거래가·월세 비교", tag: "공공데이터 연동", body: "국토교통부 전월세 실거래가를 연동해 동네·면적 기준으로 내 조건이 과한지 비교해 보여줍니다." },
  { key: "KAMIS", icon: Banknote, title: "오늘 장보기 시세", tag: "무키 시 참고가 폴백", body: "aT KAMIS 일일 소매가를 장보기 리스트에 붙이고, 예산을 넘기면 시세 기반 대체재 제안으로 이어집니다. 키가 없어도 내장 참고가격표로 동작합니다." },
  { key: "식약처", icon: ReceiptText, title: "공공 레시피 DB", tag: "공공데이터 연동", body: "식품안전나라 레시피의 조리 단계·열량·사진을 남은 재료 결과에 붙입니다." },
  { key: "Pexels", icon: ImageIcon, title: "음식 이미지 API", tag: "무키 시 텍스트 폴백", body: "AI가 만든 메뉴명으로 사진을 검색해 결과 카드의 시각적 완성도를 올립니다. 키가 없으면 텍스트 카드로 동작합니다." },
  { key: "Kakao", icon: MapPin, title: "동네 수리·생활 장소", tag: "오픈API 연동", body: "수리 진단 결과에 주변 설비·인테리어 업체 미리보기를 붙여 다음 행동으로 연결합니다." },
];

const DEMO_STEPS = ["입력", "AI 판단", "공공데이터 보강", "바로 행동"];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ShowcaseExperience() {
  const [activeId, setActiveId] = useState<ScenarioId>("repair");
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(DATA_SIGNALS[2]);
  const [slider, setSlider] = useState(64);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const active = useMemo(
    () => SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0],
    [activeId]
  );

  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % DEMO_STEPS.length;
        if (next === 0) {
          setActiveId((current) => {
            const idx = SCENARIOS.findIndex((s) => s.id === current);
            return SCENARIOS[(idx + 1) % SCENARIOS.length].id;
          });
        }
        return next;
      });
    }, reduceMotion ? 2800 : 1900);
    return () => window.clearInterval(timer);
  }, [autoPlay, reduceMotion]);

  function selectScenario(id: ScenarioId) {
    setAutoPlay(false);
    setActiveId(id);
    setStep(0);
  }

  function restartDemo() {
    setActiveId("repair");
    setStep(0);
    setAutoPlay(true);
  }

  const ActiveIcon = active.icon;

  return (
    <main className="relative -mb-[68px] min-h-dvh overflow-hidden bg-[#07150f] text-white">
      <m.div
        className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-brand"
        style={{ scaleX }}
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(13,160,92,.32), transparent 26%), radial-gradient(circle at 92% 4%, rgba(255,185,57,.2), transparent 24%), radial-gradient(circle at 45% 90%, rgba(90,185,234,.22), transparent 35%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
        aria-hidden
      />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#07150f]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-ink shadow-cta">
              <NestMark size={22} />
            </span>
            <span>
              <span className="block text-sm font-black leading-tight">둥지</span>
              <span className="block text-[10px] font-semibold text-white/55">Judge interactive</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="쇼케이스 섹션">
            {["Live", "Data", "Impact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="rounded-full px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <Link href="/repair" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-ink shadow-lift transition hover:translate-y-[-1px]">
            앱 체험하기 <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      <section id="live" className="relative z-10 mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-28 lg:grid-cols-[1.02fr_.98fr]">
        <div>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-brand-tint shadow-card backdrop-blur"
          >
            <Sparkles size={15} />
            90초 안에 이해되는 주거 생활 AI 데모
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 max-w-3xl break-keep font-display text-5xl font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl sm:leading-[1.02] lg:text-7xl"
          >
            설명하지 말고,
            <span className="block bg-gradient-to-r from-brand-tint via-white to-sun bg-clip-text text-transparent">
              만지게 보여주세요.
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-2xl break-keep text-base leading-8 text-white/70 sm:text-lg"
          >
            심사위원이 스크롤하고 탭하면 둥지가 사진, 계약서, 장보기 데이터를 어떻게 행동 카드로 바꾸는지 바로 보입니다. 실제 앱으로 들어가기 전, 제품 가치를 압축해서 보여주는 인터랙티브 웹사이트입니다.
          </m.p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoPlay((v) => !v)}
              className={cx(
                "inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                autoPlay ? "bg-brand text-white shadow-cta" : "bg-white text-ink shadow-lift hover:translate-y-[-1px]"
              )}
              aria-pressed={autoPlay}
            >
              {autoPlay ? <Pause size={18} /> : <Play size={18} />}
              {autoPlay ? "일시정지" : "90초 데모 시작"}
            </button>
            <button
              type="button"
              onClick={restartDemo}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label="데모를 처음부터 다시 재생"
            >
              <RotateCcw size={17} />
              처음부터
            </button>
            <Link href="/grocery" className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
              실제 장보기 코치 열기 <ChevronRight size={18} />
            </Link>
          </div>
          {reduceMotion && (
            <p className="mt-3 text-xs leading-5 text-white/55">
              동작 줄이기 설정을 감지했어요. 자동 재생 대신 아래 시나리오 버튼으로 천천히 살펴볼 수 있어요.
            </p>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              const isActive = activeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectScenario(s.id)}
                  aria-pressed={isActive}
                  className={cx(
                    "group rounded-3xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                    isActive
                      ? "border-brand/70 bg-white text-ink shadow-lift"
                      : "border-white/15 bg-white/10 text-white/70 hover:border-white/30 hover:bg-white/15"
                  )}
                >
                  <span className={cx("mb-3 inline-grid h-10 w-10 place-items-center rounded-2xl", isActive ? "bg-brand-tint text-brand-deep" : "bg-white/10 text-white")}> <Icon size={20} /> </span>
                  <span className="block text-sm font-black">{s.label}</span>
                  <span className={cx("mt-1 block text-xs leading-5", isActive ? "text-muted" : "text-white/50")}>{s.eyebrow}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[420px]">
          <m.div
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 -top-10 hidden rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-lift backdrop-blur md:block"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white"><DatabaseZap size={20} /></div>
              <div>
                <p className="text-xs font-black">공공데이터 보강</p>
                <p className="mt-0.5 text-[11px] text-white/55">AI 답변을 근거 카드로</p>
              </div>
            </div>
          </m.div>

          <div
            role="group"
            aria-label={`데모 미리보기 — ${active.label}`}
            className="rounded-[3rem] border border-white/15 bg-white/10 p-3 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl"
          >
            <div className="overflow-hidden rounded-[2.35rem] bg-[#f7f8f5] text-ink">
              <div className="flex items-center justify-between border-b border-line bg-card/95 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-tint text-brand-deep"><ActiveIcon size={19} /></span>
                  <div>
                    <p className="text-[11px] font-black text-brand-deep">{active.eyebrow}</p>
                    <p className="text-sm font-black">둥지 Live</p>
                  </div>
                </div>
                <span className="rounded-full bg-ok-tint px-2.5 py-1 text-[10px] font-black text-ok">데모 재현</span>
              </div>

              <div className={cx("bg-gradient-to-br p-5", active.accent)}>
                <AnimatePresence mode="wait">
                  <m.div
                    key={active.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.26 }}
                    className="space-y-4"
                  >
                    <div className="rounded-3xl bg-white/90 p-4 shadow-card">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-[#F0F2F0] px-2.5 py-1 text-[10px] font-black text-muted">사용자 입력</span>
                        <Camera size={17} className="text-muted" />
                      </div>
                      <p className="text-[15px] font-black leading-6">{active.title}</p>
                      <p className="mt-2 rounded-2xl bg-bg p-3 text-[12px] leading-5 text-muted">“{active.userLine}”</p>
                    </div>

                    <div className="rounded-3xl bg-[#07150f] p-4 text-white shadow-lift">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-brand-tint">
                          <Sparkles size={12} /> {active.mediaLabel}
                        </span>
                        <span className="text-[10px] font-bold text-white/45">{DEMO_STEPS[step]}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-1.5" aria-label="데모 진행 단계">
                        {DEMO_STEPS.map((name, i) => (
                          <span key={name} className={cx("h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-white/15")} />
                        ))}
                      </div>
                      <div className="mt-4 space-y-2.5">
                        {[active.primarySignal, active.secondarySignal].map((line) => (
                          <div key={line} className="flex items-start gap-2 rounded-2xl bg-white/10 p-3">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand-tint" />
                            <p className="text-[12px] leading-5 text-white/80">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-card p-4 shadow-card">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-black text-brand-deep">{active.resultBadge}</span>
                        <MessageSquareText size={17} className="text-brand" />
                      </div>
                      <h3 className="mt-3 text-sm font-black">{active.actionTitle}</h3>
                      <p className="mt-2 text-[12px] leading-5 text-muted">{active.actionBody}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {active.chips.map((chip) => (
                          <span key={chip} className="rounded-full bg-[#F0F2F0] px-2.5 py-1 text-[10px] font-bold text-ink/70">{chip}</span>
                        ))}
                      </div>
                    </div>
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-white/45">
            실제 앱 화면을 재현한 심사용 예시예요. 진짜 결과는 아래 버튼으로 바로 체험할 수 있어요.
          </p>
        </div>
      </section>

      <section id="data" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-black text-brand-tint">데이터가 붙으면 데모가 달라집니다</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              AI 답변을
              <span className="block text-sun">근거 있는 액션 카드</span>
              로 바꾸는 신호들.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">
              심사위원에게 중요한 건 “AI가 말한다”가 아니라 “내가 지금 무엇을 해야 하는지 믿고 누를 수 있다”입니다. 그래서 둥지는 외부 API와 내장 룰북을 카드별 근거로 붙입니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {DATA_SIGNALS.map((signal) => {
              const Icon = signal.icon;
              const activeSignal = selectedSignal.key === signal.key;
              return (
                <button
                  key={signal.key}
                  type="button"
                  onClick={() => setSelectedSignal(signal)}
                  className={cx(
                    "rounded-[1.6rem] border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                    activeSignal ? "border-brand/60 bg-white text-ink shadow-lift" : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  )}
                  aria-pressed={activeSignal}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={cx("inline-grid h-11 w-11 place-items-center rounded-2xl", activeSignal ? "bg-brand-tint text-brand-deep" : "bg-white/10 text-white")}> <Icon size={21} /> </span>
                    <span className={cx("rounded-full px-2 py-1 text-[10px] font-bold", activeSignal ? "bg-brand-tint text-brand-deep" : "bg-white/10 text-white/55")}>{signal.tag}</span>
                  </span>
                  <p className="mt-4 text-sm font-black">{signal.title}</p>
                  <p className={cx("mt-2 break-keep text-xs leading-5", activeSignal ? "text-muted" : "text-white/55")}>{signal.body}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-lift backdrop-blur">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-tint">selected signal</p>
              <h3 className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-black">
                {selectedSignal.title}
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70">{selectedSignal.tag}</span>
              </h3>
              <p className="mt-2 max-w-2xl break-keep text-sm leading-7 text-white/65">{selectedSignal.body}</p>
            </div>
            <div className="grid min-w-[250px] grid-cols-3 gap-2 rounded-3xl bg-[#07150f]/70 p-3">
              {["수집", "검증", "카드화"].map((label, idx) => (
                <div key={label} className="rounded-2xl bg-white/10 p-3 text-center">
                  <p className="text-2xl font-black text-sun">0{idx + 1}</p>
                  <p className="mt-1 text-[11px] font-bold text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
        <div className="rounded-[2.4rem] border border-white/15 bg-white p-5 text-ink shadow-[0_30px_90px_rgba(0,0,0,.35)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black text-brand-deep">심사위원이 기억하는 한 장면</p>
              <h2 className="mt-3 font-display text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
                막막함을 줄이고,
                <span className="block text-brand-deep">행동을 늘립니다.</span>
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                슬라이더를 움직이면 “그냥 챗봇”과 “둥지 액션 카드”의 차이를 시각적으로 설명할 수 있습니다. 이 섹션은 발표 중 제품 철학을 짧게 보여주기 좋습니다.
              </p>
              <label htmlFor="impact-slider" className="mt-6 block text-xs font-black text-muted">
                둥지가 개입한 정도: {slider}%
              </label>
              <input
                id="impact-slider"
                type="range"
                min={25}
                max={85}
                value={slider}
                onChange={(e) => setSlider(Number(e.target.value))}
                className="mt-3 w-full accent-brand"
              />
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-line bg-bg p-3">
              <div className="grid min-h-[360px] gap-3 md:grid-cols-2">
                <div className="rounded-[1.6rem] bg-white p-5 shadow-card">
                  <span className="rounded-full bg-danger-tint px-2.5 py-1 text-[10px] font-black text-danger">Before</span>
                  <h3 className="mt-4 text-xl font-black">사용자는 여전히 검색 중</h3>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                    <li>• 누수가 위험한지 모름</li>
                    <li>• 집주인에게 뭐라고 쓸지 막막함</li>
                    <li>• 계약서 문구의 위험 정도를 판단하기 어려움</li>
                    <li>• 장보기 예산과 보관 순서를 따로 계산해야 함</li>
                  </ul>
                </div>
                <div className="relative overflow-hidden rounded-[1.6rem] bg-[#07150f] p-5 text-white shadow-lift">
                  <div
                    className="absolute inset-y-0 left-0 bg-brand/20"
                    style={{ width: `${slider}%` }}
                    aria-hidden
                  />
                  <div className="relative">
                    <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-black text-brand-deep">After</span>
                    <h3 className="mt-4 text-xl font-black">둥지가 바로 행동으로 정리</h3>
                    <div className="mt-4 space-y-3">
                      {[
                        "위험도·책임 가능성 카드",
                        "증거 기록 체크리스트",
                        "집주인 메시지 원클릭 복사",
                        "시세·제철·사진 API가 붙은 생활 도구",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-2xl bg-white/10 p-3">
                          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-tint" />
                          <p className="text-sm leading-6 text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-8">
        <div className="rounded-[2.2rem] border border-white/15 bg-gradient-to-br from-white via-brand-tint to-sun-tint p-6 text-ink shadow-lift md:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-brand-deep">
                <ClipboardCheck size={15} /> 발표용 추천 멘트
              </p>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-0.03em] md:text-4xl">
                “둥지는 주거 문제를 사진·문장으로 받아, 법/시세/생활 데이터를 붙여 바로 행동 가능한 카드로 바꿉니다.”
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                이 페이지를 첫 화면으로 보여준 뒤, 실제 앱의 수리 진단과 장보기 코치로 넘어가면 설명 없이도 완성도가 전달됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link href="/repair" className="btn-primary min-w-[180px]">수리 진단 체험</Link>
              <Link href="/grocery" className="btn-ghost min-w-[180px] bg-white">장보기 코치 보기</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
