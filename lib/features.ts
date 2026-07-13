// 기능 목록 단일 소스 (v5) — 홈·전체(더보기)·탭바가 공유
import {
  Wrench,
  ScrollText,
  Zap,
  ShoppingBasket,
  PiggyBank,
  ClipboardList,
  BarChart3,
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
    title: "에어컨 전기요금 계산",
    short: "전기요금",
    desc: "에어컨 종류·냉방 평수·사용시간으로 이번 달 추가 전기요금을 미리 계산해요.",
    tone: "coral",
    group: "money",
  },
  {
    href: "/grocery",
    icon: ShoppingBasket,
    title: "혼밥 장보기 코치",
    short: "장보기",
    desc: "예산과 남은 재료를 기준으로 식단과 장보기 목록을 추천받아요.",
    tone: "brand",
    group: "money",
  },
  {
    href: "/money",
    icon: PiggyBank,
    title: "주거비 자동 분석",
    short: "주거비",
    desc: "월세와 공과금 등 매달 나가는 주거비를 한눈에 확인해요.",
    tone: "straw",
    badge: "베타",
    group: "money",
  },
  {
    href: "/admin",
    icon: ClipboardList,
    title: "이사·행정 길잡이",
    short: "이사행정",
    desc: "전입신고, 확정일자, 보증보험 등 필요한 절차를 순서대로 확인해요.",
    tone: "sun",
    group: "start",
  },
];

export function featureByHref(href: string): Feature | undefined {
  return FEATURES.find((f) => f.href === href);
}

// ── 홈 "핵심 기능" (v14 → v15) ────────────────────────────────
// 집수리·계약서·시세·전기요금 계산을 하나의 연속된 기능 그룹으로 보여준다.
// 화면 표기용 이름·설명은 FEATURES와 별개로 둔다(홈에서 더 또렷한 카피 사용).
// href·아이콘은 기존 라우트와 동일 — 링크/동작 변경 없음.

export interface HomeCoreFeature {
  href: string;
  icon: LucideIcon;
  name: string;
  desc: string;
  tone: Extract<Tone, "brand" | "sky" | "sun" | "coral">;
  badge?: "메인";
}

export const HOME_CORE_FEATURES: HomeCoreFeature[] = [
  {
    href: "/repair",
    icon: Wrench,
    name: "집수리·하자 진단",
    desc: "사진이나 상황 설명으로 응급처치와 다음 행동을 확인해요.",
    tone: "brand",
    badge: "메인",
  },
  {
    href: "/contract",
    icon: ScrollText,
    name: "계약서 위험 조항 점검",
    desc: "계약서 내용을 붙여넣으면 불리하거나 주의할 조항을 찾아드려요.",
    tone: "sky",
  },
  {
    href: "/rent",
    icon: BarChart3,
    name: "전월세 시세 확인",
    desc: "우리 동네 실거래가를 기준으로 현재 전월세 가격을 비교해요.",
    tone: "sun",
  },
  {
    href: "/utility",
    icon: Zap,
    name: "에어컨 전기요금 계산",
    desc: "종류·냉방 평수·사용시간으로 한 달 추가요금을 미리 봐요.",
    tone: "coral",
  },
];
