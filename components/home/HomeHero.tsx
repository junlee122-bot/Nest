"use client";

// 홈 상단 (v5 → v14) — 인사 + 둥이 + 소개.
// 핵심 기능 진입은 아래 "핵심 기능" 섹션 카드가 담당한다.
// 상단을 짧게 유지해 '핵심 기능' 제목과 카드가 첫 화면에서 바로 보이게 한다.
import { m } from "framer-motion";
import Doongi from "../mascot/Doongi";
import NestMark from "../NestMark";
import { fadeUp, stagger } from "@/lib/motion";

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
        className="container-app pb-4 pt-4"
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
              size={96}
              className="rotate-2 drop-shadow-[0_8px_12px_rgba(23,28,25,0.14)]"
            />
          </m.div>
        </div>
      </m.div>
    </section>
  );
}
