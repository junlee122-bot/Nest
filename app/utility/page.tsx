import type { Metadata } from "next";
import UtilityHub from "@/components/utility/UtilityHub";
import { TopicConfig } from "@/components/AssistWorkspace";
import { SAMPLE_UTILITY } from "@/lib/sample";
import { kstParts } from "@/lib/integrations/core";

export const metadata: Metadata = {
  title: "전기요금 계산 — 둥지 Nest",
  description:
    "에어컨 종류·냉방 평수·사용시간으로 한 달 예상 추가 전기요금을 계산하고, 고지서·공과금은 AI로 점검해요.",
};

// 계산 월 기본값을 요청 시점 KST 기준으로 전달 (hydration mismatch 방지)
export const dynamic = "force-dynamic";

const billConfig: TopicConfig = {
  topic: "utility",
  sampleResult: SAMPLE_UTILITY,
  emoji: "💡",
  title: "공과금 점검",
  subtitle: "평균 대비 진단 · 절약 팁",
  question: "이번 달 요금, 같이 볼까요?",
  placeholder: "예) 1월 도시가스 8만원 나왔어요. 원룸 혼자 사는데 많이 나온 건가요?",
  chips: [
    "전기요금 3만원 나왔어요",
    "도시가스 8만원 나왔어요",
    "수도요금이 많이 나왔어요",
    "관리비가 비싼 것 같아요",
  ],
  showPhoto: true,
  loadingText: "둥지가 요금을 비교하는 중...",
  loadingStages: [
    "고지서·요금을 읽는 중…",
    "1인 가구 평균과 비교하는 중…",
    "절약 팁을 정리하는 중…",
  ],
};

export default function UtilityPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const initialMonth = parseInt(kstParts().month, 10);
  // 서버에서 초기 탭을 결정해 첫 페인트부터 올바른 탭 표시 (?h= 기록 링크 → 고지서 탭)
  const initialTab =
    searchParams?.h || searchParams?.tab === "bill" ? ("bill" as const) : ("aircon" as const);
  return <UtilityHub initialMonth={initialMonth} initialTab={initialTab} billConfig={billConfig} />;
}
