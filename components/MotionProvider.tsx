"use client";

// 앱 전역 모션 컨텍스트 (v3 P1)
// - LazyMotion(domAnimation): m.* 컴포넌트만 허용(strict) → 초기 번들 최소화
// - MotionConfig reducedMotion="user": 시스템 '동작 줄이기' 설정 시
//   transform/레이아웃 애니메이션 자동 비활성 (접근성 가드레일)
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
