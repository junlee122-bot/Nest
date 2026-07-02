"use client";

// 홈 히어로 — "둥이의 현관" (v3 P4)
// 둥이가 맞아주고, 말풍선 질문 + 메인 CTA 하나로 바로 시작.
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Doongi from "../mascot/Doongi";
import NestMark from "../NestMark";
import { fadeUp, stagger } from "@/lib/motion";

export default function HomeHero() {
  return (
    <section className="flow-bg border-b border-line">
      <m.div
        variants={stagger(0.05, 0.09)}
        initial="hidden"
        animate="show"
        className="container-app pb-8 pt-10 text-center"
      >
        <m.div variants={fadeUp} className="inline-flex items-center gap-2">
          <NestMark size={26} className="text-brand" />
          <span className="text-lg font-extrabold tracking-tight text-ink">
            둥지<span className="ml-1 text-sm font-semibold text-muted">Nest</span>
          </span>
        </m.div>

        <m.div variants={fadeUp} className="mt-4 flex justify-center">
          <Doongi mood="hello" size={148} />
        </m.div>

        {/* 말풍선 */}
        <m.div variants={fadeUp} className="relative mx-auto mt-1 w-fit max-w-[19rem]">
          <span
            aria-hidden
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border-l border-t border-line bg-card"
          />
          <div className="rounded-2xl border border-line bg-card px-5 py-3.5 shadow-card">
            <p className="text-balance text-base font-extrabold leading-snug text-ink">
              안녕하세요, 둥이예요!
              <br />
              오늘 집에 무슨 일 있어요?
            </p>
          </div>
        </m.div>

        <m.p variants={fadeUp} className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted">
          곰팡이·누수부터 계약서·공과금까지 — 혼자 살아도, 든든하게.
        </m.p>

        <m.div variants={fadeUp} className="mt-4">
          <Link href="/repair" className="btn-primary w-full">
            집 문제 바로 물어보기 <ArrowRight size={17} />
          </Link>
          <p className="mt-2 text-[11px] text-muted">
            로그인 없이 바로 · 사진 한 장이면 더 정확해요
          </p>
        </m.div>
      </m.div>
    </section>
  );
}
