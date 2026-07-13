"use client";

// 홈 "핵심 기능" (v14 → v15) — 집수리·계약서·시세·전기요금을 하나의 연속된 기능 그룹으로.
// 생활 도구(간결한 리스트)보다 큰 카드·굵은 기능명으로 시각적 위계를 둔다.
import Link from "next/link";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { HOME_CORE_FEATURES, TONE_CLS } from "@/lib/features";
import { fadeUp, stagger } from "@/lib/motion";

export default function CoreFeatures() {
  return (
    <section className="container-app pt-5">
      <h2 className="px-1 font-sans text-[16px] font-bold text-ink">핵심 기능</h2>
      <p className="mt-1 px-1 text-[13px] leading-relaxed text-muted">
        집에서 자주 마주치는 문제를 빠르게 확인해보세요.
      </p>

      <m.div
        variants={stagger(0.1, 0.06)}
        initial="hidden"
        animate="show"
        className="mt-3 space-y-2.5"
      >
        {HOME_CORE_FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <m.div key={f.href} variants={fadeUp}>
              <Link
                href={f.href}
                className="card group flex items-center gap-3.5 p-4 transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TONE_CLS[f.tone]}`}
                >
                  <Icon size={24} strokeWidth={2.2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[16px] font-bold leading-snug text-ink">{f.name}</h3>
                    {f.badge && (
                      <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">{f.desc}</p>
                </div>
                <ChevronRight
                  size={20}
                  className="shrink-0 self-center text-line transition-colors group-hover:text-muted"
                  aria-hidden
                />
              </Link>
            </m.div>
          );
        })}
      </m.div>
    </section>
  );
}
