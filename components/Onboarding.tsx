"use client";

import { useEffect, useState } from "react";
import { Camera, Sparkles, Send, X } from "lucide-react";
import NestMark from "./NestMark";
import Doongi from "./mascot/Doongi";

const KEY = "nest:onboarded:v1";

const steps = [
  {
    icon: Camera,
    title: "사진 한 장, 한 줄이면 돼요",
    desc: "곰팡이, 누수 같은 문제를 찍거나 적어요",
    cls: "bg-brand-tint text-brand-deep",
    num: "bg-brand",
  },
  {
    icon: Sparkles,
    title: "둥이가 3단으로 정리해요",
    desc: "응급처치, 책임 판단, 집주인 문구까지",
    cls: "bg-sun-tint text-sun-deep",
    num: "bg-sun",
  },
  {
    icon: Send,
    title: "그대로 복사해서 보내요",
    desc: "집주인에게 보낼 문구를 바로 사용",
    cls: "bg-coral-tint text-coral-deep",
    num: "bg-coral",
  },
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

  // ESC로 닫기 (키보드 사용자)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

        <div className="mb-2 flex justify-center">
          <Doongi mood="hello" size={108} />
        </div>
        <p className="mb-4 text-center text-sm leading-relaxed text-muted">
          안녕하세요, 둥이예요! 세 가지만 알면 바로 쓸 수 있어요.
        </p>

        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-center gap-3">
              <span
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${s.cls}`}
              >
                <s.icon size={20} />
                <span
                  className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white ${s.num}`}
                >
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
