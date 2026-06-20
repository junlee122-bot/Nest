"use client";

import { useEffect } from "react";
import Link from "next/link";
import NestMark from "@/components/NestMark";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 상세 에러는 콘솔에만 (민감정보 노출 방지)
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <NestMark size={56} className="text-brand/70" />
      <h1 className="mt-4 text-xl font-bold text-ink">잠시 문제가 생겼어요</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        둥지가 잠깐 멈췄어요. 다시 시도하거나 홈으로 돌아가 주세요.
      </p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="btn-primary">
          다시 시도
        </button>
        <Link href="/" className="btn-ghost">
          홈으로
        </Link>
      </div>
    </main>
  );
}
