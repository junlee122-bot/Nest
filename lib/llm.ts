// 공통 Claude 호출 헬퍼 (v3 P6) — 서버 전용
//
// 응답 튜닝 4종을 한곳에 모은다:
// 1) 모델 라우팅 — 이미지 포함 요청은 ANTHROPIC_MODEL(비전),
//    텍스트 전용은 ANTHROPIC_MODEL_TEXT(설정 시)로 보내 비용·속도 최적화
// 2) 프롬프트 캐싱 — 긴 정적 system 블록에 cache_control(ephemeral).
//    동적 맥락(계절·실황 등)은 별도 블록으로 분리해 캐시 적중 유지
// 3) temperature 0.2 — 사실·법령 판단 위주라 낮게 고정(창의성 불필요)
// 4) JSON 검증 + 1회 재시도 — 파싱/최소 스키마 실패 시 교정 지시로 한 번만 재요청

import Anthropic from "@anthropic-ai/sdk";
import { extractJson } from "./json";

const DEFAULT_MODEL = "claude-opus-4-8";

export function routeModel(hasImage: boolean): string {
  const vision = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  if (hasImage) return vision;
  return process.env.ANTHROPIC_MODEL_TEXT || vision;
}

export interface JsonCallOptions {
  /** 정적 system(캐시됨) — 프롬프트 본문. 요청마다 달라지는 내용 금지 */
  systemStatic: string;
  /** 동적 system(캐시 안 됨) — 계절·실황·되묻기 금지 등 요청별 맥락 */
  systemDynamic?: string;
  messages: Anthropic.MessageParam[];
  maxTokens: number;
  hasImage?: boolean;
  temperature?: number;
  /** 최소 스키마 검사 — false 반환 시 1회 재시도 */
  validate?: (parsed: Record<string, unknown>) => boolean;
}

export interface JsonCallResult {
  parsed: Record<string, unknown>;
  /** 재시도가 발생했는지 (관측용) */
  retried: boolean;
}

/**
 * JSON 출력을 기대하는 Claude 호출. 파싱/검증 실패 시 1회 재시도.
 * 재시도까지 실패하면 null. (429 등 API 에러는 그대로 throw — 라우트에서 처리)
 */
export async function callClaudeJson(
  opts: JsonCallOptions
): Promise<JsonCallResult | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = routeModel(!!opts.hasImage);

  const system: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: opts.systemStatic,
      cache_control: { type: "ephemeral" },
    },
  ];
  if (opts.systemDynamic) {
    system.push({ type: "text", text: opts.systemDynamic });
  }

  async function attempt(extra?: Anthropic.MessageParam[]) {
    const message = await client.messages.create({
      model,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.2,
      system,
      messages: [...opts.messages, ...(extra ?? [])],
    });
    const raw = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return { raw, parsed: extractJson(raw) };
  }

  const isValid = (p: unknown): p is Record<string, unknown> =>
    p !== null &&
    typeof p === "object" &&
    !Array.isArray(p) &&
    (!opts.validate || opts.validate(p as Record<string, unknown>));

  const first = await attempt();
  if (isValid(first.parsed)) return { parsed: first.parsed, retried: false };

  // 1회 재시도 — 직전 출력을 assistant 턴으로 보여주고 JSON만 다시 요구
  const second = await attempt([
    { role: "assistant", content: first.raw.slice(0, 4000) || "(빈 응답)" },
    {
      role: "user",
      content:
        "위 출력은 유효한 JSON이 아니거나 필수 필드가 빠졌습니다. 사과·설명 없이, 요구된 스키마를 정확히 지킨 JSON 객체 하나만 다시 출력하세요.",
    },
  ]);
  if (isValid(second.parsed)) return { parsed: second.parsed, retried: true };
  return null;
}
