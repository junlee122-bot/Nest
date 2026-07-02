"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X, ChevronRight, Wrench, ClipboardList, Zap, type LucideIcon } from "lucide-react";
import {
  getHistory,
  removeHistory,
  clearHistory,
  type HistoryEntry,
} from "@/lib/history";
import type { Topic } from "@/lib/types";

const TOPIC_META: Record<Topic, { icon: LucideIcon; label: string; cls: string }> = {
  repair: { icon: Wrench, label: "집 수리", cls: "bg-brand-tint text-brand-deep" },
  admin: { icon: ClipboardList, label: "이사·행정", cls: "bg-sun-tint text-sun-deep" },
  utility: { icon: Zap, label: "공과금", cls: "bg-coral-tint text-coral-deep" },
};

export default function RecentProblems() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(getHistory());
    setReady(true);
  }, []);

  // 기록이 없으면 영역 자체를 숨김 (빈 화면 방지)
  if (!ready || items.length === 0) return null;

  return (
    <section className="container-app pt-8">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <Clock size={15} className="text-muted" /> 최근 본 문제
        </h3>
        <button
          type="button"
          onClick={() => {
            clearHistory();
            setItems([]);
          }}
          className="text-xs font-medium text-muted hover:text-brand"
        >
          기록 지우기
        </button>
      </div>

      <ul className="space-y-2">
        {items.map((it) => {
          const meta = TOPIC_META[it.topic];
          return (
            <li key={it.id} className="card flex items-center gap-2 p-3">
              <Link
                href={`/${it.topic}?h=${it.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.cls}`}>
                  <meta.icon size={17} strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{it.title}</p>
                  <p className="text-xs text-muted">{meta.label}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-line" />
              </Link>
              <button
                type="button"
                aria-label="기록 삭제"
                onClick={() => setItems(removeHistory(it.id))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink"
              >
                <X size={16} />
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 px-1 text-xs leading-relaxed text-muted">
        이 기록은 이 기기에만 저장되며 서버로 전송되지 않습니다.
      </p>
    </section>
  );
}
