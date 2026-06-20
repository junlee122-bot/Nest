import { AlertTriangle, PhoneCall } from "lucide-react";
import type { SafetyInfo } from "@/lib/types";
import { CONTACTS_VERIFIED } from "@/lib/contacts";

// 안전 경고 배너 — 브랜드 레드와 충돌 피하려 앰버/진한레드 사용 (브리프 4·7-2)
export default function SafetyBanner({ safety }: { safety: SafetyInfo }) {
  if (!safety || safety.level === "none" || !safety.message) return null;

  const danger = safety.level === "danger";

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-danger/30 bg-danger-tint"
          : "border-warn/40 bg-warn-tint"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={22}
          className={`mt-0.5 shrink-0 ${danger ? "text-danger" : "text-warn"}`}
        />
        <div className="space-y-2">
          <p
            className={`text-sm font-bold ${
              danger ? "text-danger" : "text-[#9A6B00]"
            }`}
          >
            {danger ? "⚠ 위험 — 직접 손대지 마세요" : "주의가 필요해요"}
          </p>
          <p className="text-sm leading-relaxed text-ink">{safety.message}</p>
          {safety.contacts && safety.contacts.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 pt-1">
                {safety.contacts.map((c, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      danger
                        ? "bg-danger text-white"
                        : "bg-white text-[#9A6B00] ring-1 ring-warn/40"
                    }`}
                  >
                    <PhoneCall size={13} /> {c}
                  </span>
                ))}
              </div>
              <p className="pt-0.5 text-[11px] text-muted">
                연락처는 변경될 수 있어요 ({CONTACTS_VERIFIED}, 최신 확인 권장).
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
