"use client";

// /utility 허브 (v15) — 에어컨 요금 계산(기본) + 고지서·공과금 점검(기존 AI) 탭
// - ?h=... (최근 기록 링크) → 고지서 탭 자동 선택
// - ?tab=bill / ?tab=aircon 으로 탭 지정 가능, 전환 시 history.replaceState로 동기화
// - 두 패널 모두 마운트 유지(hidden)라 탭 전환에도 입력·결과 상태가 보존된다
import { useEffect, useRef, useState } from "react";
import AppBar from "@/components/AppBar";
import AssistWorkspace, { type TopicConfig } from "@/components/AssistWorkspace";
import AirconCostCalculator from "./AirconCostCalculator";

type Tab = "aircon" | "bill";

const TABS: { id: Tab; label: string }[] = [
  { id: "aircon", label: "에어컨 요금 계산" },
  { id: "bill", label: "고지서·공과금 점검" },
];

export default function UtilityHub({
  initialMonth,
  initialTab = "aircon",
  billConfig,
}: {
  initialMonth: number;
  initialTab?: Tab;
  billConfig: TopicConfig;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 초기 탭은 서버(searchParams)에서 받아 첫 페인트부터 반영.
  // 클라이언트 내비게이션 등으로 prop이 어긋나는 경우를 위한 폴백 동기화.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("h") || params.get("tab") === "bill") setTab("bill");
    else if (params.get("tab") === "aircon") setTab("aircon");
  }, []);

  function switchTab(next: Tab) {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      // 기록 열기용 h는 탭을 떠날 때 정리 (새로고침 시 재진입 방지)
      if (next === "aircon") url.searchParams.delete("h");
      window.history.replaceState(null, "", url.toString());
    } catch {
      // URL 조작 실패는 무시 (탭 상태는 이미 반영됨)
    }
  }

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (index + dir + TABS.length) % TABS.length;
    switchTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <main className="min-h-dvh pb-16">
      <AppBar title="전기요금 계산" />
      <div className="container-app pt-3">
        <p className="px-1 text-[13px] font-medium text-muted">
          에어컨을 얼마나 틀면 전기요금이 더 나올지 미리 계산해보세요.
        </p>
        <p className="px-1 text-[12px] text-muted">
          종류·냉방 평수·사용시간만 골라도 바로 볼 수 있어요.
        </p>
      </div>

      {/* 탭 */}
      <div className="container-app pt-4">
        <div
          role="tablist"
          aria-label="전기요금 도구"
          className="grid grid-cols-2 rounded-2xl bg-[#F0F2F0] p-1"
        >
          {TABS.map((t, i) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`utility-tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`utility-panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => switchTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={`min-h-[44px] rounded-xl px-3 py-2.5 text-[13px] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  selected ? "bg-card font-bold text-ink shadow-card" : "font-semibold text-muted"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 패널 — 둘 다 마운트 유지, 비활성은 hidden */}
      <div
        role="tabpanel"
        id="utility-panel-aircon"
        aria-labelledby="utility-tab-aircon"
        hidden={tab !== "aircon"}
        className="container-app pt-5"
      >
        <AirconCostCalculator initialMonth={initialMonth} />
      </div>
      <div
        role="tabpanel"
        id="utility-panel-bill"
        aria-labelledby="utility-tab-bill"
        hidden={tab !== "bill"}
      >
        <AssistWorkspace config={billConfig} embedded />
      </div>
    </main>
  );
}
