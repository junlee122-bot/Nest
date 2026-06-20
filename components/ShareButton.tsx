"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

// Web Share API → 미지원 시 클립보드 복사 폴백
export default function ShareButton({
  text,
  label = "공유",
  className = "btn-ghost text-sm",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "둥지 Nest", text, url });
        return;
      } catch {
        // 취소/실패 → 복사 폴백
      }
    }
    const payload = `${text}\n${url}`;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? (
        <>
          <Check size={15} className="text-brand" /> 복사됨
        </>
      ) : (
        <>
          <Share2 size={15} /> {label}
        </>
      )}
    </button>
  );
}
