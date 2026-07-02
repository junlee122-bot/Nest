"use client";

// 앱 전역 모션 컨텍스트 (v3 P1 → v5)
// - LazyMotion(domMax): m.* 전용(strict). 탭바 인디케이터의 layoutId 공유 전환에
//   레이아웃 애니메이션이 필요해 domAnimation → domMax로 승격
// - MotionConfig reducedMotion="user": 시스템 '동작 줄이기' 설정 시
//   transform/레이아웃 애니메이션 자동 비활성 (접근성 가드레일)
import { LazyMotion, MotionConfig, domMax } from "framer-motion";

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
