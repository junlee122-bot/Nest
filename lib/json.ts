// 모델이 JSON 외 텍스트를 섞어도 안전하게 객체를 추출 (파싱 폴백)
export function extractJson(text: string): unknown | null {
  const trimmed = (text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
