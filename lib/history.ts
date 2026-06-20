// 최근 기록 — localStorage 전용. 서버 전송·수집 없음. 사진은 저장하지 않음.
import type { AssistResult, Topic } from "./types";

const KEY = "nest:history:v1";
const MAX = 5;

export interface HistoryEntry {
  id: string;
  topic: Topic;
  title: string; // 사용자 입력 요약 (텍스트만)
  createdAt: number;
  result: AssistResult; // 사진 제외, 결과 텍스트만
}

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(
  entry: Omit<HistoryEntry, "id" | "createdAt">
): HistoryEntry {
  const item: HistoryEntry = { ...entry, id: genId(), createdAt: Date.now() };
  save([item, ...getHistory()].slice(0, MAX));
  return item;
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return getHistory().find((e) => e.id === id) ?? null;
}

export function removeHistory(id: string): HistoryEntry[] {
  const next = getHistory().filter((e) => e.id !== id);
  save(next);
  return next;
}

export function clearHistory() {
  save([]);
}

// 입력 텍스트 → 짧은 제목
export function deriveTitle(text: string): string {
  const first = (text || "").split("\n")[0].trim();
  if (!first) return "사진으로 문의";
  return first.length > 40 ? first.slice(0, 40) + "…" : first;
}

function save(list: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* 용량 초과 등은 조용히 무시 */
  }
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
