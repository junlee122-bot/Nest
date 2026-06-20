"use client";

import { useEffect, useState } from "react";
import { Camera, Sparkles, Send, X } from "lucide-react";
import NestMark from "./NestMark";

const KEY = "nest:onboarded:v1";

const steps = [
  { icon: Camera, title: "사진·한 줄로 입력", desc: "곰팡이·누수 등 문제를 찍거나 적어요" },
  { icon: Sparkles, title: "AI가 3단 진단", desc: "응급처치 · 책임 판단 · 집주인 문구" },
  { icon: Send, title: "바로 복사·전송", desc: "집주인에게 보낼 문구를 그대로 사용" },
];

export default function Onboarding() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* noop */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* noop */
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="둥지 사용법"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-app animate-fade-up rounded-2xl bg-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NestMark size={28} className="text-brand" />
            <span className="font-extrabold text-ink">
              둥지<span className="ml-1 text-xs font-semibold text-muted">Nest</span>
            </span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-muted">
          혼자 살아도 든든하게. 세 단계면 끝나요.
        </p>

        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                <s.icon size={20} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{s.title}</p>
                <p className="text-xs text-muted">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          로그인·회원가입 없이 바로 사용 · 입력은 저장하지 않아요
        </p>

        <button type="button" onClick={dismiss} className="btn-primary mt-3 w-full">
          시작하기
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full text-center text-xs font-medium text-muted hover:text-ink"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
