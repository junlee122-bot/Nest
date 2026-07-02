import { NextRequest, NextResponse } from "next/server";
import { contractSystemPrompt } from "@/lib/prompts";
import { rulebookForPrompt } from "@/lib/legal/rulebook";
import { lawsForPrompt } from "@/lib/legal/laws";
import { fetchLawArticles } from "@/lib/integrations/law";
import { callClaudeJson } from "@/lib/llm";
import { validateContract } from "@/lib/validate";
import type { ContractResponse, ContractResult } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_LEN = 12000; // 과도한 입력 방지

export async function POST(req: NextRequest): Promise<NextResponse<ContractResponse>> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "서버에 API 키가 설정되지 않았습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) {
    return NextResponse.json(
      { ok: false, error: "계약서 내용을 붙여넣어 주세요." },
      { status: 400 }
    );
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json(
      { ok: false, error: `내용이 너무 길어요. ${MAX_LEN}자 이내로 나눠서 확인해주세요.` },
      { status: 400 }
    );
  }

  // 법제처 현행 원문 조문 보강 (v3 P5) — 키가 없거나 실패하면 기존 요약만 사용
  let laws = lawsForPrompt();
  const live = await fetchLawArticles("주택임대차보호법", [3, 4, 6, 7, 8, 10]).catch(
    () => null
  );
  if (live) {
    laws +=
      `\n\n[현행 원문 조문 — 법제처 국가법령정보센터 연동${live.effectiveDate ? ` (시행 ${live.effectiveDate})` : ""}]\n` +
      `아래는 ${live.name} 주요 조문의 현행 원문이다. 위 요약과 원문이 다르면 원문을 우선 근거로 삼아라.\n` +
      live.text;
  }
  const system = contractSystemPrompt(rulebookForPrompt(), laws);

  try {
    // 룰북+법령은 길고 정적 → 프롬프트 캐싱 대상 (v3 P6)
    const call = await callClaudeJson({
      systemStatic: system,
      messages: [
        { role: "user", content: `다음 임대차계약서(특약 포함)를 검토해 주세요:\n\n${text}` },
      ],
      maxTokens: 3500,
      validate: validateContract,
    });
    if (!call) {
      return NextResponse.json(
        { ok: false, error: "결과를 해석하지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    const r = call.parsed as Partial<ContractResult>;
    const result: ContractResult = {
      overall_risk: r.overall_risk ?? "none",
      summary: r.summary ?? "",
      findings: Array.isArray(r.findings) ? r.findings : [],
      disclaimer:
        r.disclaimer ||
        "본 분석은 참고용이며 법적 자문이 아닙니다. 중요한 계약은 변호사·대한법률구조공단·주택임대차분쟁조정위원회 상담을 권장합니다.",
    };
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e?.status === 429) {
      return NextResponse.json(
        { ok: false, error: "지금 요청이 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }
    // 계약서 내용은 로그에 남기지 않음 — 상태코드만
    console.error("[contract] error status:", e?.status ?? "unknown");
    return NextResponse.json(
      { ok: false, error: "둥지가 잠시 응답하지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
