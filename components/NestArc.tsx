// 둥지 아크 — 로고의 둥지 그릇 곡선을 승격한 시스템 시그니처 (v3 P4)
// 섹션 라벨 밑줄·히어로 받침 등에 쓴다. currentColor (기본은 text-straw 권장).
export default function NestArc({
  width = 44,
  className = "",
}: {
  width?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={Math.round(width * 0.3)}
      viewBox="0 0 56 17"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 2c0 8 11 13 26 13s26-5 26-13"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
