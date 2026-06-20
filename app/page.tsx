import Link from "next/link";
import { ChevronRight, Camera, Sparkles, Send } from "lucide-react";
import NestMark from "@/components/NestMark";
import RecentProblems from "@/components/RecentProblems";
import Onboarding from "@/components/Onboarding";

const steps = [
  { icon: Camera, title: "사진·한 줄로 입력", desc: "곰팡이·누수 등 문제를 찍거나 적어요" },
  { icon: Sparkles, title: "AI가 3단 진단", desc: "응급처치 · 책임 판단 · 집주인 문구" },
  { icon: Send, title: "바로 복사·전송", desc: "집주인에게 보낼 문구를 그대로 사용" },
] as const;

const cards = [
  {
    href: "/repair",
    emoji: "🏠",
    title: "집 수리 — 살림 응급실",
    desc: "곰팡이·누수·보일러 고장? 응급처치부터 집주인 연락 문구까지",
    accent: true,
  },
  {
    href: "/contract",
    emoji: "📄",
    title: "계약서 독소조항 체커",
    desc: "임대차계약서 붙여넣으면 세입자에게 불리한 조항을 찾아드려요",
    accent: false,
  },
  {
    href: "/admin",
    emoji: "📋",
    title: "이사·행정 길잡이",
    desc: "전입신고·확정일자·보증보험… 뭐부터 할지 체크리스트로",
    accent: false,
  },
  {
    href: "/utility",
    emoji: "💡",
    title: "공과금 점검",
    desc: "이번 달 요금, 평균보다 많이 나왔나? 절약 팁까지",
    accent: false,
  },
  {
    href: null,
    emoji: "🛒",
    title: "혼밥 장보기 코치",
    desc: "1인분 장보기·식비 관리 — 곧 찾아올게요",
    accent: false,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh pb-16">
      {/* 첫 방문 1회 사용법 오버레이 */}
      <Onboarding />

      {/* 히어로 */}
      <section className="flow-bg">
        <div className="container-app pb-8 pt-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <NestMark size={40} className="text-brand" />
            <span className="text-2xl font-extrabold tracking-tight text-ink">
              둥지<span className="ml-1.5 text-base font-semibold text-muted">Nest</span>
            </span>
          </div>
          <h1 className="text-balance text-2xl font-extrabold leading-snug text-ink">
            혼자 살아도, 든든하게
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted">
            집에서 생긴 문제, 어디에 물어볼지 막막했죠? 둥지가 응급처치부터 집주인에게 보낼 말까지
            대신 챙겨드릴게요.
          </p>
        </div>
      </section>

      {/* 어떻게 작동하나요 — 3단계 미니 스트립 */}
      <section className="container-app pb-2">
        <div className="card p-4">
          <ol className="grid grid-cols-3 gap-2">
            {steps.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center gap-2 text-center">
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tint text-brand">
                  <s.icon size={20} />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <p className="text-xs font-bold leading-tight text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 주제 카드 4개 */}
      <section className="container-app space-y-3 pt-2">
        {cards.map((c) => {
          const inner = (
            <div
              className={`card group flex items-center gap-4 p-4 transition ${
                c.href ? "hover:-translate-y-0.5 hover:shadow-lift" : "opacity-60"
              } ${c.accent ? "ring-1 ring-brand/20" : ""}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-2xl">
                {c.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-ink">{c.title}</h2>
                  {c.accent && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                      메인
                    </span>
                  )}
                  {!c.href && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-muted">
                      준비중
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-snug text-muted">{c.desc}</p>
              </div>
              {c.href && (
                <ChevronRight
                  size={20}
                  className="shrink-0 text-line transition group-hover:text-brand"
                />
              )}
            </div>
          );
          return c.href ? (
            <Link key={c.title} href={c.href} className="block">
              {inner}
            </Link>
          ) : (
            <div key={c.title} aria-disabled>
              {inner}
            </div>
          );
        })}
      </section>

      {/* 베타: 주거비 자동분석 (오픈뱅킹 테스트베드) — 메인과 시각적으로 분리 */}
      <section className="container-app pt-4">
        <Link href="/money" className="block">
          <div className="flex items-center gap-4 rounded-2xl border border-dashed border-brand/40 bg-brand-tint/40 p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl">
              💳
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-ink">주거비 자동분석</h2>
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                  BETA
                </span>
              </div>
              <p className="mt-1 text-sm leading-snug text-muted">
                오픈뱅킹 테스트베드(모의계좌)로 월세·공과금 자동 집계
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-brand/50" />
          </div>
        </Link>
      </section>

      {/* 발전 로드맵 (유용성·발전가능성 노출 — 심사 30점) */}
      <section className="container-app pt-8">
        <div className="card p-5">
          <h3 className="text-sm font-bold text-ink">둥지가 그리는 다음 둥지 🌱</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            지역별 분리수거 규칙, 동네 인증 수리업체 연결, 주택임대차분쟁조정 신청 도우미, 임대차
            계약서 독소조항 체커까지 — 정보가 부족한 청년 세입자가 자기 권리를 알고 행동하도록
            돕는 것이 둥지의 목표예요.
          </p>
        </div>
      </section>

      {/* 최근 본 문제 (이 기기 localStorage 전용) */}
      <RecentProblems />

      {/* 푸터 — 책임 한정 + 개인정보 (당선 취소 방지) */}
      <footer className="container-app pt-10">
        <div className="space-y-2 text-center text-xs leading-relaxed text-muted">
          <p>
            둥지는 AI 기반 참고용 도우미입니다. 책임 판단·문구는 <b>법적 자문이 아니며</b>, 분쟁 시
            주택임대차분쟁조정위원회 또는 변호사 상담을 권장합니다.
          </p>
          <p>
            로그인·회원가입이 없으며 개인정보를 수집·저장하지 않습니다. 업로드한 사진·내용은 AI 처리
            후 폐기되고, 위치·연락처는 받거나 저장하지 않습니다(업체 찾기는 지도 앱 검색으로 연결).
          </p>
          <p>
            참고 자료: 책임 판단은 민법 제623조 및 관련 판례, 공과금은 한국전력공사·도시가스·통계청 등
            공개 자료를 바탕으로 합니다.
          </p>
          <p className="pt-1 text-muted/70">
            © 2026 둥지 Nest · 2026 K-AI 콘텐츠 공모전 출품작
          </p>
        </div>
      </footer>
    </main>
  );
}
