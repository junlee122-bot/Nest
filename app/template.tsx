"use client";

// 페이지 전환 페이드 (v5) — 라우트가 바뀔 때마다 remount 되어 은은하게 등장.
// 주의: transform(y 이동)을 쓰면 페이지 내부의 fixed 요소(액션바·오버레이)가
// transform 컨테이닝 블록에 갇히므로 opacity만 애니메이션한다.
import { m } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      {children}
    </m.div>
  );
}
