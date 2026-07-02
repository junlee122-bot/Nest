"use client";

// 상단 앱바 (v5) — 네이티브 내비게이션 바 감각
// sticky 뒤로가기 + 타이틀. 기능 페이지 공용.
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function AppBar({
  title,
  right,
}: {
  title: string;
  /** 우측 슬롯 (배지 등) */
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="appbar no-print">
      <div className="container-app flex h-[52px] items-center gap-1">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/");
          }}
          aria-label="뒤로"
          className="-ml-2.5 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-bg active:scale-95"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="min-w-0 flex-1 truncate font-sans text-[17px] font-bold text-ink">
          {title}
        </h1>
        {right ?? (
          <Link href="/" className="text-[13px] font-semibold text-muted hover:text-ink">
            홈
          </Link>
        )}
      </div>
    </div>
  );
}
