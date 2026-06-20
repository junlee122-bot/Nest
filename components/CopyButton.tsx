"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({
  text,
  label = "복사하기",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한 폴백
      const ta = document.createElement("textarea");
      ta.value = text;
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
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className="btn-ghost text-sm"
    >
      {copied ? (
        <>
          <Check size={16} className="text-brand" /> 복사됨
        </>
      ) : (
        <>
          <Copy size={16} /> {label}
        </>
      )}
    </button>
  );
}
