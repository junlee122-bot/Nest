"use client";

// 심사용 인터랙티브 쇼케이스 v2
// - 시나리오 5종(수리·계약서·에어컨 요금·장보기·시세) × 4단계(입력→판단→데이터 보강→바로 행동)
//   에어컨 요금은 AI가 아니라 결정론 엔진이라 2단계 라벨을 "엔진 계산"으로 바꿔 표기(steps/judgeLabel)
// - 클릭 가능한 스테퍼 + 단계별로 목업 카드가 스켈레톤→결과로 쌓이는 진행형 데모
// - 발표자 모드(?present=1 또는 버튼): 발표 멘트·진행바·방향키 이동·Esc 종료
// - 모든 데모 내용은 '데모 재현' 배지와 고지로 실제 결과가 아님을 표기한다.
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Banknote,
  BarChart3,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CloudSun,
  DatabaseZap,
  FileText,
  Home,
  Image as ImageIcon,
  Landmark,
  MapPin,
  MessageSquareText,
  Pause,
  Play,
  Presentation,
  ReceiptText,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Search,
  Utensils,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import NestMark from "@/components/NestMark";
import TrustBadges from "@/components/TrustBadges";

type ScenarioId = "repair" | "contract" | "aircon" | "grocery" | "rent";

type Scenario = {
  id: ScenarioId;
  label: string;
  icon: typeof Wrench;
  eyebrow: string;
  inputTitle: string;
  userLine: string;
  aiHeadline: string;
  aiSignals: [string, string];
  dataChips: string[];
  dataNote: string;
  actionBadge: string;
  actionTitle: string;
  actionBody: string;
  actionChips: string[];
  accent: string;
  appHref: string;
  appLabel: string;
  presenterLine: string;
  /** 2단계 카드 배지 — 기본 "AI 판단". 에어컨 요금은 AI 미사용이라 "엔진 계산"으로 표기 */
  judgeLabel?: string;
  /** 스테퍼 라벨 오버라이드 (길이 4 고정) */
  steps?: readonly [string, string, string, string];
};

const SCENARIOS: Scenario[] = [
  {
    id: "repair",
    label: "집수리 사진 진단",
    icon: Wrench,
    eyebrow: "집수리 AI",
    inputTitle: "천장 얼룩 사진 1장 + 한 줄 설명",
    userLine: "천장에서 물이 떨어지고 벽지가 젖었어요. 지금 뭘 해야 하나요?",
    aiHeadline: "지금은 기록을 남기고 집주인에게 알릴 단계로 보여요.",
    aiSignals: ["긴급도: 오늘 기록·연락 필요", "책임 가능성: 임대인 수선의무 우선 검토"],
    dataChips: ["민법 제623조 룰북", "장마철·날씨 맥락", "누전 안전 수칙", "주변 설비 업체"],
    dataNote: "AI 판단에 법령 룰북과 계절·안전 맥락을 근거로 붙여요.",
    actionBadge: "오늘 할 일 3개",
    actionTitle: "집주인에게 보낼 문장 자동 작성",
    actionBody:
      "안녕하세요. 오늘 21시경 거실 천장 누수와 벽지 젖음이 확인되어 사진과 영상을 남겼습니다. 추가 피해 방지를 위해 수리 확인 부탁드립니다.",
    actionChips: ["증거 촬영 체크리스트", "문자 복사", "누전 시 차단기 확인"],
    accent: "from-brand/25 via-sky/20 to-sun/25",
    appHref: "/repair",
    appLabel: "수리 진단 열기",
    presenterLine:
      "먼저, 가장 흔한 집 문제인 누수입니다. 사진과 한 줄 설명만 넣으면 둥지가 긴급도와 오늘 할 일, 바로 보낼 집주인 메시지까지 정리합니다.",
  },
  {
    id: "contract",
    label: "계약서 위험 조항",
    icon: FileText,
    eyebrow: "계약서 체크",
    inputTitle: "특약 문장을 붙여넣기만 하면 돼요",
    userLine: "임차인은 모든 수선비를 부담하며, 보증금 반환은 신규 임차인 입주 후로 한다.",
    aiHeadline: "임차인에게 과도하게 불리할 수 있는 특약이에요.",
    aiSignals: ["위험도: 높음 · 일방 부담 조항", "근거: 수선의무·보증금 반환 리스크"],
    dataChips: ["내장 독소조항 룰북", "주임법 제10조", "법제처 원문(연동 시)"],
    dataNote: "위험 판단마다 근거 조문을 함께 보여줘요. 단정 대신 '~일 수 있어요' 톤을 지켜요.",
    actionBadge: "수정 후보 2개",
    actionTitle: "수정 요청 문구 제안",
    actionBody:
      "모든 수선비를 임차인이 부담한다는 표현은 과도할 수 있어, 고의·과실 또는 소모품에 한정하는 문구로 조정 요청하는 것을 권장합니다.",
    actionChips: ["수정 요청 문구", "중개사 확인 질문", "계약 전 체크리스트"],
    accent: "from-danger/20 via-coral/20 to-sun/25",
    appHref: "/contract",
    appLabel: "계약서 체커 열기",
    presenterLine:
      "계약서에서는 위험한 특약을 카드로 분리하고, 왜 위험할 수 있는지 근거와 함께 수정 요청 문구를 만들어줍니다.",
  },
  {
    id: "aircon",
    label: "에어컨 요금 계산",
    icon: Zap,
    eyebrow: "여름 필수 · AI 미사용",
    inputTitle: "종류·냉방 평수·사용시간, 세 번만 고르면 돼요",
    userLine: "원룸 벽걸이 6평, 하루 6시간 틀면 이번 달 얼마나 더 나와요?",
    aiHeadline: "7월 기준 한 달 약 12,000원이 더 나올 것으로 보여요. (범위 7,000~32,000원)",
    aiSignals: ["하루 6시간 × 30일 = 약 81kWh 추가", "하루 2시간 줄이면 한 달 약 4,000원 절약"],
    dataChips: ["한전 누진제(하계 300/450kWh)", "요금표 확인일 표기", "라벨 사진 판독", "네이버 제품 검색"],
    dataNote:
      "요금 계산은 AI가 아니라 한전 요금표 기반 순수 계산 엔진이 해요. 같은 입력엔 언제나 같은 답, 계산 중 네트워크 0회예요.",
    actionBadge: "즉시 재계산",
    actionTitle: "사용시간별 비교 + 내 에어컨 찾기",
    actionBody:
      "2·4·6·8시간 비교로 몇 시간을 줄이면 얼마가 절약되는지 보여주고, 제품 라벨을 찍으면 실제 소비전력으로 정확도를 높입니다.",
    actionChips: ["2·4·6·8시간 비교", "누진구간 변화", "라벨 촬영으로 정확도 ↑"],
    accent: "from-coral/25 via-sun/20 to-sky/20",
    appHref: "/utility",
    appLabel: "요금 계산 열기",
    presenterLine:
      "에어컨 요금은 AI에게 묻지 않습니다. 한전 누진제 검증 엔진이 브라우저 안에서 즉시 계산하고, 라벨 사진으로 내 에어컨을 찾아 정확도를 높입니다.",
    judgeLabel: "엔진 계산",
    steps: ["입력", "엔진 계산", "데이터 보강", "바로 행동"],
  },
  {
    id: "grocery",
    label: "혼밥 장보기 코치",
    icon: Utensils,
    eyebrow: "생활비 확장",
    inputTitle: "예산 한 줄, 또는 냉장고 사진 한 장",
    userLine: "3만 5천 원으로 7일치 점심·저녁을 간단하게 먹고 싶어요.",
    aiHeadline: "반복 활용 가능한 재료 중심으로 식단을 짤게요.",
    aiSignals: ["예산 안: 재료를 여러 끼니에 돌려쓰기", "예산 초과 시: 시세 기반 대체재 제안"],
    dataChips: ["KAMIS 오늘 시세", "제철 재료", "보관 기한 DB", "Pexels 참고 이미지", "식약처 레시피"],
    dataNote: "시세·제철·보관·이미지·공공 레시피가 결과 카드에 데이터로 붙어요.",
    actionBadge: "데이터 접지 완료",
    actionTitle: "마트 동선별 장보기 리스트",
    actionBody:
      "두부계란덮밥, 김치볶음밥처럼 재료를 돌려쓰는 메뉴를 만들고, 먼저 먹을 순서와 보관 팁, 예산 초과 시 대체재까지 붙입니다.",
    actionChips: ["마트 동선 리스트", "먼저 먹을 순서", "예산 초과 대체재"],
    accent: "from-brand/25 via-sun/20 to-coral/20",
    appHref: "/grocery",
    appLabel: "장보기 코치 열기",
    presenterLine:
      "생활비 확장 기능인 장보기 코치는 시세, 제철, 보관, 음식 이미지 API까지 붙여 실제로 쓸 수 있는 장보기 리스트를 만듭니다.",
  },
  {
    id: "rent",
    label: "월세·시세 확인",
    icon: BarChart3,
    eyebrow: "시세 참고",
    inputTitle: "동네 + 집 유형만 고르면 돼요",
    userLine: "보증금 1,000만 원 / 월세 60만 원, 서울 원룸 조건이 적당한가요?",
    aiHeadline: "최근 신고된 유사 거래 기준으로 비교해볼게요.",
    aiSignals: ["유사 면적 월세 중앙값과 비교", "보증금이 유난히 높으면 위험 신호 안내"],
    dataChips: ["국토교통부 실거래가", "신고 월 표시", "건축물대장 준공·용도"],
    dataNote: "실거래 신고 데이터라 조회 월을 함께 표시하고, 참고용임을 고지해요.",
    actionBadge: "계약 전 확인 3가지",
    actionTitle: "계약 전 확인 질문 리스트",
    actionBody:
      "관리비 포함 항목, 전세보증보험 가입 가능 여부, 등기부등본 근저당을 계약 전에 확인해보세요. 시세보다 조건이 유난히 좋아도 신호일 수 있어요.",
    actionChips: ["관리비 항목", "보증보험", "등기부등본"],
    accent: "from-sky/25 via-brand/15 to-straw/20",
    appHref: "/rent",
    appLabel: "시세 확인 열기",
    presenterLine:
      "월세는 국토교통부 실거래가 기준으로 비교하고, 판단을 단정하는 대신 계약 전에 확인할 것들을 질문 리스트로 정리해줍니다.",
  },
];

// 데이터 접지 — 실제 동작 기준의 정직한 서술만. (키 미설정 시 폴백까지 그대로 표기)
type DataSignal = {
  key: string;
  icon: typeof Wrench;
  title: string;
  tag: string;
  boost: string; // 무엇을 보강하는지
  fallback: string; // 키가 없을 때
  display: string; // 사용자 화면 표시·주의
};

const DATA_SIGNALS: DataSignal[] = [
  {
    key: "claude",
    icon: Sparkles,
    title: "사진·문장 이해 (Claude)",
    tag: "핵심 엔진",
    boost: "사진 한 장, 계약 문장, 냉장고 사진을 구조화된 판단 카드로 바꿉니다.",
    fallback: "키가 없으면 각 기능의 '예시로 둘러보기'가 전체 흐름을 대신 보여줍니다.",
    display: "단정 대신 '~일 수 있어요' 톤과 참고용 고지를 항상 함께 표시합니다.",
  },
  {
    key: "rulebook",
    icon: ShieldCheck,
    title: "수선의무·임대차 룰북",
    tag: "내장 · 항상 동작",
    boost: "민법 제623조와 판례 기반 룰북으로 AI 판단을 한 번 더 검증합니다.",
    fallback: "내장 데이터라 키 없이 항상 동작합니다.",
    display: "근거 조문 이름을 결과 카드에 표시하고, 법적 자문이 아님을 고지합니다.",
  },
  {
    key: "law",
    icon: Scale,
    title: "법제처 국가법령정보",
    tag: "키 연동 시 승격",
    boost: "계약서 근거를 현행 법령 원문으로 승격합니다.",
    fallback: "키가 없으면 내장 룰북 기준으로 표기하고 그 사실을 밝힙니다.",
    display: "'내장 룰북 기준' / '현행 원문' 출처를 구분해 표시합니다.",
  },
  {
    key: "rtms",
    icon: Home,
    title: "국토부 전월세 실거래가",
    tag: "무키 시 예시 폴백",
    boost: "동네·유형 기준 최근 신고 거래로 시세 감을 잡게 합니다.",
    fallback: "키가 없으면 '예시 데이터'를 명시하고 화면 흐름만 보여줍니다.",
    display: "신고 지연 가능성이 있어 조회 월을 함께 표시하고 참고용임을 고지합니다.",
  },
  {
    key: "kamis",
    icon: Banknote,
    title: "aT KAMIS 오늘 시세",
    tag: "무키 시 참고가 폴백",
    boost: "장보기 리스트에 오늘 소매가를 붙이고, 예산 초과 시 대체재 제안으로 이어집니다.",
    fallback: "키가 없어도 내장 참고가격표로 가격 감각을 항상 제공합니다.",
    display: "'오늘 시세/참고가/AI 추정' 출처 배지를 항목마다 구분해 표시합니다.",
  },
  {
    key: "recipe",
    icon: ReceiptText,
    title: "식약처 공공 레시피",
    tag: "키 연동 시 표시",
    boost: "남은 재료 결과에 조리 단계·열량·사진이 있는 실제 공공 레시피를 붙입니다.",
    fallback: "키가 없으면 섹션을 조용히 생략합니다(빈 에러 없음).",
    display: "출처(식품안전나라)를 카드에 표시합니다.",
  },
  {
    key: "pexels",
    icon: ImageIcon,
    title: "Pexels 음식 이미지",
    tag: "무키 시 텍스트 폴백",
    boost: "AI가 만든 메뉴명으로 참고 이미지를 검색해 식단 카드의 완성도를 올립니다.",
    fallback: "키가 없으면 텍스트 카드로 동작합니다.",
    display: "실제 조리 결과와 다를 수 있어 '참고 이미지'로 표기하고 작가 크레딧을 답니다.",
  },
  {
    key: "kakao",
    icon: MapPin,
    title: "Kakao 주변 장소",
    tag: "무키 시 지도 링크",
    boost: "수리 결과에 주변 설비·인테리어 업체 미리보기를 붙입니다.",
    fallback: "키가 없으면 카카오맵 검색 링크로 폴백합니다.",
    display: "업체를 보증하지 않으며 위치를 저장하지 않는다는 안내를 함께 둡니다.",
  },
  {
    key: "weather",
    icon: CloudSun,
    title: "기상청 날씨 맥락",
    tag: "무키 시 계절 맥락",
    boost: "수리 진단에 비·한파 같은 날씨 맥락을 더해 원인 추정을 돕습니다.",
    fallback: "키가 없으면 계절(장마철·겨울) 맥락만 사용합니다.",
    display: "날씨는 보조 맥락으로만 쓰고 단정 근거로 쓰지 않습니다.",
  },
  {
    key: "kepco",
    icon: Zap,
    title: "한전 누진제 계산 엔진",
    tag: "내장 · AI 미사용",
    boost: "에어컨 추가요금을 가정 전체 누진요금의 전/후 차이로 브라우저에서 즉시 계산합니다.",
    fallback: "순수 TypeScript 함수라 키·네트워크 없이 항상 동작합니다. 계산 중 API 호출 0회.",
    display: "요금표 확인일과 '추정치' 배지, 낮음~높음 범위를 함께 표시해 단정하지 않습니다.",
  },
  {
    key: "naver",
    icon: Search,
    title: "네이버 쇼핑 검색",
    tag: "무키 시 검색 생략",
    boost: "라벨 사진·모델번호로 실제 제품을 찾아 사진과 소비전력 확인으로 이어줍니다.",
    fallback: "키가 없으면 검색만 건너뛰고, 평수 기반 요금 계산은 그대로 동작합니다.",
    display: "후보는 사용자가 '내 에어컨이 맞아요'를 눌러야만 적용되고, 검색 이미지임을 고지합니다.",
  },
  {
    key: "openbanking",
    icon: Landmark,
    title: "오픈뱅킹 테스트베드",
    tag: "베타 · 모의 데이터",
    boost: "주거비 자동 분류(월세·관리비·공과금) 가능성을 보여줍니다.",
    fallback: "미설정 시 '베타 준비중' 안내로 안전하게 표시됩니다.",
    display: "테스트베드 모의 데이터임을 명시하고 실계좌를 연결하지 않습니다.",
  },
];

const DEMO_STEPS = ["입력", "AI 판단", "데이터 보강", "바로 행동"] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// 목업 스켈레톤 — 아직 도달하지 않은 단계 자리
function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-3xl bg-white/60 p-4" aria-hidden>
      <div className="skeleton h-4 w-24 rounded-full" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-3.5 w-full rounded-full" />
        ))}
      </div>
    </div>
  );
}

export default function ShowcaseExperience() {
  const [activeId, setActiveId] = useState<ScenarioId>("repair");
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [present, setPresent] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(DATA_SIGNALS[4]);
  const [slider, setSlider] = useState(64);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const active = useMemo(
    () => SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0],
    [activeId]
  );
  const activeIndex = SCENARIOS.findIndex((s) => s.id === activeId);

  // ?present=1 로 발표자 모드 진입 (URL은 저장하지 않음)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("present") === "1") setPresent(true);
  }, []);

  // 자동 데모: 단계 → 다음 시나리오 순환
  useEffect(() => {
    if (!autoPlay) return;
    const timer = window.setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % DEMO_STEPS.length;
        if (next === 0) {
          setActiveId((current) => {
            const idx = SCENARIOS.findIndex((s) => s.id === current);
            return SCENARIOS[(idx + 1) % SCENARIOS.length].id;
          });
        }
        return next;
      });
    }, reduceMotion ? 3200 : 2200);
    return () => window.clearInterval(timer);
  }, [autoPlay, reduceMotion]);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setAutoPlay(false);
      setStep((prev) => {
        const next = prev + dir;
        if (next > DEMO_STEPS.length - 1) {
          setActiveId((cur) => {
            const idx = SCENARIOS.findIndex((s) => s.id === cur);
            return SCENARIOS[(idx + 1) % SCENARIOS.length].id;
          });
          return 0;
        }
        if (next < 0) {
          setActiveId((cur) => {
            const idx = SCENARIOS.findIndex((s) => s.id === cur);
            return SCENARIOS[(idx - 1 + SCENARIOS.length) % SCENARIOS.length].id;
          });
          return DEMO_STEPS.length - 1;
        }
        return next;
      });
    },
    []
  );

  // 발표자 모드 키보드: ←/→ 단계 이동, Esc 종료
  useEffect(() => {
    if (!present) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        advance(-1);
      } else if (e.key === " ") {
        // Space로 재생/일시정지 (스크롤 방지)
        e.preventDefault();
        setAutoPlay((v) => !v);
      } else if (e.key === "Escape") {
        setPresent(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, advance]);

  function selectScenario(id: ScenarioId) {
    setAutoPlay(false);
    setActiveId(id);
    setStep(0);
  }

  function restartDemo() {
    setActiveId("repair");
    setStep(0);
    setAutoPlay(true);
  }

  const ActiveIcon = active.icon;
  // 시나리오별 스테퍼 라벨 (에어컨 요금은 "AI 판단" 대신 "엔진 계산")
  const activeSteps = active.steps ?? DEMO_STEPS;
  // 전체 데모 진행률 (발표자 모드 진행바) — 시나리오 수 × 4단계
  const demoProgress = (activeIndex * DEMO_STEPS.length + step + 1) / (SCENARIOS.length * DEMO_STEPS.length);

  return (
    <main className="relative -mb-[68px] min-h-dvh overflow-hidden bg-[#07150f] text-white">
      <m.div
        className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-brand"
        style={{ scaleX }}
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(13,160,92,.32), transparent 26%), radial-gradient(circle at 92% 4%, rgba(255,185,57,.2), transparent 24%), radial-gradient(circle at 45% 90%, rgba(90,185,234,.22), transparent 35%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]"
        aria-hidden
      />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#07150f]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="group inline-flex items-center gap-2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-ink shadow-cta">
              <NestMark size={22} />
            </span>
            <span>
              <span className="block text-sm font-black leading-tight">둥지</span>
              <span className="block text-[10px] font-semibold text-white/55">Judge interactive</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex" aria-label="쇼케이스 섹션">
            {["Live", "Data", "Impact"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="rounded-full px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPresent((v) => !v)}
              aria-pressed={present}
              className={cx(
                "hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition sm:inline-flex",
                present ? "bg-brand text-white" : "border border-white/15 bg-white/10 text-white/70 hover:text-white"
              )}
            >
              <Presentation size={14} /> 발표자 모드
            </button>
            <Link href="/repair" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-ink shadow-lift transition hover:translate-y-[-1px]">
              실제 앱 체험 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Live: 히어로 + 시나리오 + 목업 ─────────────────────── */}
      <section id="live" className="relative z-10 mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-28 lg:grid-cols-[1.02fr_.98fr]">
        <div>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-brand-tint shadow-card backdrop-blur"
          >
            <Sparkles size={15} />
            90초 안에 이해되는 주거 생활 AI 데모
          </m.div>

          <m.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-6 max-w-3xl break-keep font-display text-5xl font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl sm:leading-[1.02] lg:text-7xl"
          >
            설명하지 말고,
            <span className="block bg-gradient-to-r from-brand-tint via-white to-sun bg-clip-text text-transparent">
              만지게 보여주세요.
            </span>
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-2xl break-keep text-base leading-8 text-white/70 sm:text-lg"
          >
            집 문제를 AI가 판단하고, 공공데이터로 보강하고, 바로 보낼 수 있는 행동 카드로
            바꿉니다. 사진 한 장, 계약서 한 문장, 냉장고 속 재료까지. 막막함이 다음 행동으로
            바뀌는 과정을 이 화면에서 직접 만져볼 수 있어요.
          </m.p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoPlay((v) => !v)}
              className={cx(
                "inline-flex min-h-[48px] items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                autoPlay ? "bg-brand text-white shadow-cta" : "bg-white text-ink shadow-lift hover:translate-y-[-1px]"
              )}
              aria-pressed={autoPlay}
            >
              {autoPlay ? <Pause size={18} /> : <Play size={18} />}
              {autoPlay ? "일시정지" : "90초 데모 시작"}
            </button>
            <button
              type="button"
              onClick={restartDemo}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              aria-label="데모를 처음부터 다시 재생"
            >
              <RotateCcw size={17} />
              처음부터
            </button>
            <Link
              href="/repair"
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              실제 앱 체험하기 <ArrowRight size={17} />
            </Link>
          </div>
          <p className="mt-3 text-xs text-white/55">
            바로 가기:{" "}
            <Link href="/contract" className="font-bold text-white/80 underline underline-offset-2 hover:text-white">
              계약서 체커
            </Link>
            {" · "}
            <Link href="/grocery" className="font-bold text-white/80 underline underline-offset-2 hover:text-white">
              장보기 코치
            </Link>
            {" · "}
            <Link href="/rent" className="font-bold text-white/80 underline underline-offset-2 hover:text-white">
              시세 확인
            </Link>
          </p>
          {reduceMotion && (
            <p className="mt-3 text-xs leading-5 text-white/55">
              동작 줄이기 설정을 감지했어요. 자동 재생 대신 시나리오와 단계 버튼으로 천천히 살펴볼 수 있어요.
            </p>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              const isActive = activeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectScenario(s.id)}
                  aria-pressed={isActive}
                  className={cx(
                    "group rounded-3xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                    isActive
                      ? "border-brand/70 bg-white text-ink shadow-lift"
                      : "border-white/15 bg-white/10 text-white/70 hover:border-white/30 hover:bg-white/15"
                  )}
                >
                  <span className={cx("mb-3 inline-grid h-10 w-10 place-items-center rounded-2xl", isActive ? "bg-brand-tint text-brand-deep" : "bg-white/10 text-white")}> <Icon size={20} /> </span>
                  <span className="block break-keep text-sm font-black">{s.label}</span>
                  <span className={cx("mt-1 block text-xs leading-5", isActive ? "text-muted" : "text-white/50")}>{s.eyebrow}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 모바일 목업 ── */}
        <div className="relative mx-auto w-full max-w-[420px]">
          <m.div
            animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 -top-10 hidden rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-lift backdrop-blur md:block"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white"><DatabaseZap size={20} /></div>
              <div>
                <p className="text-xs font-black">공공데이터 보강</p>
                <p className="mt-0.5 text-[11px] text-white/55">AI 답변을 근거 카드로</p>
              </div>
            </div>
          </m.div>

          <div
            role="group"
            aria-label={`데모 미리보기 — ${active.label}, 현재 단계: ${activeSteps[step]}`}
            className="rounded-[3rem] border border-white/15 bg-white/10 p-3 shadow-[0_30px_90px_rgba(0,0,0,.38)] backdrop-blur-xl"
          >
            <div className="overflow-hidden rounded-[2.35rem] bg-[#f7f8f5] text-ink">
              {/* status bar 느낌 */}
              <div className="flex items-center justify-between bg-card px-6 pb-1 pt-3 text-[11px] font-bold text-ink/70" aria-hidden>
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-ink/60" />
                  <span className="inline-block h-2 w-3 rounded-sm bg-ink/60" />
                  <span className="inline-block h-2.5 w-5 rounded-[3px] border border-ink/50 px-[1px]">
                    <span className="block h-full w-3/4 rounded-[2px] bg-ok" />
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-line bg-card/95 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-tint text-brand-deep"><ActiveIcon size={19} /></span>
                  <div>
                    <p className="text-[11px] font-black text-brand-deep">{active.eyebrow}</p>
                    <p className="text-sm font-black">둥지 Live</p>
                  </div>
                </div>
                <span className="rounded-full bg-ok-tint px-2.5 py-1 text-[10px] font-black text-ok">데모 재현</span>
              </div>

              {/* 클릭 가능한 스테퍼 */}
              <div className="border-b border-line bg-card/95 px-5 py-2.5">
                <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="데모 단계 이동">
                  {activeSteps.map((name, i) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setAutoPlay(false);
                        setStep(i);
                      }}
                      aria-pressed={i === step}
                      aria-label={`${i + 1}단계 ${name}${i === step ? " (현재)" : ""}`}
                      className="group rounded-lg py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <span
                        className={cx(
                          "block h-1.5 rounded-full transition-colors",
                          i <= step ? "bg-brand" : "bg-line group-hover:bg-brand/30"
                        )}
                      />
                      <span
                        className={cx(
                          "mt-1 block text-center text-[10px] leading-tight",
                          i === step ? "font-black text-brand-deep" : "font-semibold text-muted"
                        )}
                      >
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={cx("bg-gradient-to-br p-5", active.accent)}>
                <AnimatePresence mode="wait">
                  <m.div
                    key={`${active.id}-${step}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.24 }}
                    className="space-y-3.5"
                  >
                    {/* 1) 입력 */}
                    <div className="rounded-3xl bg-white/90 p-4 shadow-card">
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="rounded-full bg-[#F0F2F0] px-2.5 py-1 text-[10px] font-black text-muted">사용자 입력</span>
                        <Camera size={16} className="text-muted" aria-hidden />
                      </div>
                      <p className="break-keep text-[14px] font-black leading-5">{active.inputTitle}</p>
                      <p className="mt-2 rounded-2xl bg-bg p-3 text-[12px] leading-5 text-muted">“{active.userLine}”</p>
                    </div>

                    {/* 2) AI 판단 (+3 데이터 보강 칩) */}
                    {step >= 1 ? (
                      <div className="rounded-3xl bg-[#07150f] p-4 text-white shadow-lift">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-brand-tint">
                          <Sparkles size={12} aria-hidden /> {active.judgeLabel ?? "AI 판단"}
                        </span>
                        <p className="mt-2.5 break-keep text-[13px] font-bold leading-5 text-white">{active.aiHeadline}</p>
                        <div className="mt-3 space-y-2">
                          {active.aiSignals.map((line) => (
                            <div key={line} className="flex items-start gap-2 rounded-2xl bg-white/10 p-2.5">
                              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-tint" aria-hidden />
                              <p className="text-[12px] leading-5 text-white/80">{line}</p>
                            </div>
                          ))}
                        </div>
                        {step >= 2 && (
                          <div className="mt-3 border-t border-white/10 pt-3">
                            <p className="text-[10px] font-black uppercase tracking-wider text-sun">데이터 보강</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {active.dataChips.map((chip) => (
                                <span key={chip} className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/80">
                                  {chip}
                                </span>
                              ))}
                            </div>
                            <p className="mt-2 text-[11px] leading-4 text-white/55">{active.dataNote}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <SkeletonCard lines={2} />
                    )}

                    {/* 3) 바로 행동 */}
                    {step >= 3 ? (
                      <div className="rounded-3xl bg-card p-4 shadow-card">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-black text-brand-deep">{active.actionBadge}</span>
                          <MessageSquareText size={16} className="text-brand" aria-hidden />
                        </div>
                        <h3 className="mt-2.5 text-sm font-black">{active.actionTitle}</h3>
                        <p className="mt-1.5 break-keep text-[12px] leading-5 text-muted">{active.actionBody}</p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {active.actionChips.map((chip) => (
                            <span key={chip} className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-bold text-brand-deep">
                              {chip}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={active.appHref}
                          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-[12px] font-black text-white transition hover:bg-brand-hover"
                        >
                          {active.appLabel} <ArrowRight size={13} aria-hidden />
                        </Link>
                      </div>
                    ) : (
                      <SkeletonCard lines={step >= 1 ? 3 : 2} />
                    )}
                  </m.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-white/45">
            실제 앱 화면을 재현한 심사용 예시예요. 진짜 결과는 위 버튼으로 바로 체험할 수 있어요.
          </p>
        </div>
      </section>

      {/* ── Data: 데이터 접지 ───────────────────────────────── */}
      <section id="data" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
        <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-black text-brand-tint">데이터가 붙으면 데모가 달라집니다</p>
            <h2 className="mt-3 max-w-xl break-keep font-display text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
              AI 답변을
              <span className="block text-sun">근거 있는 액션 카드</span>
              로 바꾸는 신호들.
            </h2>
            <p className="mt-4 max-w-lg break-keep text-sm leading-7 text-white/65">
              심사위원에게 중요한 건 “AI가 말한다”가 아니라 “내가 지금 무엇을 해야 하는지 믿고
              누를 수 있다”입니다. 그래서 둥지는 외부 API와 내장 룰북을 카드별 근거로 붙이고,
              키가 없을 때의 폴백까지 화면에 정직하게 표시합니다.
            </p>
            <div className="mt-6 rounded-[1.6rem] border border-white/15 bg-white/10 p-4">
              <p className="text-xs font-black text-white/70">
                선택한 신호: <span className="text-white">{selectedSignal.title}</span>
                <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">{selectedSignal.tag}</span>
              </p>
              <dl className="mt-3 space-y-2.5 text-[12px] leading-5">
                <div>
                  <dt className="font-black text-brand-tint">보강하는 것</dt>
                  <dd className="mt-0.5 break-keep text-white/70">{selectedSignal.boost}</dd>
                </div>
                <div>
                  <dt className="font-black text-sun">키가 없을 때</dt>
                  <dd className="mt-0.5 break-keep text-white/70">{selectedSignal.fallback}</dd>
                </div>
                <div>
                  <dt className="font-black text-sky">화면 표시·주의</dt>
                  <dd className="mt-0.5 break-keep text-white/70">{selectedSignal.display}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {DATA_SIGNALS.map((signal) => {
              const Icon = signal.icon;
              const activeSignal = selectedSignal.key === signal.key;
              return (
                <button
                  key={signal.key}
                  type="button"
                  onClick={() => setSelectedSignal(signal)}
                  className={cx(
                    "rounded-[1.6rem] border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
                    activeSignal ? "border-brand/60 bg-white text-ink shadow-lift" : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                  )}
                  aria-pressed={activeSignal}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={cx("inline-grid h-10 w-10 place-items-center rounded-2xl", activeSignal ? "bg-brand-tint text-brand-deep" : "bg-white/10 text-white")}> <Icon size={19} aria-hidden /> </span>
                    <span className={cx("rounded-full px-2 py-1 text-[10px] font-bold", activeSignal ? "bg-brand-tint text-brand-deep" : "bg-white/10 text-white/55")}>{signal.tag}</span>
                  </span>
                  <p className="mt-3 text-sm font-black">{signal.title}</p>
                  <p className={cx("mt-1.5 break-keep text-xs leading-5", activeSignal ? "text-muted" : "text-white/55")}>{signal.boost}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Impact: 왜 필요한가 + Before/After ─────────────────── */}
      <section id="impact" className="relative z-10 mx-auto w-full max-w-6xl px-5 py-20">
        <div className="mb-10">
          <p className="text-sm font-black text-brand-tint">왜 둥지인가</p>
          <h2 className="mt-3 max-w-2xl break-keep font-display text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
            막막함을 <span className="text-sun">행동</span>으로.
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              {
                title: "정보 비대칭",
                body: "청년 세입자는 수리 책임, 계약 특약, 시세 정보를 집주인보다 늦게, 어렵게 얻어요.",
              },
              {
                title: "검색으로 안 풀리는 문제",
                body: "검색 결과를 아무리 읽어도 '우리 집 지금 상황'에 맞는 다음 행동은 나오지 않아요.",
              },
              {
                title: "단정하지 않는 도우미",
                body: "둥지는 판단을 단정하는 대신, 근거와 출처를 붙여 안전한 다음 행동을 정리해요.",
              },
            ].map((c) => (
              <div key={c.title} className="rounded-[1.6rem] border border-white/15 bg-white/10 p-5">
                <p className="text-sm font-black text-white">{c.title}</p>
                <p className="mt-2 break-keep text-xs leading-6 text-white/65">{c.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-[1.6rem] border border-white/10 bg-white/5 px-4 py-3 text-[12px] font-bold" aria-label="막막함에서 행동으로 이어지는 흐름">
            {["막막한 문제", "사진·문장 입력", "AI 판단", "데이터 근거", "바로 할 행동"].map((label, i, arr) => (
              <span key={label} className="flex items-center gap-2">
                <span className={cx("rounded-full px-3 py-1.5", i === arr.length - 1 ? "bg-brand text-white" : "bg-white/10 text-white/70")}>{label}</span>
                {i < arr.length - 1 && <ArrowRight size={13} className="text-white/40" aria-hidden />}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2.4rem] border border-white/15 bg-white p-5 text-ink shadow-[0_30px_90px_rgba(0,0,0,.35)] md:p-8">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black text-brand-deep">심사위원이 기억하는 한 장면</p>
              <h2 className="mt-3 break-keep font-display text-4xl font-black leading-tight tracking-[-0.035em] sm:text-5xl">
                막막함을 줄이고,
                <span className="block text-brand-deep">행동을 늘립니다.</span>
              </h2>
              <p className="mt-4 break-keep text-sm leading-7 text-muted">
                슬라이더를 움직이면 “그냥 챗봇”과 “둥지 액션 카드”의 차이를 시각적으로 설명할 수
                있습니다. 발표 중 제품 철학을 짧게 보여주기 좋은 섹션이에요.
              </p>
              <label htmlFor="impact-slider" className="mt-6 block text-xs font-black text-muted">
                둥지가 개입한 정도: {slider}%
              </label>
              <input
                id="impact-slider"
                type="range"
                min={25}
                max={85}
                value={slider}
                onChange={(e) => setSlider(Number(e.target.value))}
                aria-label="둥지가 개입한 정도 비교 슬라이더 (참고 비교)"
                className="mt-3 w-full accent-brand"
              />
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-line bg-bg p-3">
              <div className="grid min-h-[360px] gap-3 md:grid-cols-2">
                <div className="rounded-[1.6rem] bg-white p-5 shadow-card">
                  <span className="rounded-full bg-danger-tint px-2.5 py-1 text-[10px] font-black text-danger">Before</span>
                  <h3 className="mt-4 text-xl font-black">사용자는 여전히 검색 중</h3>
                  <ul className="mt-4 space-y-3 break-keep text-sm leading-6 text-muted">
                    <li>• 검색 결과 20개를 열어봐도 결론이 없음</li>
                    <li>• 집주인에게 뭐라고 말할지 막막함</li>
                    <li>• 계약서 특약이 위험한지 알 수 없음</li>
                    <li>• 장보고 나면 재료가 남아서 버림</li>
                  </ul>
                </div>
                <div className="relative overflow-hidden rounded-[1.6rem] bg-[#07150f] p-5 text-white shadow-lift">
                  <div
                    className="absolute inset-y-0 left-0 bg-brand/20"
                    style={{ width: `${slider}%` }}
                    aria-hidden
                  />
                  <div className="relative">
                    <span className="rounded-full bg-brand-tint px-2.5 py-1 text-[10px] font-black text-brand-deep">After</span>
                    <h3 className="mt-4 text-xl font-black">둥지가 바로 행동으로 정리</h3>
                    <div className="mt-4 space-y-3">
                      {[
                        "사진 한 장으로 오늘 할 일 3개",
                        "바로 보낼 수 있는 집주인 메시지",
                        "위험 조항 근거와 수정 요청 문구",
                        "예산 안에서 식단·시세·보관 팁까지",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 rounded-2xl bg-white/10 p-3">
                          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-brand-tint" aria-hidden />
                          <p className="break-keep text-sm leading-6 text-white/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 마무리 CTA + 신뢰 배지 ─────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-8">
        <div className="rounded-[2.2rem] border border-white/15 bg-gradient-to-br from-white via-brand-tint to-sun-tint p-6 text-ink shadow-lift md:p-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-brand-deep">
                <ClipboardCheck size={15} aria-hidden /> 발표용 추천 멘트
              </p>
              <h2 className="mt-4 break-keep font-display text-3xl font-black leading-tight tracking-[-0.03em] md:text-4xl">
                “둥지는 주거 문제를 사진·문장으로 받아, 법/시세/생활 데이터를 붙여 바로 행동 가능한 카드로 바꿉니다.”
              </h2>
              <p className="mt-4 break-keep text-sm leading-7 text-muted">
                이 페이지를 첫 화면으로 보여준 뒤, 실제 앱의 수리 진단과 장보기 코치로 넘어가면
                설명 없이도 완성도가 전달됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Link href="/repair" className="btn-primary min-w-[180px]">수리 진단 체험</Link>
              <Link href="/grocery" className="btn-ghost min-w-[180px] bg-white">장보기 코치 보기</Link>
            </div>
          </div>
        </div>
        <TrustBadges dark className="mt-6" />
      </section>

      {/* ── 발표자 모드 바 ─────────────────────────────────────── */}
      <AnimatePresence>
        {present && (
          <m.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/15 bg-[#07150f]/95 backdrop-blur-xl"
            role="region"
            aria-label="발표자 모드"
          >
            <div className="h-1 w-full bg-white/10" aria-hidden>
              <div className="h-full bg-brand transition-[width] duration-300" style={{ width: `${Math.round(demoProgress * 100)}%` }} />
            </div>
            <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => advance(-1)}
                  aria-label="이전 단계"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                >
                  <ArrowRight size={15} className="rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setAutoPlay((v) => !v)}
                  aria-pressed={autoPlay}
                  aria-label={autoPlay ? "자동 재생 일시정지" : "자동 재생"}
                  className={cx("grid h-9 w-9 place-items-center rounded-xl transition", autoPlay ? "bg-brand text-white" : "border border-white/15 bg-white/10 text-white hover:bg-white/15")}
                >
                  {autoPlay ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
                </button>
                <button
                  type="button"
                  onClick={() => advance(1)}
                  aria-label="다음 단계"
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                >
                  <ArrowRight size={15} aria-hidden />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-brand-tint">
                  {activeIndex + 1}/{SCENARIOS.length} {active.label} · {activeSteps[step]}
                </p>
                <p className="mt-0.5 truncate break-keep text-[12px] leading-5 text-white/80 sm:whitespace-normal">
                  {active.presenterLine}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 text-[10px] font-bold text-white/45 md:flex" aria-hidden>
                <kbd className="rounded border border-white/15 px-1.5 py-0.5">←</kbd>
                <kbd className="rounded border border-white/15 px-1.5 py-0.5">→</kbd>
                이동
                <kbd className="rounded border border-white/15 px-1.5 py-0.5">Esc</kbd>
                종료
              </div>
              <button
                type="button"
                onClick={() => setPresent(false)}
                aria-label="발표자 모드 종료"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </main>
  );
}
