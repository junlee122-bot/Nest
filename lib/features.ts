// 기능 목록 단일 소스 (v5) — 홈·전체(더보기)·탭바가 공유
import {
  Wrench,
  ScrollText,
  Zap,
  ShoppingBasket,
  PiggyBank,
  ClipboardList,
  BarChart3,
  Droplets,
  Wind,
  Flame,
  Hammer,
  type LucideIcon,
} from "lucide-react";

export type Tone = "brand" | "sun" | "coral" | "sky" | "straw";

// Tailwind JIT를 위한 정적 클래스 (동적 조합 금지)
export const TONE_CLS: Record<Tone, string> = {
  brand: "bg-brand-tint text-brand-deep",
  sun: "bg-sun-tint text-sun-deep",
  coral: "bg-coral-tint text-coral-deep",
  sky: "bg-sky-tint text-sky-deep",
  straw: "bg-straw-tint text-straw-deep",
};

export interface Feature {
  href: string;
  icon: LucideIcon;
  title: string;
  /** 짧은 이름 (퀵액션 타일·탭용) */
  short: string;
  desc: string;
  tone: Tone;
  badge?: "메인" | "베타";
  group: "home" | "money" | "start";
}

export const FEATURES: Feature[] = [
  {
    href: "/repair",
    icon: Wrench,
    title: "집 수리 응급실",
    short: "집수리",
    desc: "곰팡이·누수·보일러? 응급처치부터 집주인 문구까지",
    tone: "brand",
    badge: "메인",
    group: "home",
  },
  {
    href: "/contract",
    icon: ScrollText,
    title: "계약서 독소조항 체커",
    short: "계약서",
    desc: "계약서 붙여넣으면 불리한 조항을 찾아드려요",
    tone: "sky",
    group: "home",
  },
  {
    href: "/rent",
    icon: BarChart3,
    title: "전월세 시세 참고",
    short: "시세",
    desc: "계약 전에 우리 동네 실거래가부터 확인해요",
    tone: "sun",
    badge: "베타",
    group: "money",
  },
  {
    href: "/utility",
    icon: Zap,
    title: "공과금 점검",
    short: "공과금",
    desc: "이번 달 요금, 평균보다 많이 나왔나? 절약 팁까지",
    tone: "coral",
    group: "money",
  },
  {
    href: "/grocery",
    icon: ShoppingBasket,
    title: "혼밥 장보기 코치",
    short: "장보기",
    desc: "제철·오늘 시세 반영 식단부터 남은 재료 요리까지",
    tone: "brand",
    group: "money",
  },
  {
    href: "/money",
    icon: PiggyBank,
    title: "주거비 자동분석",
    short: "주거비",
    desc: "오픈뱅킹 테스트베드(모의계좌)로 월세·공과금 자동 집계",
    tone: "straw",
    badge: "베타",
    group: "money",
  },
  {
    href: "/admin",
    icon: ClipboardList,
    title: "이사·행정 길잡이",
    short: "이사행정",
    desc: "전입신고, 확정일자, 보증보험. 뭐부터 할지 순서대로",
    tone: "sun",
    group: "start",
  },
];

export function featureByHref(href: string): Feature | undefined {
  return FEATURES.find((f) => f.href === href);
}

// ── 홈 히어로 수리 증상 빠른 시작 버튼 (v12 → v13) ──────────────
// 수리 증상 4개만 담는다 — 계약서·월세는 QuickActions 큰 카드가 담당(중복 제거).
// 4개라 가로 스크롤 없이 2×2 그리드로 전부 보인다 (발견성 확보).
// 버튼은 /repair?q=<prefill> 로 이동해 입력창에 미리 채워진다 (자동 제출 없음).
// FEATURES와 별개 — 기존 FeatureRow·QuickActions·AppTabBar에 영향 없음.

export interface HomeSymptomChip {
  label: string;
  href: string;
  /** 있으면 ?q= 로 입력창에 미리 채울 문장 (80자 이하 유지) */
  prefill?: string;
  icon: LucideIcon;
  ariaLabel: string;
}

export const HOME_SYMPTOM_CHIPS: HomeSymptomChip[] = [
  {
    label: "누수·물샘",
    href: "/repair",
    prefill: "천장이나 벽에서 물이 새요.",
    icon: Droplets,
    ariaLabel: "누수·물샘 상황으로 집수리 진단 시작하기",
  },
  {
    label: "곰팡이·결로",
    href: "/repair",
    prefill: "벽지에 곰팡이나 결로가 생겼어요.",
    icon: Wind,
    ariaLabel: "곰팡이·결로 상황으로 집수리 진단 시작하기",
  },
  {
    label: "보일러·난방",
    href: "/repair",
    prefill: "보일러나 난방이 잘 안 돼요.",
    icon: Flame,
    ariaLabel: "보일러·난방 문제로 집수리 진단 시작하기",
  },
  {
    label: "벽 균열·하자",
    href: "/repair",
    prefill: "벽에 균열이나 하자가 보여요.",
    icon: Hammer,
    ariaLabel: "벽 균열·하자 상황으로 집수리 진단 시작하기",
  },
];
