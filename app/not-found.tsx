import Link from "next/link";
import NestMark from "@/components/NestMark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <NestMark size={56} className="text-brand/70" />
      <h1 className="mt-4 text-xl font-bold text-ink">길을 잃으셨나요?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        찾으시는 페이지가 없어요. 둥지 홈에서 다시 시작해볼까요?
      </p>
      <Link href="/" className="btn-primary mt-6">
        홈으로 가기
      </Link>
    </main>
  );
}
