// 시즌 힌트 (v5.1) — 계절에 따라 홈 퀵액션에 뱃지로 안내
// 서버 프리렌더 시점 고정을 피하려고 클라이언트에서 호출한다.

export interface SeasonHint {
  /** 뱃지를 붙일 기능 경로 */
  href: string;
  /** 짧은 뱃지 문구 (10자 이내) */
  badge: string;
  /** 조금 더 긴 설명 (툴팁·보조 문구용) */
  detail: string;
}

export function seasonHint(date: Date = new Date()): SeasonHint {
  const m = date.getMonth() + 1;
  if (m >= 6 && m <= 8) {
    return {
      href: "/repair",
      badge: "장마철 주의",
      detail: "장마철엔 곰팡이·누수 문의가 늘어요. 사진으로 바로 진단해보세요.",
    };
  }
  if (m === 12 || m <= 2) {
    return {
      href: "/repair",
      badge: "동파 주의",
      detail: "한파엔 수도·보일러 동파가 잦아요. 이상하면 바로 확인하세요.",
    };
  }
  if (m >= 3 && m <= 5) {
    return {
      href: "/contract",
      badge: "이사철",
      detail: "봄 이사철엔 계약 전 독소조항 확인이 필수예요.",
    };
  }
  return {
    href: "/rent",
    badge: "이사철",
    detail: "가을 이사철엔 시세부터 확인하고 움직이세요.",
  };
}
