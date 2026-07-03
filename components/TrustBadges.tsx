// 신뢰 배지 (쇼케이스·전체 탭 공용) — 서비스가 실제로 지키는 원칙만 적는다.
import { ShieldCheck, FileLock2, KeyRound, Database, Scale } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "사진 저장 안 함" },
  { icon: FileLock2, label: "계약서 원문 저장 안 함" },
  { icon: KeyRound, label: "API 키 서버 전용" },
  { icon: Database, label: "공공데이터 출처 표시" },
  { icon: Scale, label: "법적 자문 아님" },
];

export default function TrustBadges({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <ul className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      {BADGES.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${
            dark
              ? "border border-white/15 bg-white/10 text-white/70"
              : "border border-line bg-card text-muted"
          }`}
        >
          <Icon size={13} aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
