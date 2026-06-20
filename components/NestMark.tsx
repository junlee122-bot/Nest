// 둥지 마스코트 — 둥지에 안긴 작은 새/알 모티프 (인라인 SVG, 의존성 없음)
// currentColor 를 사용하므로 text-brand 등으로 색을 입힐 수 있습니다.
export default function NestMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* 둥지 (그릇) */}
      <path
        d="M5 29c0 7.5 8.5 13 19 13s19-5.5 19-13"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* 둥지 잔가지 결 */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45">
        <path d="M7 30c2.5-2 6-2.5 9-1.5" />
        <path d="M41 30c-2.5-2-6-2.5-9-1.5" />
        <path d="M16 31.5c2-1.8 5-1.8 7-0.6" />
        <path d="M25 31c2-1.8 5-1.8 7-0.6" />
      </g>
      {/* 알/새 몸통 */}
      <circle cx="24" cy="21" r="9.5" fill="currentColor" opacity="0.16" />
      <circle cx="24" cy="21" r="9.5" stroke="currentColor" strokeWidth="3" />
      {/* 눈 + 부리 */}
      <circle cx="21" cy="20" r="1.5" fill="currentColor" />
      <path d="M28 21l4.5 1.6L28 24.2z" fill="currentColor" />
    </svg>
  );
}
