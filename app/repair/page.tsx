import AssistWorkspace, { TopicConfig } from "@/components/AssistWorkspace";

const config: TopicConfig = {
  topic: "repair",
  emoji: "🏠",
  title: "집 수리 — 살림 응급실",
  subtitle: "응급처치 · 책임 판단 · 집주인 문구",
  question: "어디가 문제예요?",
  placeholder: "예) 화장실 천장에서 물이 새고 벽지에 곰팡이가 폈어요.",
  chips: [
    "곰팡이가 생겼어요",
    "보일러가 안 켜져요",
    "변기가 막혔어요",
    "물이 새요",
    "결로가 심해요",
    "벌레가 나와요",
  ],
  showPhoto: true,
  loadingText: "둥지가 살펴보는 중...",
  loadingStages: [
    "사진과 상황을 살펴보는 중…",
    "누구 책임인지 따져보는 중…",
    "집주인에게 보낼 문구를 쓰는 중…",
  ],
};

export default function RepairPage() {
  return <AssistWorkspace config={config} />;
}
