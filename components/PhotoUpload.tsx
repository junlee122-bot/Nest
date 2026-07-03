"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

const MAX_DIM = 1568; // 비전 입력 권장 상한 — 다운스케일로 토큰/용량 절약
const MAX_BYTES = 5 * 1024 * 1024;

export default function PhotoUpload({
  value,
  onChange,
  label = "사진 올리기 (선택)",
  hint = "곰팡이·누수 등 상태가 보이면 진단이 정확해져요",
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setFileError("사진은 JPG·PNG·WebP 같은 이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError("사진은 5MB 이하만 올릴 수 있어요. 용량을 줄여 다시 시도해주세요.");
      return;
    }
    setFileError(null);
    try {
      const dataUrl = await downscale(file);
      onChange(dataUrl);
    } catch {
      setFileError("사진을 읽지 못했어요. 다른 사진으로 다시 시도해주세요.");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-2xl border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="업로드한 사진 미리보기" className="max-h-64 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="사진 삭제"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur transition hover:bg-black/80"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-bg py-7 text-muted transition-all hover:border-brand/60 hover:text-brand-deep active:scale-[0.99]"
        >
          <ImagePlus size={26} />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted">{hint}</span>
        </button>
      )}
      {fileError && (
        <p role="alert" className="mt-2 text-[13px] font-medium leading-relaxed text-danger">
          {fileError}
        </p>
      )}
    </div>
  );
}

// canvas 로 긴 변 MAX_DIM 으로 축소 + JPEG 인코딩
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
