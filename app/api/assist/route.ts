import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { systemPromptFor } from "@/lib/prompts";
import { callClaudeJson } from "@/lib/llm";
import { validateForTopic } from "@/lib/validate";
import { weatherContextLine } from "@/lib/integrations/weather";
import { holidayContextLine } from "@/lib/integrations/holidays";
import { RATE_LIMIT_MESSAGE, rateLimited } from "@/lib/ratelimit";
import type {
  AssistResponse,
  AssistResult,
  Topic,
} from "@/lib/types";

// API 키는 서버에서만 사용 — 클라이언트 번들에 절대 노출되지 않습니다 (브리프 8/9장).
export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_TOPICS: Topic[] = ["repair", "admin", "utility"];
// 서버측 입력 상한 (v7 P4) — 클라 제한은 우회 가능하므로 이중 방어
const MAX_BODY_BYTES = 9 * 1024 * 1024; // 전체 요청 바디
const MAX_IMAGE_BASE64 = 7_500_000; // base64 문자 수 (≈ 5.6MB 원본)
const MAX_IMAGE_BYTES = 5.5 * 1024 * 1024; // 디코딩 후 바이트
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
type AllowedMedia = (typeof ALLOWED_MEDIA)[number];

// "data:image/png;base64,XXXX" → { media_type, data }
function parseDataUrl(
  dataUrl: string
): { media_type: AllowedMedia; data: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) return null;
  const media_type = m[1] as AllowedMedia;
  if (!ALLOWED_MEDIA.includes(media_type)) return null;
  return { media_type, data: m[2] };
}

export async function POST(req: NextRequest): Promise<NextResponse<AssistResponse>> {
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "요청이 너무 큽니다. 사진 용량을 줄여주세요." },
      { status: 413 }
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "서버에 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }

  let body: {
    topic?: string;
    text?: string;
    imageDataUrl?: string | null;
    disallowClarify?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const topic = body.topic as Topic;
  const text = (body.text || "").trim();
  const imageDataUrl = body.imageDataUrl;
  const disallowClarify = body.disallowClarify === true;

  // 비전(사진) 요청은 비용이 커서 별도 버킷으로 더 엄격하게 제한
  if (rateLimited(req, imageDataUrl ? "assist-image" : "assist")) {
    return NextResponse.json({ ok: false, error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  if (!VALID_TOPICS.includes(topic)) {
    return NextResponse.json({ ok: false, error: "알 수 없는 주제입니다." }, { status: 400 });
  }
  if (!text && !imageDataUrl) {
    return NextResponse.json(
      { ok: false, error: "상황을 한 줄로 적거나 사진을 올려주세요." },
      { status: 400 }
    );
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { ok: false, error: "내용이 너무 깁니다. 2000자 이내로 줄여주세요." },
      { status: 400 }
    );
  }

  // 사용자 메시지 구성 (멀티모달)
  const content: Anthropic.MessageParam["content"] = [];
  if (imageDataUrl) {
    if (typeof imageDataUrl !== "string" || imageDataUrl.length > MAX_IMAGE_BASE64) {
      return NextResponse.json(
        { ok: false, error: "사진이 너무 큽니다. 5MB 이하로 올려주세요." },
        { status: 413 }
      );
    }
    const parsed = parseDataUrl(imageDataUrl);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "지원하지 않는 이미지 형식입니다. (JPG/PNG/GIF/WEBP)" },
        { status: 400 }
      );
    }
    // 디코딩 후 실제 바이트 크기 검사 (base64 → bytes ≈ len * 3/4)
    if ((parsed.data.length * 3) / 4 > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "사진이 너무 큽니다. 5MB 이하로 올려주세요." },
        { status: 413 }
      );
    }
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: parsed.media_type,
        data: parsed.data,
      },
    });
  }
  content.push({
    type: "text",
    text: text || "사진 속 상황을 분석해 주세요.",
  });

  // system 분리 (v3 P6): 정적 본문은 프롬프트 캐싱, 요청별 맥락은 동적 블록
  const systemStatic = systemPromptFor(topic);
  const dynamicLines: string[] = [];
  if (topic === "repair") {
    const m = new Date().getMonth() + 1;
    const season =
      m === 12 || m <= 2 ? "겨울" : m <= 5 ? "봄(환절기)" : m <= 8 ? "여름·장마철" : "가을(환절기)";
    dynamicLines.push(
      `[현재 시기] 지금은 ${m}월(${season})입니다. 이 시기 특성을 진단·urgency·firstAction에 반영하세요.`
    );

    // 실황·공휴일 맥락 (v3 P5) — 키가 없거나 실패하면 조용히 생략
    const [weather, holiday] = await Promise.all([
      weatherContextLine().catch(() => null),
      holidayContextLine().catch(() => null),
    ]);
    if (weather) dynamicLines.push(`[실황 참고] ${weather}`);
    if (holiday) dynamicLines.push(`[일정 참고] ${holiday}`);
  }
  if (disallowClarify) {
    dynamicLines.push(
      "[중요] 사용자가 이미 추가 정보를 제공했습니다. 더 이상 되묻지 말고, 곧바로 최종 결과 JSON만 출력하세요."
    );
  }

  try {
    const call = await callClaudeJson({
      systemStatic,
      systemDynamic: dynamicLines.length > 0 ? dynamicLines.join("\n") : undefined,
      messages: [{ role: "user", content }],
      maxTokens: 2048,
      hasImage: !!imageDataUrl,
      validate: validateForTopic(topic),
    });
    if (!call) {
      return NextResponse.json(
        { ok: false, error: "결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const p = call.parsed;

    // 되묻기 — repair 에서만, 1회 한정 (disallowClarify면 무시)
    if (topic === "repair" && !disallowClarify && p.needsClarification === true) {
      const question =
        typeof p.clarifyingQuestion === "string" ? p.clarifyingQuestion : "";
      const chips = Array.isArray(p.clarifyingChips)
        ? (p.clarifyingChips.filter((c) => typeof c === "string") as string[])
        : [];
      if (question) {
        return NextResponse.json({ ok: true, clarify: { question, chips } });
      }
      // 질문이 비면 되묻기 무시하고 결과로 진행
    }

    // kind 보정 (모델이 누락할 경우 topic 기준으로 채움)
    const result = { kind: topic, ...p } as AssistResult;
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e?.status === 429) {
      return NextResponse.json(
        { ok: false, error: "지금 요청이 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    // 사용자 원문·사진이 섞일 수 있는 message 대신 상태 코드만 남긴다
    console.error("[assist] error status:", e?.status ?? "unknown");
    return NextResponse.json(
      { ok: false, error: "둥지가 잠시 응답하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
