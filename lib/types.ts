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

// ── 메인: 집 수리 결과 (3단 카드) ──────────────────────────────
export interface RepairResult {
  kind: "repair";
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

// API 요청/응답
export interface AssistRequest {
  topic: Topic;
  text: string;
  imageDataUrl?: string | null; // "data:image/png;base64,..."
}

export interface AssistResponseOk {
  ok: true;
  result: AssistResult;
}

export interface AssistResponseErr {
  ok: false;
  error: string;
}

export type AssistResponse = AssistResponseOk | AssistResponseErr;
