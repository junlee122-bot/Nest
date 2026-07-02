"use client";

// 내 둥지 (v3 P7) — 홈에서 보이는 둥지 키우기 현황 카드
// 포인트가 0이면 조용히 숨겨 첫 화면을 어지럽히지 않는다.
import { useEffect, useState } from "react";
import { m } from "framer-motion";
import Doongi, { DoongiMood } from "../mascot/Doongi";
import { getGrowth, type GrowthView } from "@/lib/growth";
import { fadeUp } from "@/lib/motion";

function moodFor(g: GrowthView): DoongiMood {
  if (g.points <= 0) return "sleepy";
  if (g.level >= 4) return "cheer";
  if (g.level >= 2) return "found";
  return "hello";
}

export default function NestGrowth() {
  const [g, setG] = useState<GrowthView | null>(null);

  useEffect(() => {
    const refresh = () => setG(getGrowth());
    refresh();
    window.addEventListener("nest:growth", refresh);
    return () => window.removeEventListener("nest:growth", refresh);
  }, []);

  if (!g || g.points <= 0) return null;

  return (
    <section className="container-app pt-5">
      <m.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="card flex items-center gap-4 p-4"
      >
        <Doongi mood={moodFor(g)} size={72} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-bold text-ink">
              내 둥지 · {g.name}
            </p>
            <p className="shrink-0 text-xs font-semibold text-straw-deep">
              잔가지 {g.points}개
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted">{g.desc}</p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-straw-tint">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sun via-[#9CCD5F] to-brand transition-all"
              style={{ width: `${Math.round(g.progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {g.nextAt
              ? `잔가지 ${g.nextAt}개가 되면 둥지가 자라요 · 이 기기에만 저장돼요`
              : "둥지가 완성됐어요! · 이 기기에만 저장돼요"}
          </p>
        </div>
      </m.div>
    </section>
  );
}
