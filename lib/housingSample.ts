// 주거비 분석 "예시 데이터" (v18) — 오픈뱅킹 테스트베드 승인 전 미리보기용
//
// 실제 계좌·실거래가 아니라 손으로 만든 가상의 자취생 2개월 지출 샘플이다.
// 분류·집계는 실제 코드 경로(lib/housing.ts summarize)를 그대로 사용하므로,
// 연동이 열리면 데이터 소스만 오픈뱅킹으로 바뀐다. 화면에는 "예시 데이터"를 명시한다.
import type { ObTransaction } from "./openbanking";

export const SAMPLE_PERIOD = { from: "20260516", to: "20260715" } as const;

/** 가상의 자취생(원룸·1인 가구) 2개월 출금 내역 */
export const SAMPLE_TRANSACTIONS: ObTransaction[] = [
  // ── 6월분 ──
  { date: "20260525", amount: 500000, content: "월세 김철수", inout: "출금" },
  { date: "20260525", amount: 70000, content: "관리비 5월분", inout: "출금" },
  { date: "20260527", amount: 28430, content: "한국전력 전기요금", inout: "출금" },
  { date: "20260528", amount: 18200, content: "서울도시가스", inout: "출금" },
  { date: "20260602", amount: 55000, content: "SKT 통신요금", inout: "출금" },
  { date: "20260605", amount: 14300, content: "상수도요금", inout: "출금" },
  { date: "20260608", amount: 32000, content: "편의점 CU", inout: "출금" },
  { date: "20260614", amount: 48200, content: "쿠팡 주문", inout: "출금" },
  // ── 7월분 ──
  { date: "20260625", amount: 500000, content: "월세 김철수", inout: "출금" },
  { date: "20260625", amount: 70000, content: "관리비 6월분", inout: "출금" },
  { date: "20260627", amount: 41120, content: "한국전력 전기요금", inout: "출금" },
  { date: "20260628", amount: 11800, content: "서울도시가스", inout: "출금" },
  { date: "20260702", amount: 55000, content: "SKT 통신요금", inout: "출금" },
  { date: "20260709", amount: 27500, content: "배달의민족", inout: "출금" },
  { date: "20260712", amount: 15900, content: "다이소", inout: "출금" },
  // 입금은 집계에서 제외되는 것도 함께 시연
  { date: "20260701", amount: 1800000, content: "급여", inout: "입금" },
];

/** 예시 결과에 붙는 한마디 (샘플 수치 기준으로 손으로 작성한 고정 문구) */
export const SAMPLE_COMMENT =
  "예시 기준으로 월세가 총 주거비의 70%를 넘어요. 여름철 전기요금이 전월 대비 오르는 흐름이라면, 에어컨 전기요금 계산기로 사용시간별 요금을 미리 확인해보세요.";
