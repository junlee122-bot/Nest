import type { Metadata } from "next";
import ShowcaseExperience from "@/components/showcase/ShowcaseExperience";

export const metadata: Metadata = {
  title: "인터랙티브 쇼케이스 — 둥지 Nest",
  description:
    "심사위원에게 둥지의 주거 문제 해결 흐름과 데이터 연동 가치를 90초 안에 보여주는 인터랙티브 웹사이트입니다.",
  openGraph: {
    title: "둥지 — 1인 가구를 위한 AI 주거 생활 도우미",
    description:
      "집수리 사진 진단, 계약서 위험 조항, 월세 시세, 장보기 코치를 AI와 공공데이터로 연결합니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function ShowcasePage() {
  return <ShowcaseExperience />;
}
