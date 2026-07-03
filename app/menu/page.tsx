import type { Metadata } from "next";
import Link from "next/link";
import TrustBadges from "@/components/TrustBadges";
import NestGrowth from "@/components/home/NestGrowth";
import RecentProblems from "@/components/RecentProblems";
import FeatureRow from "@/components/FeatureRow";
import { FEATURES } from "@/lib/features";

export const metadata: Metadata = {
  title: "전체 — 둥지 Nest",
};

const GROUPS: { key: string; label: string }[] = [
  { key: "home", label: "우리 집 문제" },
  { key: "money", label: "돈 관리" },
  { key: "start", label: "자취 시작하기" },
];

export default function MenuPage() {
  return (
    <main className="min-h-dvh pb-8">
      <div className="appbar">
        <div className="container-app flex h-[52px] items-center">
          <h1 className="font-sans text-[17px] font-bold text-ink">전체</h1>
        </div>
      </div>

      {/* 내 둥지 */}
      <NestGrowth />

      {/* 전체 기능 */}
      {GROUPS.map((g) => {
        const items = FEATURES.filter((f) => f.group === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="container-app pt-5">
            <h2 className="mb-2 px-1 font-sans text-[15px] font-bold text-ink">{g.label}</h2>
            <div className="card divide-y divide-line overflow-hidden p-0">
              {items.map((f) => (
                <FeatureRow key={f.href} f={f} />
              ))}
            </div>
          </section>
        );
      })}

      {/* 심사용 인터랙티브 쇼케이스 */}
      <section className="container-app pt-5">
        <h2 className="mb-2 px-1 font-sans text-[15px] font-bold text-ink">데모</h2>
        <Link
          href="/showcase"
          className="group flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#07150f] via-brand-deep to-brand px-4 py-3.5 text-white shadow-lift transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99]"
        >
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
              Judge demo
            </span>
            <span className="mt-0.5 block text-[14px] font-bold">
              90초 인터랙티브 쇼케이스
            </span>
            <span className="mt-1 block text-[11px] leading-relaxed text-white/55">
              사진·계약서·장보기가 행동 카드가 되는 과정을 한 화면에서 보여줘요.
            </span>
          </span>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </Link>
      </section>

      {/* 최근 본 문제 */}
      <RecentProblems />

      {/* 이용 안내 — 신뢰·개인정보 (홈에서 이동해온 상세 고지) */}
      <section className="container-app pt-5">
        <h2 className="mb-2 px-1 font-sans text-[15px] font-bold text-ink">이용 안내</h2>
        <div className="card space-y-2.5 p-4 text-[12px] leading-relaxed text-muted">
          <p>
            둥지는 AI 기반 참고용 도우미예요. 책임 판단과 문구는 <b>법적 자문이 아니며</b>, 분쟁
            시 주택임대차분쟁조정위원회 또는 변호사 상담을 권장해요.
          </p>
          <p>
            로그인과 회원가입이 없고 개인정보를 수집하거나 저장하지 않아요. 올린 사진과 내용은 AI
            처리 후 폐기되고, 위치나 연락처는 받지 않아요. 기록·체크 상태는 이 기기(브라우저)에만
            저장돼요.
          </p>
          <p>
            책임 판단은 민법 제623조와 관련 판례를, 공과금은 한국전력공사·도시가스·통계청 등 공개
            자료를 참고해요. 공공데이터 기반 정보(시세·건물 정보 등)는 참고용으로 법적 효력이
            없어요.
          </p>
        </div>
        <TrustBadges className="mt-4" />
        <p className="mt-4 pb-2 text-center text-[11px] text-muted/80">
          © 2026 둥지 Nest · 2026 K-AI 콘텐츠 공모전 출품작
        </p>
      </section>
    </main>
  );
}
