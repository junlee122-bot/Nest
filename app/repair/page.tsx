import AssistWorkspace, { TopicConfig } from "@/components/AssistWorkspace";

const config: TopicConfig = {
  topic: "repair",
  emoji: "🏠",
  title: "집 수리 — 살림 응급실",
  subtitle: "응급처치 · 책임 판단 · 집주인 문구",
  question: "어디가 문제예요?",
  placeholder: "예) 화장실 천장에서 물이 새고 벽지에 곰팡이가 폈어요.",
  chips: ["곰팡이", "누수", "보일러 안 됨", "변기 막힘", "결로", "벌레"],
  showPhoto: true,
  loadingText: "둥지가 살펴보는 중...",
};

export default function RepairPage() {
  return <AssistWorkspace config={config} />;
}
