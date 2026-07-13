// 표시용 포맷 헬퍼 — 엔진은 10원 단위까지 정확히 계산하지만,
// 사용자에게 보여줄 "추정 금액"은 1,000원 단위로 반올림해 과신을 막는다.

const nf = new Intl.NumberFormat("ko-KR");

export function formatWon(value: number): string {
  return `${nf.format(Math.round(value))}원`;
}

/** 1,000원 단위 반올림한 근사 표기. 0원과 1,000원 미만을 구분해 표시 */
export function formatWonApprox(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0원";
  const rounded = Math.round(value / 1000) * 1000;
  if (rounded === 0) return "1,000원 미만";
  return `약 ${nf.format(rounded)}원`;
}

/** 낮음~높음 범위 표기. 반올림 후 같아지면 단일 값으로 정리 */
export function formatWonRange(low: number, high: number): string {
  const l = Math.round(Math.max(0, low) / 1000) * 1000;
  const h = Math.round(Math.max(0, high) / 1000) * 1000;
  if (l === h) return formatWonApprox(high);
  return `${nf.format(l)}~${nf.format(h)}원`;
}

/** 작은 단위(하루·시간당)는 100원 단위 반올림 */
export function formatWonApproxSmall(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0원";
  const rounded = Math.round(value / 100) * 100;
  if (rounded === 0) return "100원 미만";
  return `약 ${nf.format(rounded)}원`;
}

export function formatKwh(value: number): string {
  if (!Number.isFinite(value)) return "0kWh";
  return `${nf.format(Math.round(value * 10) / 10)}kWh`;
}

export function formatKw(value: number): string {
  if (!Number.isFinite(value)) return "0kW";
  return `약 ${(Math.round(value * 100) / 100).toFixed(2)}kW`;
}
