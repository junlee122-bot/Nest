"use client";

// 에어컨 종류 카드형 라디오 (v15) — fieldset/legend + 실제 radio input(sr-only)
import { AirVent, Check, Fan, Layers, Luggage, PanelTop, type LucideIcon } from "lucide-react";
import type { AirconType, MultiMode } from "@/lib/electricity";

const TYPES: { id: AirconType; label: string; hint: string; icon: LucideIcon }[] = [
  { id: "wall", label: "벽걸이형", hint: "원룸·작은 방", icon: AirVent },
  { id: "standing", label: "스탠드형", hint: "거실·넓은 공간", icon: Fan },
  { id: "window", label: "창문형", hint: "창문에 설치", icon: PanelTop },
  { id: "portable", label: "이동식", hint: "배기 호스 사용", icon: Luggage },
  { id: "multi", label: "2 in 1·멀티형", hint: "실외기 하나, 실내기 여러 대", icon: Layers },
];

const MULTI_MODES: { id: MultiMode; label: string }[] = [
  { id: "standingOnly", label: "스탠드만 사용" },
  { id: "wallOnly", label: "벽걸이만 사용" },
  { id: "both", label: "둘 다 사용" },
];

export default function AirconTypeSelector({
  value,
  onChange,
  multiMode,
  onMultiModeChange,
}: {
  value: AirconType | null;
  onChange: (t: AirconType) => void;
  multiMode: MultiMode;
  onMultiModeChange: (m: MultiMode) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">에어컨 종류</legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const selected = value === t.id;
          return (
            <label
              key={t.id}
              className={`relative flex min-h-[56px] cursor-pointer items-center gap-2.5 rounded-2xl border p-3 transition last:col-span-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                selected
                  ? "border-brand/50 bg-brand-tint"
                  : "border-line bg-card hover:border-brand/30"
              }`}
            >
              <input
                type="radio"
                name="aircon-type"
                value={t.id}
                checked={selected}
                onChange={() => onChange(t.id)}
                className="sr-only"
              />
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  selected ? "bg-white/80 text-brand" : "bg-bg text-muted"
                }`}
              >
                <Icon size={19} strokeWidth={2.2} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={`block text-[14px] font-bold ${selected ? "text-brand-deep" : "text-ink"}`}>
                  {t.label}
                </span>
                <span className="block text-[12px] leading-snug text-muted">{t.hint}</span>
              </span>
              {selected && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                  <Check size={13} strokeWidth={3} aria-hidden />
                </span>
              )}
            </label>
          );
        })}
      </div>

      {value === "multi" && (
        <div className="mt-2.5">
          <p id="aircon-multi-mode-label" className="text-xs font-semibold text-muted">
            어떻게 사용하세요?
          </p>
          <div
            className="mt-1.5 flex flex-wrap gap-1.5"
            role="radiogroup"
            aria-labelledby="aircon-multi-mode-label"
          >
            {MULTI_MODES.map((m) => {
              const selected = multiMode === m.id;
              return (
                <label
                  key={m.id}
                  className={`flex min-h-[40px] cursor-pointer items-center rounded-xl border px-3 py-2 text-[13px] transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                    selected
                      ? "border-brand/50 bg-brand-tint font-bold text-brand-deep"
                      : "border-line bg-card font-medium text-muted hover:border-brand/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="aircon-multi-mode"
                    value={m.id}
                    checked={selected}
                    onChange={() => onMultiModeChange(m.id)}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </fieldset>
  );
}
