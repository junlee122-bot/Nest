import Link from "next/link";
import RecentProblems from "@/components/RecentProblems";
import Onboarding from "@/components/Onboarding";
import IntroSplash from "@/components/intro/IntroSplash";
import HomeHero from "@/components/home/HomeHero";
import NestGrowth from "@/components/home/NestGrowth";
import FeatureRow from "@/components/FeatureRow";
import { FEATURES, TONE_CLS } from "@/lib/features";

// 홈 퀵액션 (자주 쓰는 4개)
const QUICK = ["/repair", "/contract", "/rent", "/utility"];

function QuickActions() {
  const items = QUICK.map((href) => FEATURES.find((f) => f.href === href)!);
  return (
    <section className="container-app pt-4">
      <div className="grid grid-cols-4 gap-2.5">
        {items.map((f) => {
          const Icon = f.icon;
          return (
            <Link key={f.href} href={f.href} className="block">
              <div className="card flex flex-col items-center gap-1.5 px-1 py-3.5 transition active:scale-95">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TONE_CLS[f.tone]}`}
                >
                  <Icon size={21} strokeWidth={2.3} />
                </span>
                <span className="text-[11px] font-bold text-ink">{f.short}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  const tools = FEATURES.filter((f) => !QUICK.includes(f.href));
  return (
    <main className="min-h-dvh pb-8">
      {/* 인트로 스플래시 (세션 1회) → 첫 방문 1회 사용법 오버레이 */}
      <IntroSplash />
      <Onboarding />

      {/* 홈 헤더 — 인사 + 둥이 + 메인 CTA */}
      <HomeHero />

      {/* 퀵액션 4종 */}
      <QuickActions />

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
