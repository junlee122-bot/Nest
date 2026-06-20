import AssistWorkspace, { TopicConfig } from "@/components/AssistWorkspace";
import { SAMPLE_UTILITY } from "@/lib/sample";

const config: TopicConfig = {
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

export default function UtilityPage() {
  return <AssistWorkspace config={config} />;
}
