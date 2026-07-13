// 모델번호·검색결과 텍스트 정규화 (v16) — 순수 함수, 단위 테스트 대상

/** HTML 태그 제거 + 기본 엔티티 디코드 (네이버 검색 title에 <b> 등이 섞여 온다) */
export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 모델번호 비교용 정규화 — 대문자화 후 공백·하이픈·특수문자 제거.
 * 원본 문자열은 호출부에서 따로 보존한다 (표시는 원본, 비교는 정규화).
 */
export function normalizeModelNumber(s: string | null | undefined): string {
  if (!s) return "";
  return s.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** 정규화 기준 완전 일치 */
export function modelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeModelNumber(a);
  const nb = normalizeModelNumber(b);
  return na.length > 0 && na === nb;
}

/** 한쪽이 다른 쪽을 포함하는 부분 일치 (완전 일치는 제외) */
export function modelsPartialMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const na = normalizeModelNumber(a);
  const nb = normalizeModelNumber(b);
  if (!na || !nb || na === nb) return false;
  // 짧은 쪽이 4자 미만이면 우연 일치가 많아 무시
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  return short.length >= 4 && long.includes(short);
}

// 시리얼/제조번호 패턴 — 반환 데이터·로그에서 제거한다.
// "S/N", "S.N.", "Serial No.:", "제조번호(S/N):", "시리얼" 뒤의 값 토큰을 마스킹.
// 규칙:
// - 마커와 값 사이 구분자는 [^영숫자·한글] 0~8자 허용 ("No.: ", "). " 등 복합 구두점 대응)
// - "SN"은 단어 경계(\b)로 끝나야 마커 — "SNC-5000W" 같은 SN 접두 모델번호는 건드리지 않음
// - 한글 마커(제조번호 등)는 \b가 동작하지 않아 별도 패턴으로 분리
const SERIAL_PATTERNS: RegExp[] = [
  /(?:serial\s*(?:no|number)?|s[./]?n)\b[^A-Za-z0-9가-힣]{0,8}[A-Za-z0-9-]{4,}/gi,
  /(?:시리얼(?:\s*번호|\s*넘버)?|제조\s*번호)[^A-Za-z0-9가-힣]{0,8}[A-Za-z0-9-]{4,}/g,
];

/** 문자열에서 시리얼 번호를 마스킹 (마커는 남기고 값만 치환) */
export function scrubSerial(s: string): string {
  let out = s;
  for (const p of SERIAL_PATTERNS) {
    out = out.replace(p, (m) => m.replace(/[A-Za-z0-9-]{4,}\s*$/, "(제거됨)"));
  }
  return out;
}

/** 문자열 배열 전체에 시리얼 마스킹 적용 */
export function scrubSerials(list: string[]): string[] {
  return list.map(scrubSerial);
}
