// 둥지(Nest) 공통 타입 정의

export type Topic = "repair" | "admin" | "utility";

export type Tone = "polite" | "firm";

// 안전 경고 수준 (브리프 4장 — 앰버/위험 구분)
export type SafetyLevel = "none" | "warning" | "danger";

export interface SafetyInfo {
  level: SafetyLevel;
  message: string;
  // 위험 시 안내할 기관/연락처 (예: "119", "도시가스 고객센터 1544-4500")
  contacts?: string[];
}

// 책임 판단 결과 (브리프 4장 ② / 6장)
export type Verdict = "landlord" | "tenant" | "depends";

export interface Responsibility {
  verdict: Verdict;
  summary: string; // 한 줄 평이한 결론 요약 (예: "누수는 보통 집주인 수선의무예요")
  reason: string;
  disclaimer: string;
}

// 긴급도 신호등
export type Urgency = "emergency" | "soon" | "routine";

// 수리 문제 유형 (업체 검색어·긴급 연락처 매핑용)
export type RepairCategory =
  | "leak"
  | "boiler"
  | "mold"
  | "toilet"
  | "doorlock"
  | "electric"
  | "gas"
  | "pest"
  | "etc";

// ── 메인: 집 수리 결과 (3단 카드) ──────────────────────────────
export interface RepairResult {
  kind: "repair";
  category?: RepairCategory; // 문제 유형 (업체 연결용)
  urgency: Urgency; // 긴급도 신호등
  firstAction: string; // 지금 당장 할 단 한 가지
  emergency: string[]; // ① 지금 당장 할 수 있는 것
  safety: SafetyInfo; // 안전 경고 배너
  responsibility: Responsibility; // ② 누구 책임?
  message_polite: string; // ③ 집주인 문구 (정중)
  message_firm: string; // ③ 집주인 문구 (단호)
  certified_mail_suggested: boolean; // 내용증명 권유 여부
}

// ── 보조: 이사·행정 길잡이 ────────────────────────────────────
export interface ChecklistItem {
  title: string;
  detail: string;
  deadline?: string; // 예: "전입 후 14일 이내"
}

export interface AdminResult {
  kind: "admin";
  intro: string;
  checklist: ChecklistItem[];
  tips: string[];
}

// ── 보조: 공과금 점검 ────────────────────────────────────────
export type UtilityStatus = "high" | "normal" | "low" | "unknown";

export interface UtilityResult {
  kind: "utility";
  summary: string;
  status: UtilityStatus;
  assessment: string; // 평균 대비 평가
  amount?: number | null; // 사용자 요금(원). 모르면 null
  average?: number | null; // 1인 가구 평균 추정(원). 모르면 null
  unit?: string; // 단위 (기본 "원")
  tips: string[]; // 절약 팁
  sources: string[]; // 공공데이터 출처 표기
}

export type AssistResult = RepairResult | AdminResult | UtilityResult;

// ── 계약서 독소조항 체커 ──────────────────────────────────────
export type RiskLevel = "high" | "medium" | "low";

export interface ContractFinding {
  clause_text: string; // 문제 조항 원문 인용
  risk: RiskLevel;
  legal_basis: string[]; // 근거 법조문
  why: string; // 왜 불리한지
  action: string; // 대응
  case_note?: string; // 사례/판례 한 줄(룰북 기반)
}

export interface ContractResult {
  overall_risk: "high" | "medium" | "low" | "none";
  summary: string;
  findings: ContractFinding[];
  disclaimer: string;
}

export interface ContractResponseOk {
  ok: true;
  result: ContractResult;
}
export interface ContractResponseErr {
  ok: false;
  error: string;
}
export type ContractResponse = ContractResponseOk | ContractResponseErr;

// ── 혼밥 장보기 코칭 ──────────────────────────────────────────
export type GroceryMode = "plan" | "use";

// 탭 A — 식단 짜기
export interface GroceryMeal {
  slot: string; // 아침/점심/저녁
  name: string;
  why: string; // 간단·저렴 이유
}
export interface GroceryDay {
  day: string; // 월/화/...
  meals: GroceryMeal[];
}
export interface ShoppingItem {
  item: string;
  qty: string;
  est_price: number;
  used_in: string[]; // 어느 메뉴에 쓰이는지
  category?: string; // 마트 코너 (채소·과일/정육·계란/유제품/냉동·가공/양념·기타)
  fresh_label?: string; // 상하기 쉬운 재료의 대략 기한 (예: "3일 내")
  seasonal?: boolean; // 제철 재료 여부 (AI + 서버 매칭 보정)
  // ↓ 서버 후처리로 부착 (내장 데이터 매칭 — AI 출력 아님)
  storage_tip?: string; // 보관 팁 한 줄
  storage_days?: string; // 보관 참고 기간 (예: "냉장 3~5일")
  price_ref?: string; // 참고가 범위 (예: "3,000~4,500원")
  today_price?: string; // 오늘 소매 시세 (KAMIS)
}

// 식단 결과에 서버가 부착하는 메타 (데이터 출처·제철 반영 내역)
export interface GroceryMeta {
  month: number; // 기준 월
  seasonal_picks: { name: string; note: string }[]; // 이번 달 제철 추천
  seasonal_used: string[]; // 장보기 리스트 중 제철 재료명
  price_source: "kamis" | "reference"; // 가격 근거 데이터
  kamis_date?: string; // KAMIS 시세 기준일 (YYYY-MM-DD)
}

// 예산 초과 시 대체재 제안 (C-1) — 내장 스왑 테이블 + 참고가 기준, 서버 부착
export interface BudgetSwap {
  from: string; // 리스트의 비싼 항목
  to: string; // 대체재 (참고가격표 품목)
  why: string;
  est_saving?: number; // 참고가 기준 대략 절약(원)
  to_price_ref?: string; // 대체재 참고가 표기 (예: "1,100~2,000원/100g")
  to_today_price?: string; // 대체재 오늘 시세 (KAMIS 매칭 시)
}

export interface BudgetFix {
  budget: number; // 해석된 예산(원)
  total: number; // 예상 합계(원)
  over: number; // 초과액(원)
  swaps: BudgetSwap[]; // 최대 3개
}

export interface GroceryPlanResult {
  mode: "plan";
  plan_days: GroceryDay[];
  shopping_list: ShoppingItem[];
  total_est_price: number;
  budget_note?: string; // 예산 초과 시 대안
  tips: string[];
  meta?: GroceryMeta; // 서버 부착
  budget_fix?: BudgetFix; // 서버 부착 (예산 초과 시에만)
}

// 요리 참고 사진 (Pexels) — 서버 부착, 키 없으면 생략
export interface FoodPhoto {
  url: string;
  photographer: string; // 크레딧 표기용 (Pexels 가이드라인)
  photographerUrl: string;
  sourceUrl: string; // Pexels 원본 페이지
}

// 탭 B — 남은 재료 처리
export interface GroceryRecipe {
  name: string;
  uses: string[]; // 가진 재료 중 사용
  missing: string[]; // 없으면 최소로 살 것
  steps: string[];
  time_min: number;
  note?: string;
  photo?: FoodPhoto; // 서버 부착 (AI 출력 아님)
}
// 공공 레시피 DB(식약처 식품안전나라) 실제 레시피 — 서버 부착
export interface DbRecipe {
  name: string;
  ingredients: string; // 재료 원문(요약)
  steps: string[];
  image?: string | null;
  kcal?: string | null; // 1인분 열량(kcal)
  source: string; // 출처 표기
}

// 가진 재료의 보관 요령 — 내장 데이터 매칭, 서버 부착
export interface StorageNote {
  name: string;
  method: string; // 냉장/냉동/실온
  days: string; // 신선 소비 참고 기간
  tip: string;
  freezable?: boolean;
}

export interface GroceryUseResult {
  mode: "use";
  recipes: GroceryRecipe[];
  priority_note: string; // 상하기 쉬운 재료 먼저
  db_recipes?: DbRecipe[]; // 서버 부착 (키 없으면 생략)
  storage_notes?: StorageNote[]; // 서버 부착 (내장 데이터)
}

export type GroceryResult = GroceryPlanResult | GroceryUseResult;

export interface GroceryResponseOk {
  ok: true;
  result: GroceryResult;
}
export interface GroceryResponseErr {
  ok: false;
  error: string;
}
export type GroceryResponse = GroceryResponseOk | GroceryResponseErr;

// 냉장고 사진 → 재료 추출 (C-2). 결과는 입력창에 채워 사용자가 수정한다.
export interface GroceryExtractOk {
  ok: true;
  ingredients: string[];
}
export type GroceryExtractResponse = GroceryExtractOk | GroceryResponseErr;

// API 요청/응답
export interface AssistRequest {
  topic: Topic;
  text: string;
  imageDataUrl?: string | null; // "data:image/png;base64,..."
  disallowClarify?: boolean; // 되묻기 1회 제한용 — true면 추가 질문 없이 최종 결과
}

// 되묻기(추가 질문)
export interface Clarify {
  question: string;
  chips: string[];
}

export interface AssistResponseOk {
  ok: true;
  result: AssistResult;
}

export interface AssistResponseClarify {
  ok: true;
  clarify: Clarify;
}

export interface AssistResponseErr {
  ok: false;
  error: string;
}

export type AssistResponse =
  | AssistResponseOk
  | AssistResponseClarify
  | AssistResponseErr;
