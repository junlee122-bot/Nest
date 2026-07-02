import type { Metadata } from "next";
import RentCheck from "@/components/RentCheck";

export const metadata: Metadata = {
  title: "전월세 시세 참고 — 둥지 Nest",
  description:
    "국토교통부 실거래 신고가로 우리 동네 전월세 시세를 확인해요. 계약 전 보증금이 적정한지 감 잡기.",
};

export default function RentPage() {
  return <RentCheck />;
}
