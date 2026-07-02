"use client";

// 홈 퀵액션 4타일 (v5.1) — 시즌 뱃지 포함
// 뱃지는 hydration 불일치를 피하려고 마운트 후에만 붙인다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { FEATURES, TONE_CLS } from "@/lib/features";
import { seasonHint, type SeasonHint } from "@/lib/season";
import { fadeUp, stagger } from "@/lib/motion";

const QUICK = ["/repair", "/contract", "/rent", "/utility"];

export default function QuickActions() {
  const [hint, setHint] = useState<SeasonHint | null>(null);
  useEffect(() => {
    setHint(seasonHint());
  }, []);

  const items = QUICK.map((href) => FEATURES.find((f) => f.href === href)!);

  return (
    <section className="container-app pt-4">
      <m.div
        variants={stagger(0.12, 0.05)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 gap-2.5"
      >
        {items.map((f) => {
          const Icon = f.icon;
          const badged = hint?.href === f.href;
          return (
            <m.div key={f.href} variants={fadeUp}>
              <Link href={f.href} className="block">
                <div className="card relative flex flex-col items-center gap-1.5 px-1 py-3.5 transition active:scale-95">
                  {badged && (
                    <m.span
                      initial={{ opacity: 0, scale: 0.6, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.5 }}
                      className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold text-white shadow-sm"
                    >
                      {hint!.badge}
                    </m.span>
                  )}
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TONE_CLS[f.tone]}`}
                  >
                    <Icon size={21} strokeWidth={2.3} />
                  </span>
                  <span className="text-[11px] font-bold text-ink">{f.short}</span>
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
          className="mt-2 px-1 text-[11px] leading-relaxed text-muted"
        >
          {hint.detail}
        </m.p>
      )}
    </section>
  );
}
