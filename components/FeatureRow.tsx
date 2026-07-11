// 기능 리스트 행 (v5) — 홈·전체 페이지 공용, 실제 앱의 설정 리스트 감각
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TONE_CLS, type Feature } from "@/lib/features";

function Badge({ badge }: { badge?: "메인" | "베타" }) {
  if (!badge) return null;
  const cls =
    badge === "메인" ? "bg-brand text-white" : "bg-[#EEF0EE] text-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{badge}</span>
  );
}

export default function FeatureRow({ f }: { f: Feature }) {
  const Icon = f.icon;
  return (
    <Link href={f.href} className="block">
      <div className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-bg active:bg-bg">
        {/* 아이콘 컨테이너 규격 통일 (v13): 44px 타일은 rounded-2xl (핵심 기능 카드와 동일 계열) */}
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TONE_CLS[f.tone]}`}
        >
          <Icon size={21} strokeWidth={2.3} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-sans text-[15px] font-bold text-ink">{f.title}</h3>
            <Badge badge={f.badge} />
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{f.desc}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-line group-hover:text-muted" />
      </div>
    </Link>
  );
}
