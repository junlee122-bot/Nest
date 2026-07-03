import Link from "next/link";
import RecentProblems from "@/components/RecentProblems";
import Onboarding from "@/components/Onboarding";
import IntroSplash from "@/components/intro/IntroSplash";
import HomeHero from "@/components/home/HomeHero";
import NestGrowth from "@/components/home/NestGrowth";
import QuickActions from "@/components/home/QuickActions";
import FeatureRow from "@/components/FeatureRow";
import { FEATURES } from "@/lib/features";

// 상단 = 수리(히어로 주 CTA) + 계약·시세(보조 CTA). 나머지는 '생활 도구'로 강등 (v7)
const TOP = ["/repair", "/contract", "/rent"];

export default function Home() {
  const tools = FEATURES.filter((f) => !TOP.includes(f.href));
  return (
    <main className="min-h-dvh pb-8">
      {/* 인트로 스플래시 (세션 1회) → 첫 방문 1회 사용법 오버레이 */}
      <IntroSplash />
      <Onboarding />

      {/* 홈 헤더 — 인사 + 둥이 + 메인 CTA */}
      <HomeHero />

      {/* 보조 CTA 2종 (계약서·시세) */}
      <QuickActions />

      {/* 심사용 인터랙티브 쇼케이스 (주 CTA를 밀지 않게 아래·작게) */}
      <section className="container-app pt-3">
        <Link
          href="/showcase"
          className="group flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#07150f] via-brand-deep to-brand px-4 py-3.5 text-white shadow-lift transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.99]"
        >
          <span>
            <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
              Judge demo
            </span>
            <span className="mt-0.5 block text-[14px] font-bold">
              서비스 흐름 90초로 보기
            </span>
            <span className="mt-0.5 block text-[11px] text-white/55">
              사진·계약서·시세가 행동 카드가 되는 과정
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

      {/* 내 둥지 (둥지 키우기, 잔가지 0이면 숨김) */}
      <NestGrowth />

      {/* 생활 도구 */}
      <section className="container-app pt-5">
        <h2 className="mb-2 px-1 font-sans text-[15px] font-bold text-ink">생활 도구</h2>
        <div className="card divide-y divide-line overflow-hidden p-0">
          {tools.map((f) => (
            <FeatureRow key={f.href} f={f} />
          ))}
        </div>
      </section>

      {/* 최근 본 문제 (이 기기 localStorage 전용) */}
      <RecentProblems />

      {/* 로드맵 + 짧은 안내 (자세한 것은 '전체' 탭) */}
      <section className="container-app pt-5">
        <div className="card p-4">
          <h3 className="font-sans text-sm font-bold text-ink">다음으로 만들고 있는 것들</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            지역별 분리수거 규칙, 동네 인증 수리업체 연결, 분쟁조정 신청 도우미, 실계좌 연동
            주거비 관리까지 준비하고 있어요.
          </p>
        </div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
          둥지의 안내는 참고용이며 법적 자문이 아니에요. 자세한 이용 안내는{" "}
          <Link href="/menu" className="font-semibold text-brand-deep underline underline-offset-2">
            전체 탭
          </Link>
          에서 볼 수 있어요.
        </p>
      </section>
    </main>
  );
}
