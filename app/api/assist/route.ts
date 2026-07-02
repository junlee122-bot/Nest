import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { systemPromptFor } from "@/lib/prompts";
import { extractJson } from "@/lib/json";
import { weatherContextLine } from "@/lib/integrations/weather";
import { holidayContextLine } from "@/lib/integrations/holidays";
import type {
  AssistResponse,
  AssistResult,
  Topic,
} from "@/lib/types";

// API 키는 서버에서만 사용 — 클라이언트 번들에 절대 노출되지 않습니다 (브리프 8/9장).
export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const VALID_TOPICS: Topic[] = ["repair", "admin", "utility"];
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
    const parsed = parseDataUrl(imageDataUrl);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "지원하지 않는 이미지 형식입니다. (JPG/PNG/GIF/WEBP)" },
        { status: 400 }
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let system = systemPromptFor(topic);
  if (topic === "repair") {
    const m = new Date().getMonth() + 1;
    const season =
      m === 12 || m <= 2 ? "겨울" : m <= 5 ? "봄(환절기)" : m <= 8 ? "여름·장마철" : "가을(환절기)";
    system += `\n\n[현재 시기] 지금은 ${m}월(${season})입니다. 이 시기 특성을 진단·urgency·firstAction에 반영하세요.`;

    // 실황·공휴일 맥락 (v3 P5) — 키가 없거나 실패하면 조용히 생략
    const [weather, holiday] = await Promise.all([
      weatherContextLine().catch(() => null),
      holidayContextLine().catch(() => null),
    ]);
    if (weather) system += `\n[실황 참고] ${weather}`;
    if (holiday) system += `\n[일정 참고] ${holiday}`;
  }
  if (disallowClarify) {
    system +=
      "\n\n[중요] 사용자가 이미 추가 정보를 제공했습니다. 더 이상 되묻지 말고, 곧바로 최종 결과 JSON만 출력하세요.";
  }

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content }],
    });

    const textOut = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const parsed = extractJson(textOut);
    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json(
        { ok: false, error: "결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const p = parsed as Record<string, unknown>;

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
    const result = { kind: topic, ...(parsed as object) } as AssistResult;
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e?.status === 429) {
      return NextResponse.json(
        { ok: false, error: "지금 요청이 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    console.error("[assist] error:", e?.message || err);
    return NextResponse.json(
      { ok: false, error: "둥지가 잠시 응답하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
