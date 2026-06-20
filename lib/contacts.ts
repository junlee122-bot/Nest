// 응급/위험·분쟁 관련 연락처 — 한 곳에서 관리.
// ⚠ 연락처는 변경될 수 있습니다. 배포 전 항상 최신 정보를 확인하세요.
// 화면에는 아래 CONTACTS_VERIFIED(확인 시점)를 함께 노출합니다.
import type { RepairCategory } from "./types";

export const CONTACTS_VERIFIED = "2026-06 확인"; // verified date — 최신 확인 필요

export interface Contact {
  label: string;
  tel: string;
  note?: string;
}

export const HELP_CONTACTS: Contact[] = [
  { label: "화재·구조·응급", tel: "119" },
  { label: "가스 누출 (한국가스안전공사)", tel: "1544-4500" },
  { label: "전기 고장·정전 (한국전력)", tel: "123" },
];

// 긴급 상황(urgency=emergency)에서 문제 유형별로 먼저 안내할 공식 연락처.
// tel 은 숫자/하이픈만 — tel: 링크로 바로 전화. (모두 최신 확인 필요)
export const EMERGENCY_CONTACTS: Partial<Record<RepairCategory, Contact[]>> = {
  gas: [
    { label: "화재·폭발 위험 시 119", tel: "119" },
    { label: "한국가스안전공사", tel: "1544-4500" },
  ],
  electric: [
    { label: "화재 위험 시 119", tel: "119" },
    { label: "한국전기안전공사", tel: "1588-7500" },
    { label: "정전·한국전력", tel: "123" },
  ],
  leak: [
    { label: "심한 누수·침수 시 119", tel: "119" },
    { label: "공동주택은 관리사무소에 먼저 연락하세요", tel: "" },
  ],
};

export function emergencyContactsFor(category?: RepairCategory): Contact[] {
  if (!category) return [{ label: "긴급 시 119", tel: "119" }];
  return EMERGENCY_CONTACTS[category] ?? [{ label: "긴급 시 119", tel: "119" }];
}

// 분쟁 조정 — 지역 위원회별 연락처가 달라 대표 안내만 둠 (최신 확인 필요)
export const DISPUTE_HELP = {
  label: "주택임대차분쟁조정위원회",
  note: "LH·한국부동산원 등에서 운영하며 지역별로 접수처가 다릅니다. '주택임대차분쟁조정위원회'로 검색해 관할 위원회를 확인하세요.",
};

