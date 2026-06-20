// 금융결제원 오픈뱅킹 — 테스트베드(모의계좌) 연동. **서버 전용.**
// secret·토큰은 절대 클라이언트에 노출하지 않습니다.
//
// ⚠️ 엔드포인트/scope/버전/필수 파라미터는 공식 개발가이드(developers.kftc.or.kr,
//    developers.openbanking.or.kr)에서 현재 값을 확인하세요. 아래는 표준 스펙 기준 기본값이며
//    모두 환경변수/상수로 분리되어 있습니다. (확인 시점: 2026-06 — 배포 전 재확인 권장)

export const OB = {
  // 테스트베드 기본. 운영 전환 시 https://openapi.openbanking.or.kr
  baseUrl: process.env.OPENBANKING_BASE_URL || "https://testapi.openbanking.or.kr",
  clientId: process.env.OPENBANKING_CLIENT_ID || "",
  clientSecret: process.env.OPENBANKING_CLIENT_SECRET || "",
  redirectUri: process.env.OPENBANKING_REDIRECT_URI || "",
  // 이용기관코드(10자리) — bank_tran_id 생성에 필요. 미설정 시 거래내역조회 단계에서 안내.
  orgCode: process.env.OPENBANKING_ORG_CODE || "",
  // 조회 전용 PoC라 login inquiry 만. (이체는 transfer 추가 — 본 기능엔 불필요)
  scope: process.env.OPENBANKING_SCOPE || "login inquiry",
  apiVersion: process.env.OPENBANKING_API_VERSION || "v2.0",
};

// authorize/token 만 있어도 연결 플로우는 시작 가능. orgCode 는 조회 단계에서 별도 검증.
export function isOpenBankingConfigured(): boolean {
  return !!(OB.clientId && OB.clientSecret && OB.redirectUri);
}

export interface ObToken {
  access_token: string;
  user_seq_no: string;
  expires_at: number; // epoch ms
}

export interface ObAccount {
  fintech_use_num: string;
  account_alias?: string;
  bank_name?: string;
  account_num_masked?: string;
}

export interface ObTransaction {
  date: string; // YYYYMMDD
  amount: number;
  content: string;
  inout: string; // "입금" | "출금"
}

function randomDigits(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

// 거래고유번호: 이용기관코드(10) + 'U' + 임의 9자리
function bankTranId(): string {
  const org = OB.orgCode || randomDigits(10);
  return `${org}U${randomDigits(9)}`;
}

function yyyymmdd(d: Date): string {
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0")
  );
}

function yyyymmddhhmmss(d: Date): string {
  return (
    yyyymmdd(d) +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0")
  );
}

export function authorizeUrl(state: string): string {
  const p = new URLSearchParams({
    response_type: "code",
    client_id: OB.clientId,
    redirect_uri: OB.redirectUri,
    scope: OB.scope,
    state,
    auth_type: "0",
  });
  return `${OB.baseUrl}/oauth/2.0/authorize?${p.toString()}`;
}

// 인가코드 → 토큰 교환
export async function exchangeToken(code: string): Promise<ObToken> {
  const body = new URLSearchParams({
    code,
    client_id: OB.clientId,
    client_secret: OB.clientSecret,
    redirect_uri: OB.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(`${OB.baseUrl}/oauth/2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`token_http_${res.status}`);
  const j = await res.json();
  if (!j.access_token) throw new Error("token_missing");
  return {
    access_token: j.access_token,
    user_seq_no: j.user_seq_no,
    expires_at: Date.now() + (Number(j.expires_in) || 600) * 1000,
  };
}

// 사용자 등록계좌(핀테크이용번호) 목록
export async function getUserAccounts(token: ObToken): Promise<ObAccount[]> {
  const url = `${OB.baseUrl}/${OB.apiVersion}/user/me?user_seq_no=${encodeURIComponent(
    token.user_seq_no
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`user_http_${res.status}`);
  const j = await res.json();
  if (j.rsp_code && j.rsp_code !== "A0000") throw new Error(`user_${j.rsp_code}`);
  const list = Array.isArray(j.res_list) ? j.res_list : [];
  return list.map((a: Record<string, unknown>) => ({
    fintech_use_num: String(a.fintech_use_num ?? ""),
    account_alias: a.account_alias as string | undefined,
    bank_name: a.bank_name as string | undefined,
    account_num_masked: a.account_num_masked as string | undefined,
  }));
}

function mapTx(t: Record<string, unknown>): ObTransaction {
  return {
    date: String(t.tran_date ?? ""),
    amount: parseInt(String(t.tran_amt ?? "0").replace(/[^0-9]/g, ""), 10) || 0,
    content: String(t.print_content ?? t.branch_name ?? ""),
    inout: String(t.inout_type ?? ""),
  };
}

// 거래내역조회 (핀테크이용번호 기준) — 페이지당 최대 25건, next_page_yn 기반 페이지네이션
export async function getTransactions(
  token: ObToken,
  fintechUseNum: string,
  fromDate: string,
  toDate: string,
  maxPages = 6 // PoC: 최대 6페이지(약 150건)까지 수집
): Promise<ObTransaction[]> {
  if (!OB.orgCode) throw new Error("org_code_missing");
  const out: ObTransaction[] = [];
  let pageIndex = 1;
  let beforeTrace: string | undefined;

  for (let i = 0; i < maxPages; i++) {
    const p = new URLSearchParams({
      bank_tran_id: bankTranId(),
      fintech_use_num: fintechUseNum,
      inquiry_type: "A", // 전체
      inquiry_base: "D", // 기준일자
      from_date: fromDate,
      to_date: toDate,
      sort_order: "D", // 최신순
      tran_dtime: yyyymmddhhmmss(new Date()),
      page_index: String(pageIndex),
    });
    if (beforeTrace) p.set("befor_inquiry_trace_info", beforeTrace);

    const url = `${OB.baseUrl}/${OB.apiVersion}/account/transaction_list/fin_num?${p.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`tx_http_${res.status}`);
    const j = await res.json();
    if (j.rsp_code && j.rsp_code !== "A0000") throw new Error(`tx_${j.rsp_code}`);

    const list = Array.isArray(j.res_list) ? j.res_list : [];
    for (const t of list) out.push(mapTx(t as Record<string, unknown>));

    if (j.next_page_yn !== "Y") break; // 다음 페이지 없음
    beforeTrace =
      typeof j.befor_inquiry_trace_info === "string" ? j.befor_inquiry_trace_info : undefined;
    pageIndex += 1;
  }
  return out;
}

// 잔액조회 (선택) — best-effort, 실패 시 null
export async function getBalance(
  token: ObToken,
  fintechUseNum: string
): Promise<number | null> {
  if (!OB.orgCode) return null;
  const p = new URLSearchParams({
    bank_tran_id: bankTranId(),
    fintech_use_num: fintechUseNum,
    tran_dtime: yyyymmddhhmmss(new Date()),
  });
  const url = `${OB.baseUrl}/${OB.apiVersion}/account/balance/fin_num?${p.toString()}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (j.rsp_code && j.rsp_code !== "A0000") return null;
    return parseInt(String(j.balance_amt ?? "").replace(/[^0-9]/g, ""), 10) || null;
  } catch {
    return null;
  }
}

// 최근 N일 날짜 범위
export function recentRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: yyyymmdd(from), to: yyyymmdd(to) };
}
