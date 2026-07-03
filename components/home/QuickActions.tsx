"use client";

// 홈 보조 CTA (v7 리뷰 반영) — 주 CTA는 히어로의 '사진으로 진단' 1개,
// 여기는 보조 2개(계약서·시세)만 큼직하게. 나머지는 '생활 도구'로 강등.
// 시즌 뱃지는 hydration 불일치를 피하려고 마운트 후에만 표시.
import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { FEATURES, TONE_CLS } from "@/lib/features";
import { seasonHint, type SeasonHint } from "@/lib/season";
import { fadeUp, stagger } from "@/lib/motion";

const SECONDARY = ["/contract", "/rent"];

export default function QuickActions() {
  const [hint, setHint] = useState<SeasonHint | null>(null);
  useEffect(() => {
    setHint(seasonHint());
  }, []);

  const items = SECONDARY.map((href) => FEATURES.find((f) => f.href === href)!);

  return (
    <section className="container-app pt-4">
      <m.div
        variants={stagger(0.12, 0.06)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2.5"
      >
        {items.map((f) => {
          const Icon = f.icon;
          const badged = hint?.href === f.href;
          return (
            <m.div key={f.href} variants={fadeUp}>
              <Link href={f.href} className="block">
                <div className="card relative flex h-full flex-col gap-2.5 p-4 transition active:scale-[0.98]">
                  {badged && (
                    <m.span
                      initial={{ opacity: 0, scale: 0.6, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.5 }}
                      className="absolute -top-2 right-3 whitespace-nowrap rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                    >
                      {hint!.badge}
                    </m.span>
                  )}
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TONE_CLS[f.tone]}`}
                  >
                    <Icon size={21} strokeWidth={2.3} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold leading-snug text-ink">
                      {f.href === "/contract" ? "계약서 위험 조항 보기" : "월세·시세 확인하기"}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted">
                      {f.href === "/contract"
                        ? "계약 전 독소조항 무료 점검"
                        : "우리 동네 실거래가 기준"}
                    </p>
                  </div>
                </div>
              </Link>
            </m.div>
          );
        })}
      </m.div>
      {hint && (
        <m.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-2 px-1 text-[12px] leading-relaxed text-muted"
        >
          {hint.detail}
        </m.p>
      )}
    </section>
  );
}
