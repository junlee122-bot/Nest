import Link from "next/link";
import RecentProblems from "@/components/RecentProblems";
import Onboarding from "@/components/Onboarding";
import IntroSplash from "@/components/intro/IntroSplash";
import HomeHero from "@/components/home/HomeHero";
import CoreFeatures from "@/components/home/CoreFeatures";
import NestGrowth from "@/components/home/NestGrowth";
import FeatureRow from "@/components/FeatureRow";
import { FEATURES } from "@/lib/features";

// 핵심 기능(집수리·계약서·시세·전기요금)은 CoreFeatures가 담당. 나머지는 '생활 도구' (v15)
const CORE = ["/repair", "/contract", "/rent", "/utility"];

export default function Home() {
  const tools = FEATURES.filter((f) => !CORE.includes(f.href));
  return (
    <main className="min-h-dvh pb-8">
      {/* 인트로 스플래시 (세션 1회) → 첫 방문 1회 사용법 오버레이 */}
      <IntroSplash />
      <Onboarding />

      {/* 홈 헤더 — 인사 + 둥이 (짧게) */}
      <HomeHero />

      {/* 핵심 기능 — 집수리·계약서·시세 3종 연속 그룹 */}
      <CoreFeatures />

      {/* 구분선 후 생활 도구 — 핵심 기능과 위계 구분 */}
      <section className="container-app pt-6">
        <div className="mb-3 border-t border-line" aria-hidden />
        <h2 className="mb-1 px-1 font-sans text-[16px] font-bold text-ink">생활 도구</h2>
        <p className="mb-2.5 px-1 text-[13px] leading-relaxed text-muted">
          주거 문제를 해결한 뒤, 생활비와 살림도 챙겨보세요.
        </p>
        <div className="card divide-y divide-line overflow-hidden p-0">
          {tools.map((f) => (
            <FeatureRow key={f.href} f={f} />
          ))}
        </div>
      </section>

      {/* 내 둥지 (둥지 키우기, 잔가지 0이면 숨김) */}
      <NestGrowth />

      {/* 최근 본 문제 (이 기기 localStorage 전용) */}
      <RecentProblems />

      {/* 서비스 흐름 쇼케이스 — 첫 흐름을 방해하지 않게 하단·차분한 카드 (v12) */}
      <section className="container-app pt-5">
        <Link
          href="/showcase"
          className="card group flex items-center justify-between gap-3 p-4 transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-bold text-brand-deep">
                서비스 흐름
              </span>
              <span className="rounded-full bg-[#F0F2F0] px-2 py-0.5 text-[10px] font-bold text-ink/70">
                발표용 데모
              </span>
            </span>
            <span className="mt-1.5 block text-[14px] font-bold text-ink">
              둥지가 어떻게 도와주는지 90초로 보기
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">
              수리·계약서·월세·장보기 흐름을 한 번에 볼 수 있어요.
            </span>
          </span>
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-tint text-brand-deep transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </Link>
      </section>

      {/* 짧은 안내 — 로드맵 카드는 홈에서 제거, 전체 탭 링크로 축소 (v12) */}
      <section className="container-app pt-5">
        <p className="text-center text-[11px] leading-relaxed text-muted">
          둥지의 안내는 참고용이며 법적 자문이 아니에요. 자세한 이용 안내와 준비중인 기능은{" "}
          <Link href="/menu" className="font-semibold text-brand-deep underline underline-offset-2">
            전체 탭
          </Link>
          에서 볼 수 있어요.
        </p>
      </section>
    </main>
  );
}
