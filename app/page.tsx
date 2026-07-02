import Link from "next/link";
import {
  ChevronRight,
  Wrench,
  ScrollText,
  Zap,
  ShoppingBasket,
  PiggyBank,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import NestArc from "@/components/NestArc";
import RecentProblems from "@/components/RecentProblems";
import Onboarding from "@/components/Onboarding";
import IntroSplash from "@/components/intro/IntroSplash";
import HomeHero from "@/components/home/HomeHero";
import NestGrowth from "@/components/home/NestGrowth";
import Doongi from "@/components/mascot/Doongi";

type Badge = "메인" | "베타" | null;
type Tone = "brand" | "sun" | "coral" | "sky" | "straw";

// Tailwind JIT를 위해 정적 클래스 문자열로 (동적 조합 금지)
const TONE_CLS: Record<Tone, string> = {
  brand: "bg-brand-tint text-brand-deep",
  sun: "bg-sun-tint text-sun-deep",
  coral: "bg-coral-tint text-coral-deep",
  sky: "bg-sky-tint text-sky-deep",
  straw: "bg-straw-tint text-straw-deep",
};

interface CardItem {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  badge: Badge;
  tone: Tone;
  accent?: boolean;
}

const groups: { label: string; items: CardItem[] }[] = [
  {
    label: "우리 집 문제",
    items: [
      {
        href: "/repair",
        icon: Wrench,
        title: "집 수리 — 살림 응급실",
        desc: "곰팡이·누수·보일러? 응급처치부터 집주인 문구까지",
        badge: "메인",
        tone: "brand",
        accent: true,
      },
      {
        href: "/contract",
        icon: ScrollText,
        title: "계약서 독소조항 체커",
        desc: "계약서 붙여넣으면 불리한 조항을 찾아드려요",
        badge: null,
        tone: "sky",
      },
    ],
  },
  {
    label: "돈 관리",
    items: [
      {
        href: "/rent",
        icon: BarChart3,
        title: "전월세 시세 참고",
        desc: "계약 전에 우리 동네 실거래가부터 확인해요",
        badge: "베타",
        tone: "sun",
      },
      {
        href: "/utility",
        icon: Zap,
        title: "공과금 점검",
        desc: "이번 달 요금, 평균보다 많이 나왔나? 절약 팁까지",
        badge: null,
        tone: "coral",
      },
      {
        href: "/grocery",
        icon: ShoppingBasket,
        title: "혼밥 장보기 코치",
        desc: "예산 맞춤 식단부터 남은 재료 요리까지",
        badge: null,
        tone: "brand",
      },
      {
        href: "/money",
        icon: PiggyBank,
        title: "주거비 자동분석",
        desc: "오픈뱅킹 테스트베드(모의계좌)로 월세·공과금 자동 집계",
        badge: "베타",
        tone: "straw",
      },
    ],
  },
  {
    label: "시작하기",
    items: [
      {
        href: "/admin",
        icon: ClipboardList,
        title: "이사·행정 길잡이",
        desc: "전입신고, 확정일자, 보증보험. 뭐부터 할지 순서대로",
        badge: null,
        tone: "sun",
      },
    ],
  },
];

function BadgeTag({ badge }: { badge: Badge }) {
  if (!badge) return null;
  const cls = badge === "메인" ? "bg-brand text-white" : "bg-ink text-white";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{badge}</span>
  );
}

function CardLink({ c }: { c: CardItem }) {
  const Icon = c.icon;
  // 메인 카드만 둥이가 앉아 있는 큰 블록 — 모든 카드가 똑같이 생기지 않게
  if (c.accent) {
    return (
      <Link href={c.href} className="block">
        <div className="card group flex items-center gap-3 border-brand/40 bg-brand-tint/50 p-4 pr-3 transition hover:-translate-y-0.5 hover:-rotate-[0.4deg] hover:shadow-lift">
          <div className="min-w-0 flex-1 pl-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-extrabold text-ink">{c.title}</h3>
              <BadgeTag badge={c.badge} />
            </div>
            <p className="mt-1.5 text-sm leading-snug text-muted">{c.desc}</p>
            <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-extrabold text-brand-deep">
              바로 물어보기 <ChevronRight size={15} />
            </span>
          </div>
          <Doongi mood="found" size={84} className="shrink-0 -rotate-2" />
        </div>
      </Link>
    );
  }
  return (
    <Link href={c.href} className="block">
      <div className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:-rotate-[0.4deg] hover:shadow-lift">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition group-hover:scale-105 ${TONE_CLS[c.tone]}`}
        >
          <Icon size={22} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-ink">{c.title}</h3>
            <BadgeTag badge={c.badge} />
          </div>
          <p className="mt-1 text-sm leading-snug text-muted">{c.desc}</p>
        </div>
        <ChevronRight size={20} className="shrink-0 text-line transition group-hover:text-brand" />
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="min-h-dvh pb-16">
      {/* 인트로 스플래시 (세션 1회) → 첫 방문 1회 사용법 오버레이 */}
      <IntroSplash />
      <Onboarding />

      {/* 히어로 — 둥이의 현관 */}
      <HomeHero />

      {/* 내 둥지 (둥지 키우기, 잔가지 0이면 숨김) */}
      <NestGrowth />

      {/* 주제별 그룹 카드 — 둥지의 '방'들 */}
      {groups.map((g) => (
        <section key={g.label} className="container-app pt-6">
          <div className="mb-2.5 flex items-center gap-2 px-1">
            <h2 className="text-[15px] font-extrabold text-ink">{g.label}</h2>
            <NestArc width={26} className="mt-1.5 text-straw/70" />
          </div>
          <div className="space-y-3">
            {g.items.map((c) => (
              <CardLink key={c.href} c={c} />
            ))}
          </div>
        </section>
      ))}

      {/* 발전 로드맵 (유용성·발전가능성 노출 — 심사 30점) */}
      <section className="container-app pt-8">
        <div className="card p-5">
          <h3 className="text-[15px] font-extrabold text-ink">다음으로 만들고 있는 것들</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            지역별 분리수거 규칙, 동네 인증 수리업체 연결, 주택임대차분쟁조정 신청 도우미, 실계좌
            연동 주거비 관리까지. 정보가 부족한 청년 세입자가 자기 권리를 알고 행동하게 돕는 게
            둥지의 목표예요.
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
          <p className="pt-1 text-muted/70">© 2026 둥지 Nest · 2026 K-AI 콘텐츠 공모전 출품작</p>
        </div>
      </footer>
    </main>
  );
}
