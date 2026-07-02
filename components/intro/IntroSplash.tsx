"use client";

// 인트로 스플래시 (v3 P4) — 세션당 1회, 아무 곳이나 누르면 즉시 스킵
// - reduced-motion 사용자는 스플래시 자체를 건너뜀 (접근성)
// - 자동 종료 ~1.9s. 로그인·추적 없음: sessionStorage 플래그만 사용
import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import Doongi from "../mascot/Doongi";
import NestArc from "../NestArc";

const KEY = "nest:intro:v1";

export default function IntroSplash() {
  const [show, setShow] = useState(false);
  const reduced = useReducedMotion();

  // 플래그는 '닫힐 때' 기록한다 — 마운트 시점에 기록하면 StrictMode의
  // 이중 이펙트 실행에서 두 번째 실행이 조기 return 되어 타이머가 사라지고
  // 스플래시가 영구히 남는 버그가 생긴다.
  function dismiss() {
    setShow(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    let seen = true;
    try {
      seen = !!sessionStorage.getItem(KEY);
    } catch {
      seen = true; // storage 불가 환경이면 매번 뜨는 것보다 안 뜨는 쪽을 택함
    }
    if (seen || reduced) return;
    setShow(true);
    const t = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {
        /* noop */
      }
    }, 1900);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <AnimatePresence>
      {show && (
        <m.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          onClick={dismiss}
          className="aurora-bg fixed inset-0 z-[60] flex cursor-pointer flex-col items-center justify-center"
          role="presentation"
          aria-label="둥지 인트로 — 눌러서 건너뛰기"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative flex flex-col items-center"
          >
            {/* 컬러 도트 — 멀티컬러 무드 */}
            <span aria-hidden className="absolute -left-10 top-6 h-3 w-3 rounded-full bg-sun" />
            <span aria-hidden className="absolute -right-8 top-0 h-2.5 w-2.5 rounded-full bg-coral" />
            <span aria-hidden className="absolute -right-12 top-16 h-2 w-2 rounded-full bg-sky" />
            <span aria-hidden className="absolute -left-6 -top-3 h-2 w-2 rounded-full bg-brand" />
            <Doongi
              mood="hello"
              size={160}
              className="drop-shadow-[0_14px_18px_rgba(96,72,38,0.2)]"
            />
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
              둥지<span className="ml-1.5 text-base font-medium text-muted">Nest</span>
            </p>
            <p className="mt-1 text-sm font-bold text-brand-deep">
              혼자 살아도, 든든하게
            </p>
            <NestArc width={56} className="mt-3 text-straw" />
          </m.div>
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="absolute bottom-10 text-xs text-muted"
          >
            눌러서 건너뛰기
          </m.p>
        </m.div>
      )}
    </AnimatePresence>
  );
}
