// 수리 업체 연결 — 지도 앱 검색 딥링크(개인정보·위치 미수집).
// 특정 사설 업체를 서버에 등록·보증하지 않고, 지도 검색으로만 연결합니다.
import type { RepairCategory } from "./types";

// 문제 유형 → 지도 검색어
export const SEARCH_TERMS: Record<RepairCategory, string> = {
  leak: "누수 수리",
  boiler: "보일러 수리",
  mold: "곰팡이 제거 결로 시공",
  toilet: "변기 막힘 설비",
  doorlock: "도어록 수리",
  electric: "전기 수리",
  gas: "도시가스 점검",
  pest: "방역 해충 방제",
  etc: "집수리",
};

// 버튼 등에 쓰는 짧은 라벨
export const CATEGORY_LABEL: Record<RepairCategory, string> = {
  leak: "누수 수리",
  boiler: "보일러 수리",
  mold: "곰팡이·결로 시공",
  toilet: "변기·설비",
  doorlock: "도어록 수리",
  electric: "전기 수리",
  gas: "도시가스 점검",
  pest: "해충 방제",
  etc: "집수리",
};

export function searchTermFor(category?: RepairCategory): string {
  return SEARCH_TERMS[category ?? "etc"] ?? SEARCH_TERMS.etc;
}

export function categoryLabel(category?: RepairCategory): string {
  return CATEGORY_LABEL[category ?? "etc"] ?? CATEGORY_LABEL.etc;
}

// region(구/동, 선택) + 검색어 조합 — 저장하지 않고 검색어로만 사용
function buildQuery(category: RepairCategory | undefined, region?: string): string {
  const term = searchTermFor(category);
  const r = (region ?? "").trim();
  return r ? `${r} ${term}` : term;
}

// 지도 검색 딥링크 (웹 URL — 데스크톱은 검색결과, 모바일은 앱으로 핸드오프)
export function naverMapSearchUrl(category?: RepairCategory, region?: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(buildQuery(category, region))}`;
}

export function kakaoMapSearchUrl(category?: RepairCategory, region?: string): string {
  return `https://map.kakao.com/?q=${encodeURIComponent(buildQuery(category, region))}`;
}

// ── 향후 스폰서/제휴 업체 자리 (설계만) ─────────────────────────
// 데모에는 실제 광고·가짜 업체·영업 문구를 넣지 않습니다. 비워 둡니다.
// 제휴 모델 확장 시 이 배열에 검증된 업체를 주입하면 ServiceCard 가 렌더됩니다.
export interface ServiceProvider {
  name: string;
  tel?: string;
  region?: string;
  badge?: string; // 예: "둥지 검증", "제휴"
}

export const SPONSORED_PROVIDERS: ServiceProvider[] = [];
