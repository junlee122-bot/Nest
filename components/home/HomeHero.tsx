"use client";

// 홈 히어로 (v4.1) — 왼쪽 정렬 헤드라인 + 형광펜 강조, 둥이는 오른쪽에 삐딱하게.
// 일부러 비대칭으로: 가운데 정렬 헤드라인 + 좌우대칭 구성의 템플릿 느낌을 피한다.
import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Doongi from "../mascot/Doongi";
import NestMark from "../NestMark";
import { fadeUp, stagger } from "@/lib/motion";

export default function HomeHero() {
  return (
    <section className="flow-bg border-b-2 border-line">
      <m.div
        variants={stagger(0.05, 0.09)}
        initial="hidden"
        animate="show"
        className="container-app pb-7 pt-7"
      >
        <m.div variants={fadeUp} className="flex items-center gap-2">
          <NestMark size={24} className="text-brand" />
          <span className="text-base font-extrabold tracking-tight text-ink">
            둥지<span className="ml-1 text-xs font-bold text-muted">Nest</span>
          </span>
        </m.div>

        <div className="mt-5 flex items-end gap-2">
          <m.div variants={fadeUp} className="min-w-0 flex-1 pb-2">
            <p className="text-xs font-extrabold text-brand-deep">자취생 주거생활 도우미</p>
            <h1 className="mt-1.5 text-[27px] font-extrabold leading-[1.25] tracking-tight text-ink">
              오늘 집에
              <br />
              <span className="marker">무슨 일</span> 있어요?
            </h1>
            <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted">
              곰팡이, 누수, 계약서, 공과금까지.
              <br />
              혼자 살아도 든든하게 챙겨드릴게요.
            </p>
          </m.div>

          <m.div variants={fadeUp} className="relative shrink-0">
            <span
              aria-hidden
              className="absolute -left-9 -top-4 -rotate-6 rounded-xl border-2 border-line bg-card px-2.5 py-1 text-[11px] font-extrabold text-ink shadow-card"
            >
              안녕, 나 둥이야!
            </span>
            <Doongi mood="hello" size={128} className="rotate-2" />
          </m.div>
        </div>

        <m.div variants={fadeUp} className="mt-4">
          <Link href="/repair" className="btn-primary w-full">
            집 문제 물어보기 <ArrowRight size={17} />
          </Link>
          <p className="mt-2 text-center text-[11px] text-muted">
            로그인 없이 바로. 사진 한 장이면 더 정확해요.
          </p>
        </m.div>
      </m.div>
    </section>
  );
}
