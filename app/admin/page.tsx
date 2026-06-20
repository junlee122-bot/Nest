import AssistWorkspace, { TopicConfig } from "@/components/AssistWorkspace";

const config: TopicConfig = {
  topic: "admin",
  emoji: "📋",
  title: "이사·행정 길잡이",
  subtitle: "전입신고 · 확정일자 · 보증보험 체크리스트",
  question: "어떤 상황이에요?",
  placeholder: "예) 어제 원룸으로 처음 이사 왔어요. 뭐부터 해야 할까요?",
  chips: ["방금 이사 왔어요", "전입신고", "확정일자", "보증보험", "공과금 명의변경"],
  showPhoto: false,
  loadingText: "둥지가 체크리스트를 정리하는 중...",
};

export default function AdminPage() {
  return <AssistWorkspace config={config} />;
}
