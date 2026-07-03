// 모델이 JSON 외 텍스트를 섞어도 안전하게 객체를 추출 (파싱 폴백)
//
// v7 P4: '첫 { ~ 마지막 }' 절단 방식은 뒤에 다른 중괄호 텍스트가 붙으면 깨진다.
// → 문자열/이스케이프를 인지하는 균형 괄호(balanced-brace) 스캐너로 교체.
//   전체 파싱 → 균형 스캔(모든 후보) 순으로 시도한다.

// text[start]가 '{'라는 전제 아래, 문자열·이스케이프를 인지하며
// 균형이 맞는 닫는 위치를 찾는다. 못 찾으면 -1.
function scanBalanced(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function extractJson(text: string): unknown | null {
  const trimmed = (text || "").trim();
  if (!trimmed) return null;

  // 1) 전체가 JSON인 이상적 케이스
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // 2) 균형 괄호 스캔 — 앞쪽 후보부터, 파싱 실패 시 다음 '{'로 이동
  let from = trimmed.indexOf("{");
  while (from !== -1) {
    const end = scanBalanced(trimmed, from);
    if (end === -1) break;
    try {
      return JSON.parse(trimmed.slice(from, end + 1));
    } catch {
      from = trimmed.indexOf("{", from + 1);
    }
  }
  return null;
}
