#!/usr/bin/env node
// 둥지 응답 품질 평가 하네스 (v3 P6)
//
// 사용법:
//   1) ANTHROPIC_API_KEY 가 설정된 상태로 dev/prod 서버 실행 (npm run dev)
//   2) node evals/run.mjs                # 기본 http://localhost:3000
//      BASE=http://localhost:3100 node evals/run.mjs
//      ONLY=gas-emergency node evals/run.mjs   # 특정 케이스만
//
// 주의: 실제 API 를 호출하므로 비용이 발생합니다 (케이스당 1콜, 기본 8콜).
// 모델 출력은 확률적이라 간헐 실패가 있을 수 있습니다 — 2회 연속 실패만 회귀로 간주하세요.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE || "http://localhost:3000";
const ONLY = process.env.ONLY || null;

const cases = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "cases.json"), "utf8")
);

// 단호 문구에서 금지하는 위협성 표현 (프롬프트 톤 규칙 회귀 감지)
const FIRM_FORBIDDEN = ["손해배상을 청구", "법적 조치를 취하", "고소", "오늘 중으로"];

function checkCase(c, data) {
  const fails = [];
  const e = c.expect || {};

  const isClarify = !!data.clarify;
  if (typeof e.clarify === "boolean" && isClarify !== e.clarify) {
    fails.push(`clarify: expected ${e.clarify}, got ${isClarify}`);
  }
  if (isClarify) return fails; // 되묻기 응답이면 결과 필드 검사는 생략

  const r = data.result || {};
  if (e.verdict && !e.verdict.includes(r.responsibility?.verdict)) {
    fails.push(`verdict: expected ${e.verdict.join("|")}, got ${r.responsibility?.verdict}`);
  }
  if (e.urgency && !e.urgency.includes(r.urgency)) {
    fails.push(`urgency: expected ${e.urgency.join("|")}, got ${r.urgency}`);
  }
  if (e.category && !e.category.includes(r.category)) {
    fails.push(`category: expected ${e.category.join("|")}, got ${r.category}`);
  }
  if (e.safetyLevel && !e.safetyLevel.includes(r.safety?.level)) {
    fails.push(`safety.level: expected ${e.safetyLevel.join("|")}, got ${r.safety?.level}`);
  }
  // 공통 구조 검사
  if (c.topic === "repair") {
    if (!r.message_polite || !r.message_firm) fails.push("message polite/firm 누락");
    for (const bad of FIRM_FORBIDDEN) {
      if ((r.message_firm || "").includes(bad)) fails.push(`firm 문구에 금지 표현: "${bad}"`);
    }
    if (!r.responsibility?.disclaimer) fails.push("disclaimer 누락");
  }
  return fails;
}

let pass = 0;
let fail = 0;

for (const c of cases) {
  if (ONLY && c.id !== ONLY) continue;
  const started = Date.now();
  let data;
  try {
    const res = await fetch(`${BASE}/api/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: c.topic,
        text: c.text,
        disallowClarify: c.disallowClarify === true,
      }),
    });
    data = await res.json();
  } catch (err) {
    console.log(`✗ ${c.id} — 요청 실패: ${err.message}`);
    fail++;
    continue;
  }
  const ms = Date.now() - started;

  if (!data.ok) {
    console.log(`✗ ${c.id} — API 오류: ${data.error} (${ms}ms)`);
    fail++;
    continue;
  }
  const fails = checkCase(c, data);
  if (fails.length === 0) {
    pass++;
    console.log(`✓ ${c.id} (${ms}ms)`);
  } else {
    fail++;
    console.log(`✗ ${c.id} (${ms}ms)`);
    for (const f of fails) console.log(`    - ${f}`);
  }
}

console.log(`\n결과: ${pass} 통과 / ${fail} 실패 (총 ${pass + fail})`);
process.exit(fail > 0 ? 1 : 0);
