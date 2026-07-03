import type { Metadata } from "next";
import ShowcaseExperience from "@/components/showcase/ShowcaseExperience";

export const metadata: Metadata = {
  title: "인터랙티브 쇼케이스 — 둥지 Nest",
  description:
    "심사위원에게 둥지의 주거 문제 해결 흐름과 데이터 연동 가치를 90초 안에 보여주는 인터랙티브 웹사이트입니다.",
};

export default function ShowcasePage() {
  return <ShowcaseExperience />;
}
