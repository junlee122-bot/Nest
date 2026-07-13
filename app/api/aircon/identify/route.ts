// POST /api/aircon/identify — 에어컨 라벨 사진 판독 (Vision, 서버 전용)
//
// 원칙:
// - 사진 최대 3장, jpeg/png/webp만, 장당 8MB(전송 기준) 이하
// - Claude에는 JSON만 요구, 응답은 sanitizeIdentification으로 정제
// - 시리얼·제조번호는 반환 데이터와 로그에서 제거 (이미지 내용 로그 출력 금지)
// - 신뢰도 낮은 값은 null — 단정하지 않는다

import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { callClaudeJson } from "@/lib/llm";
import { RATE_LIMIT_MESSAGE, rateLimited } from "@/lib/ratelimit";
import {
  airconIdentifyPrompt,
  sanitizeIdentification,
  validateIdentifyShape,
} from "@/lib/aircon/identify";
import { PHOTO_KIND_LABELS, type AirconIdentifyResponse, type AirconPhotoKind } from "@/lib/aircon/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_IMAGES = 3;
// 8MB 원본이 base64로 오면 ~10.7MB 문자열. 클라이언트가 1600~2000px로 리사이즈해
// 보내므로 실제로는 훨씬 작지만, 서버측 이중 방어로 상한을 둔다.
const MAX_BODY_BYTES = 34 * 1024 * 1024;
const MAX_IMAGE_BASE64 = 11_000_000;
const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedMedia = (typeof ALLOWED_MEDIA)[number];

const PHOTO_KINDS: AirconPhotoKind[] = ["nameplate", "energy-label", "product"];

function parseDataUrl(dataUrl: string): { media_type: AllowedMedia; data: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]+)$/.exec(dataUrl);
  if (!m) return null;
  const media_type = m[1] as AllowedMedia;
  if (!ALLOWED_MEDIA.includes(media_type)) return null;
  return { media_type, data: m[2] };
}

export async function POST(req: NextRequest): Promise<NextResponse<AirconIdentifyResponse>> {
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "사진 용량이 너무 큽니다. 장당 8MB 이하로 올려주세요." },
      { status: 413 }
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "서버에 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }
  if (rateLimited(req, "aircon-identify")) {
    return NextResponse.json({ ok: false, error: RATE_LIMIT_MESSAGE }, { status: 429 });
  }

  // Content-Length는 클라이언트 신고값이라(chunked 전송이면 아예 없음) 헤더 검사만으로는
  // 부족하다 — 본문을 읽은 뒤 실제 길이를 다시 검사하고 JSON 파싱한다.
  let body: { images?: { dataUrl?: string; kind?: string }[] };
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, error: "사진 용량이 너무 큽니다. 장당 8MB 이하로 올려주세요." },
        { status: 413 }
      );
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const images = Array.isArray(body.images) ? body.images : [];
  if (images.length === 0) {
    return NextResponse.json({ ok: false, error: "사진을 올려주세요." }, { status: 400 });
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { ok: false, error: `사진은 최대 ${MAX_IMAGES}장까지 올릴 수 있어요.` },
      { status: 400 }
    );
  }

  const content: Exclude<Anthropic.MessageParam["content"], string> = [];
  for (const img of images) {
    if (typeof img?.dataUrl !== "string" || img.dataUrl.length > MAX_IMAGE_BASE64) {
      return NextResponse.json(
        { ok: false, error: "사진이 너무 크거나 읽을 수 없습니다. 8MB 이하로 다시 올려주세요." },
        { status: 413 }
      );
    }
    const parsed = parseDataUrl(img.dataUrl);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "지원하지 않는 이미지 형식입니다. (JPG/PNG/WEBP)" },
        { status: 400 }
      );
    }
    const kind = PHOTO_KINDS.includes(img.kind as AirconPhotoKind)
      ? (img.kind as AirconPhotoKind)
      : "nameplate";
    content.push({
      type: "text",
      text: `다음 사진의 종류: ${PHOTO_KIND_LABELS[kind]}`,
    });
    content.push({
      type: "image",
      source: { type: "base64", media_type: parsed.media_type, data: parsed.data },
    });
  }
  content.push({
    type: "text",
    text: "위 사진들에서 에어컨 제조사·모델번호·냉방 소비전력을 읽어 요구된 JSON 스키마로만 답하세요.",
  });

  try {
    const call = await callClaudeJson({
      systemStatic: airconIdentifyPrompt(),
      messages: [{ role: "user", content }],
      maxTokens: 700,
      hasImage: true,
      validate: validateIdentifyShape,
    });
    const identification = call ? sanitizeIdentification(call.parsed) : null;
    if (!identification) {
      return NextResponse.json(
        { ok: false, error: "사진에서 라벨을 읽지 못했어요. 모델명을 직접 입력해주세요." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, identification });
  } catch (err) {
    const e = err as { status?: number };
    if (e?.status === 429) {
      return NextResponse.json(
        { ok: false, error: "지금 요청이 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    // 이미지 내용·판독 텍스트는 로그에 남기지 않는다 (상태 코드만)
    console.error("[aircon/identify] error status:", e?.status ?? "unknown");
    return NextResponse.json(
      { ok: false, error: "사진 판독에 실패했어요. 모델명을 직접 입력해주세요." },
      { status: 500 }
    );
  }
}
