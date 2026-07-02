// 둥지 키우기 (v3 P7, 선택 기능) — 클라이언트 전용
//
// 집을 돌보는 행동(진단·체크리스트 완료·계약서 검토 등)마다 '잔가지'가 쌓여
// 둥지가 튼튼해진다. 무로그인·무DB 원칙 그대로 — localStorage 에만 저장.
// 같은 행동은 하루 1회만 인정(포인트 파밍 방지).

export type GrowthKind = "diagnose" | "steps_done" | "contract" | "grocery" | "rent";

const POINTS: Record<GrowthKind, number> = {
  diagnose: 2, // 집 문제 진단 받기
  steps_done: 3, // 다음 단계 체크리스트 전부 완료
  contract: 2, // 계약서 검토
  grocery: 1, // 장보기 플랜/재료 소진
  rent: 1, // 시세 확인
};

export const LEVELS = [
  { min: 0, name: "빈 나뭇가지", desc: "이제 막 시작한 둥지예요" },
  { min: 3, name: "엉성한 둥지", desc: "잔가지가 모이기 시작했어요" },
  { min: 8, name: "포근한 둥지", desc: "제법 둥지다워졌어요" },
  { min: 15, name: "튼튼한 둥지", desc: "웬만한 비바람은 끄떡없어요" },
  { min: 25, name: "완성된 둥지", desc: "혼자 살아도, 든든하게!" },
] as const;

const KEY = "nest:growth:v1";

interface GrowthState {
  points: number;
  // 행동별 마지막 적립 날짜 (YYYY-MM-DD) — 하루 1회 제한
  last: Partial<Record<GrowthKind, string>>;
}

function load(): GrowthState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as GrowthState;
      if (typeof s.points === "number" && s.points >= 0) {
        return { points: s.points, last: s.last ?? {} };
      }
    }
  } catch {
    /* noop */
  }
  return { points: 0, last: {} };
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 행동 적립 — 같은 kind 는 하루 1회만. 적립되면 true */
export function addGrowth(kind: GrowthKind): boolean {
  if (typeof window === "undefined") return false;
  const s = load();
  const t = today();
  if (s.last[kind] === t) return false;
  s.points += POINTS[kind];
  s.last[kind] = t;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new CustomEvent("nest:growth"));
  } catch {
    /* noop */
  }
  return true;
}

export interface GrowthView {
  points: number;
  level: number; // 0-based
  name: string;
  desc: string;
  /** 다음 레벨까지 진행률 0~1 (최고 레벨이면 1) */
  progress: number;
  nextAt: number | null;
}

export function getGrowth(): GrowthView {
  const points = typeof window === "undefined" ? 0 : load().points;
  let level = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) {
      level = i;
      break;
    }
  }
  const cur = LEVELS[level];
  const next = LEVELS[level + 1] ?? null;
  return {
    points,
    level,
    name: cur.name,
    desc: cur.desc,
    progress: next ? Math.min(1, (points - cur.min) / (next.min - cur.min)) : 1,
    nextAt: next ? next.min : null,
  };
}
