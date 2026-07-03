"use client";

// 홈 상단 (v5 → v13) — 인사 + 둥이 + 메인 CTA + 수리 증상 빠른 시작 버튼.
// 증상 버튼 4개는 가로 스크롤 없이 2×2 그리드로 전부 보인다 (숨김 없음).
// 계약서·월세 진입은 아래 QuickActions 큰 카드가 담당한다.
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Doongi from "../mascot/Doongi";
import NestMark from "../NestMark";
import { fadeUp, stagger } from "@/lib/motion";
import { HOME_SYMPTOM_CHIPS, type HomeSymptomChip } from "@/lib/features";

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

        {/* 수리 증상 빠른 시작 — 주 CTA의 하위 진입, 4개 전부 노출(스크롤 숨김 없음) */}
        <m.div variants={fadeUp} className="mt-4" role="group" aria-label="수리 증상 빠른 시작">
          <p className="px-1 text-[12px] font-bold text-brand-deep">수리 증상으로 바로 시작해요</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {HOME_SYMPTOM_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <Link
                  key={chip.label}
                  href={chipHref(chip)}
                  aria-label={chip.ariaLabel}
                  className="inline-flex min-h-[48px] items-center justify-start gap-2 rounded-[18px] border border-brand/10 bg-brand-tint/80 px-3.5 py-2.5 text-[13px] font-bold text-brand-deep shadow-[0_8px_20px_rgba(13,160,92,0.08)] transition hover:border-brand/20 hover:bg-white active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/80 text-brand shadow-sm">
                    <Icon size={16} strokeWidth={2.4} aria-hidden />
                  </span>
                  <span className="whitespace-nowrap">{chip.label}</span>
                </Link>
              );
            })}
          </div>
        </m.div>
      </m.div>
    </section>
  );
}
