"use client";

// 홈 상단 (v5 → v12) — 인사 + 둥이 + 메인 CTA + 증상·상황 칩.
// 칩은 사용자 언어(누수·곰팡이·계약서·월세)를 한 번의 탭으로 기능에 연결한다.
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Doongi from "../mascot/Doongi";
import NestMark from "../NestMark";
import { fadeUp, stagger } from "@/lib/motion";
import { HOME_SYMPTOM_CHIPS, type HomeSymptomChip } from "@/lib/features";

// Tailwind JIT — 동적 조합 금지, 정적 매핑만 (칩 전용: 보더 포함)
const CHIP_TONE_CLS: Record<HomeSymptomChip["tone"], string> = {
  brand: "border-brand/10 bg-brand-tint text-brand-deep",
  sky: "border-sky/10 bg-sky-tint text-sky-deep",
  sun: "border-sun/10 bg-sun-tint text-sun-deep",
};

function chipHref(chip: HomeSymptomChip): string {
  if (!chip.prefill) return chip.href;
  return `${chip.href}?q=${encodeURIComponent(chip.prefill)}`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "늦은 밤이에요";
  if (h < 12) return "좋은 아침이에요";
  if (h < 18) return "좋은 오후예요";
  return "편안한 저녁이에요";
}

export default function HomeHero() {
  return (
    <section className="flow-bg">
      <m.div
        variants={stagger(0.04, 0.08)}
        initial="hidden"
        animate="show"
        className="container-app pb-5 pt-4"
      >
        {/* 상단 바 — 로고 */}
        <m.div variants={fadeUp} className="flex h-11 items-center justify-between">
          <span className="flex items-center gap-1.5">
            <NestMark size={22} className="text-brand" />
            <span className="font-display text-[15px] font-bold tracking-tight text-ink">
              둥지
            </span>
          </span>
          <span className="text-[12px] font-medium text-muted">집 문제 생겼을 때 가장 먼저</span>
        </m.div>

        {/* 인사 + 둥이 */}
        <div className="mt-3 flex items-center gap-2">
          <m.div variants={fadeUp} className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-brand-deep">{greeting()}</p>
            <h1 className="mt-1 text-[24px] font-bold leading-[1.3] tracking-tight text-ink">
              오늘 집에
              <br />
              <span className="marker">무슨 일</span> 있어요?
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              사진이나 한 줄 설명만 있어도, 응급처치와 다음 행동을 정리해드려요.
            </p>
          </m.div>
          <m.div variants={fadeUp} className="relative shrink-0 pr-1">
            <span
              aria-hidden
              className="absolute -left-8 -top-2 -rotate-6 rounded-lg border border-line bg-card px-2 py-0.5 text-[10px] font-bold text-ink shadow-card"
            >
              안녕, 나 둥이야!
            </span>
            <Doongi
              mood="hello"
              size={108}
              className="rotate-2 drop-shadow-[0_8px_12px_rgba(23,28,25,0.14)]"
            />
          </m.div>
        </div>

        <m.div variants={fadeUp} className="mt-3">
          <Link href="/repair" className="btn-primary w-full">
            사진으로 수리·하자 진단하기 <ArrowRight size={17} />
          </Link>
          <p className="mt-2 text-center text-[12px] text-muted">
            사진이 없어도 괜찮아요.{" "}
            <Link href="/repair" className="font-semibold text-brand-deep underline underline-offset-2">
              상황만 글로 적어도
            </Link>{" "}
            진단해드려요.
          </p>
        </m.div>

        {/* 증상·상황 칩 — 주 CTA의 넓은 진입 보완 (위계는 CTA 아래) */}
        <m.div variants={fadeUp} className="mt-4" role="group" aria-label="증상과 상황별 빠른 시작">
          <p className="px-1 text-[12px] font-bold text-brand-deep">내 상황으로 바로 시작해요</p>
          {/* pt-1.5: overflow-x-auto가 세로도 클리핑하므로 포커스 링(offset 2px) 여유 확보 */}
          <div className="-mx-5 mt-0.5 flex gap-2 overflow-x-auto scroll-px-5 px-5 pb-1.5 pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {HOME_SYMPTOM_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <Link
                  key={chip.label}
                  href={chipHref(chip)}
                  aria-label={chip.ariaLabel}
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl border px-3.5 py-2.5 text-[13px] font-bold shadow-sm transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${CHIP_TONE_CLS[chip.tone]}`}
                >
                  <Icon size={16} strokeWidth={2.4} aria-hidden />
                  <span>{chip.label}</span>
                </Link>
              );
            })}
          </div>
        </m.div>
      </m.div>
    </section>
  );
}
