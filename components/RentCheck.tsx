"use client";

// 전월세 시세 참고 (v3 P5) — 국토부 실거래가 + Daum 주소검색 + 건축물대장
//
// - 주소검색(Daum postcode)은 키가 필요 없어 항상 동작
// - 실거래가·건축물대장은 서버 키(DATA_GO_KR_SERVICE_KEY)가 없으면
//   예시 데이터 + 안내로 폴백 (키 없이도 데모 완결)
// - 공공데이터는 "참고용, 법적 효력 없음"을 항상 고지
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
} from "lucide-react";
import Doongi from "./mascot/Doongi";
import { fadeUp, stagger } from "@/lib/motion";
import type { RentDeal, RentHouseType } from "@/lib/integrations/rtms";

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: {
        oncomplete: (data: DaumPostcodeResult) => void;
        width?: string;
        height?: string;
      }) => { embed: (el: HTMLElement) => void };
    };
  }
}

interface DaumPostcodeResult {
  sido: string;
  sigungu: string;
  bname: string; // 법정동
  bcode: string; // 법정동코드 10자리
  jibunAddress: string;
  autoJibunAddress: string;
  roadAddress: string;
}

interface Summary {
  total: number;
  jeonseCount: number;
  wolseCount: number;
  jeonseDepositMedian: number | null;
  wolseDepositMedian: number | null;
  wolseRentMedian: number | null;
}

interface RentOk {
  ok: true;
  yearMonth: string;
  type: RentHouseType;
  summary: Summary;
  deals: RentDeal[];
  truncated: number;
  notice: string;
  source: string;
}

interface BuildingOk {
  ok: true;
  info: {
    name: string | null;
    approvedAt: string | null;
    mainUse: string | null;
    structure: string | null;
    groundFloors: number | null;
    undergroundFloors: number | null;
    elevators: number | null;
  };
  notice: string;
  source: string;
}

const TYPES: { key: RentHouseType; label: string }[] = [
  { key: "sh", label: "단독·다가구(원룸)" },
  { key: "offi", label: "오피스텔" },
  { key: "apt", label: "아파트" },
];

// 키 미설정 데모용 예시 (실제 실거래가 아님 — 화면에 '예시' 명시)
const SAMPLE_SUMMARY: Summary = {
  total: 18,
  jeonseCount: 5,
  wolseCount: 13,
  jeonseDepositMedian: 14500,
  wolseDepositMedian: 1000,
  wolseRentMedian: 55,
};
const SAMPLE_DEALS: RentDeal[] = [
  { name: "성산동", dong: "성산동", deposit: 1000, monthlyRent: 55, areaM2: 23.1, floor: 3, yearMonth: "202606" },
  { name: "성산동", dong: "성산동", deposit: 500, monthlyRent: 48, areaM2: 19.8, floor: 2, yearMonth: "202606" },
  { name: "성산동", dong: "성산동", deposit: 2000, monthlyRent: 60, areaM2: 26.4, floor: 4, yearMonth: "202606" },
  { name: "성산동", dong: "성산동", deposit: 14500, monthlyRent: 0, areaM2: 29.7, floor: 2, yearMonth: "202605" },
  { name: "성산동", dong: "성산동", deposit: 1000, monthlyRent: 50, areaM2: 21.5, floor: 5, yearMonth: "202605" },
];

// 만원 단위 금액 표기 (10000만 = 1억)
function fmtMan(man: number): string {
  if (man >= 10000) {
    const eok = Math.floor(man / 10000);
    const rest = man % 10000;
    return rest > 0 ? `${eok}억 ${rest.toLocaleString("ko-KR")}` : `${eok}억`;
  }
  return `${man.toLocaleString("ko-KR")}만`;
}

function fmtYm(ym: string): string {
  return `${ym.slice(0, 4)}년 ${+ym.slice(4)}월`;
}

export default function RentCheck() {
  const [addr, setAddr] = useState<DaumPostcodeResult | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [type, setType] = useState<RentHouseType>("sh");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RentOk | null>(null);
  const [isSample, setIsSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);

  // Daum 우편번호 스크립트 로드 (키 불필요) + 임베드
  useEffect(() => {
    if (!pickerOpen) return;
    const mount = () => {
      const el = embedRef.current;
      if (!el || !window.daum) return;
      el.innerHTML = "";
      new window.daum.Postcode({
        oncomplete: (result) => {
          setAddr(result);
          setPickerOpen(false);
          setData(null);
          setIsSample(false);
        },
        width: "100%",
        height: "100%",
      }).embed(el);
    };
    if (window.daum) {
      mount();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = mount;
    script.onerror = () => setPickerError(true);
    document.body.appendChild(script);
  }, [pickerOpen]);

  async function lookup() {
    if (!addr || loading) return;
    setLoading(true);
    setError(null);
    setData(null);
    setIsSample(false);
    try {
      const res = await fetch("/api/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawdCd: addr.bcode.slice(0, 5), type }),
      });
      const json = await res.json();
      if (json.ok) {
        setData(json as RentOk);
      } else if (json.reason === "config") {
        // 키 미설정 — 예시 데이터로 화면 흐름을 보여준다
        setData({
          ok: true,
          yearMonth: "202606",
          type,
          summary: SAMPLE_SUMMARY,
          deals: SAMPLE_DEALS,
          truncated: 0,
          notice: "공공데이터 기반 참고 정보로 법적 효력이 없어요.",
          source: "예시 데이터",
        });
        setIsSample(true);
      } else if (json.reason === "empty") {
        setError("최근 3개월 신고된 거래가 없어요. 유형을 바꾸거나 옆 동네로 시도해보세요.");
      } else {
        setError(json.error || "조회에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      setError("연결에 문제가 생겼어요. 네트워크를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh pb-16">
      <header className="flow-bg border-b border-line">
        <div className="container-app py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
          >
            <ArrowLeft size={16} /> 홈
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tint text-brand">
              <BarChart3 size={22} />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-ink">
                전월세 시세 참고
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">
                  BETA
                </span>
              </h1>
              <p className="text-sm text-muted">우리 동네 실거래 신고가로 시세 감 잡기</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container-app space-y-5 pt-5">
        {/* 1. 동네 선택 */}
        <div className="card p-5">
          <p className="text-base font-bold text-ink">어느 동네예요?</p>
          <p className="mt-1 text-xs text-muted">
            주소는 검색에만 쓰고 저장하지 않아요. 동 단위까지만 골라도 돼요.
          </p>
          {addr && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-tint px-3 py-2.5">
              <MapPin size={16} className="shrink-0 text-brand" />
              <span className="text-sm font-semibold text-ink">
                {addr.sido} {addr.sigungu} {addr.bname || ""}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="btn-ghost mt-3 w-full text-sm"
          >
            <Search size={16} /> {addr ? "다른 동네 선택" : "주소 검색으로 동네 선택"}
          </button>
          {pickerOpen && !pickerError && (
            <div ref={embedRef} className="mt-3 h-96 overflow-hidden rounded-xl border border-line" />
          )}
          {pickerOpen && pickerError && (
            <p className="mt-3 rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
              주소 검색 창을 불러오지 못했어요. 네트워크 상태를 확인하고 다시 시도해주세요.
            </p>
          )}

          {/* 2. 유형 + 조회 */}
          <p className="mt-4 text-xs font-semibold text-muted">집 유형</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`chip ${type === t.key ? "border-brand bg-brand-tint text-brand" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={lookup}
            disabled={!addr || loading}
            className="btn-primary mt-4 w-full"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 실거래가 찾는 중…
              </>
            ) : (
              "최근 실거래가 보기"
            )}
          </button>
        </div>

        {!data && !loading && !error && (
          <div className="card flex flex-col items-center gap-2 px-6 py-8 text-center">
            <Doongi mood="hello" size={96} />
            <p className="text-sm leading-relaxed text-muted">
              계약 전, 이 동네 시세부터 확인해요.
              <br />
              보증금이 시세보다 유난히 높으면 의심해볼 신호예요.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="card border-warn/40 p-4 text-sm leading-relaxed text-ink">
            {error}
          </div>
        )}

        {data && (
          <m.div variants={stagger()} initial="hidden" animate="show" className="space-y-4">
            {isSample && (
              <m.div
                variants={fadeUp}
                className="rounded-xl border border-warn/40 bg-warn-tint p-3 text-xs leading-relaxed text-[#9A6B00]"
              >
                지금은 <b>예시 화면</b>이에요. 서버에 공공데이터포털 키(DATA_GO_KR_SERVICE_KEY)를
                설정하면 국토교통부 실거래 신고가가 표시돼요.
              </m.div>
            )}

            {/* 요약 */}
            <m.section variants={fadeUp} className="card p-5">
              <h2 className="text-base font-bold text-ink">
                {addr?.sigungu} {addr?.bname}{" "}
                <span className="font-semibold text-muted">
                  · {fmtYm(data.yearMonth)} 신고 {data.summary.total}건
                </span>
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-bg p-3">
                  <p className="text-xs font-semibold text-muted">
                    월세 중앙값 ({data.summary.wolseCount}건)
                  </p>
                  <p className="mt-1 text-base font-extrabold text-ink">
                    {data.summary.wolseDepositMedian !== null && data.summary.wolseRentMedian !== null
                      ? `${fmtMan(data.summary.wolseDepositMedian)} / ${data.summary.wolseRentMedian}만`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-bg p-3">
                  <p className="text-xs font-semibold text-muted">
                    전세 보증금 중앙값 ({data.summary.jeonseCount}건)
                  </p>
                  <p className="mt-1 text-base font-extrabold text-ink">
                    {data.summary.jeonseDepositMedian !== null
                      ? fmtMan(data.summary.jeonseDepositMedian)
                      : "—"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                내 보증금이 이 시세보다 크게 높다면(특히 전세) 깡통전세 위험 신호일 수 있어요.
                계약 전 등기부등본·보증보험 가입 가능 여부를 꼭 확인하세요.
              </p>
            </m.section>

            {/* 거래 목록 */}
            <m.section variants={fadeUp} className="card p-5">
              <h3 className="mb-3 text-sm font-bold text-ink">최근 계약 내역</h3>
              <ul className="divide-y divide-line">
                {data.deals.map((d, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{d.name}</p>
                      <p className="text-xs text-muted">
                        {d.areaM2 ? `${d.areaM2}㎡` : ""}
                        {d.floor !== null ? ` · ${d.floor}층` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink">
                      {d.monthlyRent > 0
                        ? `${fmtMan(d.deposit)} / ${d.monthlyRent}만`
                        : `전세 ${fmtMan(d.deposit)}`}
                    </p>
                  </li>
                ))}
              </ul>
              {data.truncated > 0 && (
                <p className="mt-2 text-xs text-muted">외 {data.truncated}건 더 있어요.</p>
              )}
            </m.section>

            {/* 건축물대장 (선택) */}
            {addr && !isSample && <BuildingLookup addr={addr} />}

            <m.p variants={fadeUp} className="rounded-xl bg-bg p-3 text-xs leading-relaxed text-muted">
              {data.notice} 출처: {data.source}
              {!isSample && " (신고 기반이라 실제 매물 호가와 다를 수 있어요)"}
            </m.p>
          </m.div>
        )}
      </div>
    </main>
  );
}

// 건축물대장 — 준공연도·용도 확인 (키 없으면 조용히 숨김)
function BuildingLookup({ addr }: { addr: DaumPostcodeResult }) {
  const [state, setState] = useState<"idle" | "loading" | "hidden" | "done" | "empty">("idle");
  const [info, setInfo] = useState<BuildingOk | null>(null);

  const jibun = addr.jibunAddress || addr.autoJibunAddress || "";
  const bunji = jibun.match(/(\d+)(?:-(\d+))?$/);
  if (!bunji) return null;

  async function run() {
    setState("loading");
    try {
      const res = await fetch("/api/building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bcode: addr.bcode, bun: bunji![1], ji: bunji![2] || "0" }),
      });
      const json = await res.json();
      if (json.ok) {
        setInfo(json as BuildingOk);
        setState("done");
      } else if (json.reason === "config") {
        setState("hidden");
      } else {
        setState("empty");
      }
    } catch {
      setState("empty");
    }
  }

  if (state === "hidden") return null;

  return (
    <m.section variants={fadeUp} className="card p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-straw-tint text-straw-deep">
          <Building2 size={18} />
        </span>
        <h3 className="text-sm font-bold text-ink">이 주소 건물 정보 (건축물대장)</h3>
      </div>
      {state === "done" && info ? (
        <div className="mt-3 space-y-1.5 text-sm text-ink">
          {info.info.name && <p className="font-semibold">{info.info.name}</p>}
          <p>
            준공(사용승인):{" "}
            <b>
              {info.info.approvedAt
                ? `${info.info.approvedAt.slice(0, 4)}년`
                : "정보 없음"}
            </b>
            {info.info.mainUse && (
              <>
                {" "}
                · 주용도: <b>{info.info.mainUse}</b>
              </>
            )}
          </p>
          <p className="text-muted">
            {info.info.groundFloors !== null && `지상 ${info.info.groundFloors}층`}
            {info.info.undergroundFloors ? ` / 지하 ${info.info.undergroundFloors}층` : ""}
            {info.info.elevators !== null && ` · 승강기 ${info.info.elevators}대`}
            {info.info.structure && ` · ${info.info.structure}`}
          </p>
          {info.info.mainUse && !/주택|아파트|오피스텔/.test(info.info.mainUse) && (
            <p className="rounded-xl bg-warn-tint p-3 text-xs leading-relaxed text-[#9A6B00]">
              주용도가 주거용이 아니면(예: 근린생활시설) 전세보증보험 가입이 안 될 수 있어요.
              계약 전 꼭 확인하세요.
            </p>
          )}
          <p className="pt-1 text-xs text-muted">
            {info.notice} 출처: {info.source}
          </p>
        </div>
      ) : state === "empty" ? (
        <p className="mt-3 text-sm text-muted">
          이 지번으로 건축물대장을 찾지 못했어요. 정확한 지번(동·호수 제외)으로 다시 검색해보세요.
        </p>
      ) : (
        <button
          type="button"
          onClick={run}
          disabled={state === "loading"}
          className="btn-ghost mt-3 w-full text-sm"
        >
          {state === "loading" ? (
            <>
              <Loader2 size={16} className="animate-spin" /> 확인 중…
            </>
          ) : (
            <>
              준공연도·용도 확인하기 <ChevronDown size={15} />
            </>
          )}
        </button>
      )}
    </m.section>
  );
}
