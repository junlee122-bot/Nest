// 응급/위험·분쟁 관련 연락처 — 한 곳에서 관리.
// ⚠ 연락처는 변경될 수 있습니다. 배포 전 항상 최신 정보를 확인하세요.
// 화면에는 아래 CONTACTS_VERIFIED(확인 시점)를 함께 노출합니다.

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

// 분쟁 조정 — 지역 위원회별 연락처가 달라 대표 안내만 둠 (최신 확인 필요)
export const DISPUTE_HELP = {
  label: "주택임대차분쟁조정위원회",
  note: "LH·한국부동산원 등에서 운영하며 지역별로 접수처가 다릅니다. '주택임대차분쟁조정위원회'로 검색해 관할 위원회를 확인하세요.",
};
