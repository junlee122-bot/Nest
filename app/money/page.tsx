import MoneyBeta from "@/components/MoneyBeta";
import { isOpenBankingConfigured } from "@/lib/openbanking";

// 환경변수를 요청 시점에 읽어 설정 여부 판단
export const dynamic = "force-dynamic";

export default function MoneyPage() {
  return <MoneyBeta configured={isOpenBankingConfigured()} />;
}
