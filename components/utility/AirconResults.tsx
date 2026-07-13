"use client";

// 에어컨 계산 결과 표시 (v15) — 메인 결과·누진구간·시간 비교·계산 기준·절약 팁
// 모든 숫자는 lib/electricity 순수 엔진에서 오고, 여기서는 표시만 담당한다.
import { useState } from "react";
import { ChevronDown, Copy, Check, Info } from "lucide-react";
import {
  AIRCON_PROFILES,
  ENVIRONMENT_LABELS,
  INVERTER_LABELS,
  TARIFF,
  voltageLabel,
  type AirconCostResult,
  type AirconType,
  type AirconUsageResult,
  type CoolingEnvironment,
  type InverterType,
  type VoltageType,
} from "@/lib/electricity";
import {
  formatKw,
  formatKwh,
  formatWon,
  formatWonApprox,
  formatWonApproxSmall,
  formatWonRange,
} from "@/lib/electricity/format";
import { powerSourceText } from "@/lib/aircon/power";
import type { CoolingPowerSource, SelectedAirconProduct } from "@/lib/aircon/types";

export interface AirconResultsProps {
  type: AirconType;
  usage: AirconUsageResult;
  cost: AirconCostResult;
  areaPyeong: number;
  hoursPerDay: number;
  daysPerMonth: number;
  month: number;
  voltage: VoltageType;
  inverter: InverterType;
  environment: CoolingEnvironment;
  /** 같은 설정에서 하루 2·4·6·8시간으로 각각 다시 계산한 값 */
  hoursComparison: { hours: number; monthlyKwh: number; cost: number; low: number; high: number }[];
  /** v16 — 적용된 냉방 소비전력의 출처와 확인된 제품 (선택) */
  powerSource: CoolingPowerSource;
  appliedPowerW: number | null;
  product: SelectedAirconProduct | null;
}

export default function AirconResults(props: AirconResultsProps) {
  const { usage, cost } = props;
  const central = cost.additionalCost.central;
  const totalHours = props.hoursPerDay * props.daysPerMonth;
  const perDay = props.daysPerMonth > 0 ? central / props.daysPerMonth : 0;
  const perHour = totalHours > 0 ? central / totalHours : 0;
  const conditionLine = `${AIRCON_PROFILES[props.type].label} · ${props.areaPyeong}평 · 하루 ${props.hoursPerDay}시간 × ${props.daysPerMonth}일`;

  return (
    <div className="space-y-4">
      {/* 면적-유형 경고 (비차단) */}
      {usage.warnings.length > 0 && (
        <div role="status" className="rounded-2xl border border-sun/40 bg-sun-tint p-3.5">
          {usage.warnings.map((w) => (
            <p key={w} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
              <Info size={15} className="mt-0.5 shrink-0 text-sun-deep" aria-hidden />
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}

      {/* 메인 결과 카드 */}
      <section className="animate-fade-up rounded-2xl border border-coral/20 bg-coral-tint p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-white">
            추정치
          </span>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-coral-deep">
            {powerSourceText(props.powerSource, props.appliedPowerW)}
          </span>
          {props.product && (
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-coral-deep">
              {[props.product.brand, props.product.modelNumber].filter(Boolean).join(" ") ||
                "모델 확인됨"}
            </span>
          )}
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-coral-deep">
            {cost.baseline.userProvided
              ? "평소 사용량 직접 입력"
              : `평소 ${cost.baseline.low}~${cost.baseline.high}kWh 가정`}
          </span>
        </div>

        {props.product && props.appliedPowerW === null && (
          <p role="status" className="mt-2 text-[12px] leading-relaxed text-muted">
            제품 모델은 찾았지만 냉방 소비전력은 확인하지 못했어요. 현재는 평수 기준으로 계산하고
            있어요.
          </p>
        )}

        <p className="mt-3 text-[12px] font-medium text-muted">{conditionLine}</p>
        <p className="mt-1 text-sm font-semibold text-ink">한 달 예상 추가요금</p>
        <p className="text-[30px] font-extrabold leading-tight text-coral-deep">
          {formatWonApprox(central)}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-ink">
          예상 범위 {formatWonRange(cost.additionalCost.low, cost.additionalCost.high)}
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          에어컨만 따로 청구되는 금액이 아니라, 평소 집 전체 사용량에 에어컨 사용량을 더했을 때
          늘어나는 금액이에요.
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/70 p-2.5 text-center">
            <dt className="text-[11px] font-semibold text-muted">추가 사용량</dt>
            <dd className="mt-0.5 break-keep text-[13px] font-bold text-ink">
              약 {formatKwh(cost.airconMonthlyKwh.central)}
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-2.5 text-center">
            <dt className="text-[11px] font-semibold text-muted">하루 평균</dt>
            <dd className="mt-0.5 break-keep text-[13px] font-bold text-ink">{formatWonApproxSmall(perDay)}</dd>
          </div>
          <div className="rounded-xl bg-white/70 p-2.5 text-center">
            <dt className="text-[11px] font-semibold text-muted">평균 1시간당</dt>
            <dd className="mt-0.5 break-keep text-[13px] font-bold text-ink">{formatWonApproxSmall(perHour)}</dd>
          </div>
        </dl>
        <p className="mt-1.5 text-[11px] text-muted">
          시간당 금액은 누진제를 반영한 월평균 환산값이에요.
        </p>

        <CopyResultButton {...props} />
      </section>

      <ProgressiveTierCard cost={cost} />
      <HoursComparisonCard
        hoursComparison={props.hoursComparison}
        hoursPerDay={props.hoursPerDay}
        currentCost={central}
      />
      <CalculationBasisCard {...props} />
      <SavingsTips type={props.type} hasWarnings={usage.warnings.length > 0} />

      <p className="px-1 text-center text-xs leading-relaxed text-muted">
        이 결과는 에어컨 종류와 냉방 면적을 바탕으로 한 예상치예요. 실제 요금은 제품 효율, 설정
        온도, 실외 온도, 단열, 사용 패턴, 할인과 관리비 정산 방식에 따라 달라질 수 있어요.
        <br />
        정확한 청구액은 제품 라벨과 최근 고지서를 입력하거나 한전ON 계산 결과를 확인해주세요.
      </p>
    </div>
  );
}

/* ── 누진구간 카드 ── */
function ProgressiveTierCard({ cost }: { cost: AirconCostResult }) {
  const before = cost.beforeBillCentral;
  const after = cost.afterBillCentral;
  const t = after.thresholds;
  // 표시 범위: 2단계 상한의 1.25배(또는 사용 후 값)까지
  const scaleMax = Math.max(t.second * 1.25, after.kwh * 1.1, 1);
  const pct = (v: number) => Math.min(100, (v / scaleMax) * 100);
  const tierChanged = before.tier !== after.tier;
  const basicChanged = before.basicCharge !== after.basicCharge;
  const tierLabel = (n: number) => (n >= 4 ? "슈퍼유저 구간" : `${Math.min(n, 3)}단계`);

  return (
    <section className="card animate-fade-up p-5">
      <h3 className="text-[15px] font-bold text-ink">누진구간은 이렇게 바뀌어요</h3>

      <div className="mt-3">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="absolute inset-y-0 left-0 bg-ok/25" style={{ width: `${pct(t.first)}%` }} />
          <div
            className="absolute inset-y-0 bg-sun/30"
            style={{ left: `${pct(t.first)}%`, width: `${pct(t.second) - pct(t.first)}%` }}
          />
          <div
            className="absolute inset-y-0 bg-coral/30"
            style={{ left: `${pct(t.second)}%`, right: 0 }}
          />
          {/* 사용 전/후 마커 */}
          <div
            className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-muted"
            style={{ left: `calc(${pct(before.kwh)}% - 2px)` }}
          />
          <div
            className="absolute top-1/2 h-4 w-1.5 -translate-y-1/2 rounded-full bg-coral"
            style={{ left: `calc(${pct(after.kwh)}% - 3px)` }}
          />
        </div>
        {/* 라벨은 실제 경계 위치(pct)에 절대배치해 막대 구간과 정렬 */}
        <div className="relative mt-1 h-8 text-[10px] font-semibold text-muted" aria-hidden>
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${pct(t.first)}%` }}
          >
            {t.first}kWh
          </span>
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${pct(t.second)}%` }}
          >
            {t.second}kWh
          </span>
          <span
            className="absolute top-4 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${pct(t.first) / 2}%` }}
          >
            1단계
          </span>
          <span
            className="absolute top-4 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${(pct(t.first) + pct(t.second)) / 2}%` }}
          >
            2단계
          </span>
          <span
            className="absolute top-4 -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${(pct(t.second) + 100) / 2}%` }}
          >
            3단계
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-sm leading-relaxed text-ink">
        <li>
          사용 전 {formatKwh(before.kwh)} ({tierLabel(before.tier)}) → 에어컨 추가 +
          {formatKwh(after.kwh - before.kwh)} → 사용 후 <b>{formatKwh(after.kwh)}</b>
        </li>
        <li className="font-semibold">
          {tierChanged
            ? `${tierLabel(before.tier)} → ${tierLabel(after.tier)}에 들어갈 가능성이 있어요.`
            : `현재 가정값으로는 ${tierLabel(before.tier)}${before.tier >= 4 ? "을" : "를"} 유지해요.`}
        </li>
        {basicChanged && (
          <li className="text-[13px] text-muted">
            기본요금도 {formatWon(before.basicCharge)}에서 {formatWon(after.basicCharge)}으로
            바뀌어요.
          </li>
        )}
        {after.tier === 4 && (
          <li className="text-[13px] text-muted">
            사용량이 1,000kWh를 넘으면 초과분에 별도 단가가 적용돼요.
          </li>
        )}
      </ul>
      <p className="mt-2 text-[11px] text-muted">
        중앙 시나리오 기준 · {after.season === "summer" ? "하계(7~8월)" : "기타계절"} 누진 기준선
      </p>
    </section>
  );
}

/* ── 시간별 비교 카드 ── */
function HoursComparisonCard({
  hoursComparison,
  hoursPerDay,
  currentCost,
}: Pick<AirconResultsProps, "hoursComparison" | "hoursPerDay"> & { currentCost: number }) {
  const inList = hoursComparison.some((r) => r.hours === hoursPerDay);
  const maxCost = Math.max(1, ...hoursComparison.map((r) => r.cost));
  return (
    <section className="card animate-fade-up p-5">
      <h3 className="text-[15px] font-bold text-ink">사용시간을 바꾸면?</h3>
      <ul className="mt-3 space-y-2">
        {hoursComparison.map((r) => {
          const current = r.hours === hoursPerDay;
          return (
            <li key={r.hours}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className={`whitespace-nowrap ${current ? "font-bold text-coral-deep" : "font-medium text-ink"}`}>
                  하루 {r.hours}시간{current && " (현재)"}
                </span>
                <span className="text-[12px] text-muted">약 {formatKwh(r.monthlyKwh)}</span>
                <span className={`shrink-0 ${current ? "font-bold text-coral-deep" : "font-semibold text-ink"}`}>
                  {formatWonApprox(r.cost)}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
                <div
                  className={`h-full rounded-full ${current ? "bg-coral" : "bg-coral/40"}`}
                  style={{ width: `${Math.max(4, (r.cost / maxCost) * 100)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      {!inList && (
        <p className="mt-3 rounded-xl bg-bg p-2.5 text-[13px] font-medium text-ink">
          현재 설정 {hoursPerDay}시간: <b className="text-coral-deep">{formatWonApprox(currentCost)}</b>
        </p>
      )}
    </section>
  );
}

/* ── 계산 기준 카드 ── */
function CalculationBasisCard({
  usage,
  cost,
  areaPyeong,
  voltage,
  inverter,
  environment,
  month,
  powerSource,
  appliedPowerW,
  product,
}: AirconResultsProps) {
  return (
    <details className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[15px] font-bold text-ink">
        계산 기준 보기
        <ChevronDown size={17} className="ml-auto shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <dl className="mt-3 space-y-2 text-[13px] leading-relaxed">
        <Row k="추정 정격 소비전력" v={formatKw(usage.ratedInputKw)} />
        <Row
          k="소비전력 산정 방식"
          v={
            usage.ratedSource === "label"
              ? powerSourceText(powerSource, appliedPowerW ?? Math.round(usage.ratedInputKw * 1000))
              : `${areaPyeong}평 × 평수 기반 추정`
          }
        />
        {product && (
          <Row
            k="확인한 제품"
            v={[product.brand, product.modelNumber].filter(Boolean).join(" ") || product.title}
          />
        )}
        <Row k="에어컨 방식" v={INVERTER_LABELS[inverter]} />
        <Row k="냉방 환경" v={ENVIRONMENT_LABELS[environment]} />
        <Row
          k="평소 전력 사용량"
          v={
            cost.baseline.userProvided
              ? `${cost.baseline.central}kWh (직접 입력)`
              : `${cost.baseline.low}~${cost.baseline.high}kWh 가정`
          }
        />
        <Row
          k="적용 요금"
          v={`${voltageLabel(voltage)} · ${month}월(${cost.afterBillCentral.season === "summer" ? "하계" : "기타계절"}) · ${TARIFF.label} · 확인일 ${TARIFF.verifiedAt}`}
        />
      </dl>
      <p className="mt-3 text-[12px] leading-relaxed text-muted">
        계산에서 제외한 것: 각종 할인(복지·자동이체 등), TV 수신료, 공동주택 공용 전기료와
        관리사무소 배분 방식, 태양광 상계 등 개별 계약 조건.
      </p>
      <div className="mt-3 rounded-xl bg-bg p-3">
        <p className="text-[12px] font-bold text-ink">정확도를 높이려면</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-[12px] leading-relaxed text-muted">
          <li>에어컨 라벨의 냉방 소비전력(W)을 입력하세요.</li>
          <li>최근 고지서의 월 사용량(kWh)을 입력하세요.</li>
          <li>저압·고압 구분을 확인하세요.</li>
        </ol>
      </div>
    </details>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}

/* ── 절약 팁 ── */
function SavingsTips({ type, hasWarnings }: { type: AirconType; hasWarnings: boolean }) {
  const tips: string[] = [];
  if (hasWarnings) tips.push("제품의 냉방 가능 면적과 소비전력을 라벨에서 한 번 확인해보세요.");
  if (type === "portable")
    tips.push("배기 호스 주변과 창문 틈을 잘 막아야 뜨거운 공기가 다시 들어오는 것을 줄일 수 있어요.");
  tips.push(
    "문과 창문을 닫고 냉기가 빠져나가지 않게 해보세요.",
    "선풍기나 서큘레이터를 함께 쓰면 냉기를 더 고르게 보낼 수 있어요.",
    "필터를 정기적으로 청소하면 불필요한 전력 소모를 줄이는 데 도움이 돼요.",
    "강한 햇빛이 드는 시간에는 커튼으로 열 유입을 줄여보세요."
  );
  return (
    <section className="card animate-fade-up p-5">
      <h3 className="text-[15px] font-bold text-ink">전기요금 아끼는 작은 습관</h3>
      <ul className="mt-2.5 space-y-1.5">
        {tips.slice(0, 4).map((t) => (
          <li key={t} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
            <Check size={14} className="mt-0.5 shrink-0 text-brand" aria-hidden />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── 결과 복사 ── */
function CopyResultButton(props: AirconResultsProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    const { cost, usage } = props;
    const text =
      `[둥지] ${AIRCON_PROFILES[props.type].label} 에어컨 · ${props.areaPyeong}평 · 하루 ${props.hoursPerDay}시간 × ${props.daysPerMonth}일\n` +
      `한 달 예상 추가요금 ${formatWonApprox(cost.additionalCost.central)}\n` +
      `예상 범위 ${formatWonRange(cost.additionalCost.low, cost.additionalCost.high)}\n` +
      `추가 사용량 약 ${formatKwh(cost.airconMonthlyKwh.central)}\n` +
      `${voltageLabel(props.voltage)} · ${props.month}월 기준` +
      `${usage.ratedSource === "label" ? " · 제품 라벨 반영" : ""}\n` +
      `실제 요금은 제품과 사용 환경에 따라 달라질 수 있어요.`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    }
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={copy} className="btn-ghost w-full bg-white/70 text-sm">
        {copied ? (
          <>
            <Check size={15} className="text-brand" /> 복사됐어요
          </>
        ) : (
          <>
            <Copy size={15} /> 결과 복사
          </>
        )}
      </button>
      {failed && (
        <p role="status" className="mt-1.5 text-center text-[12px] text-muted">
          복사가 지원되지 않는 환경이에요. 화면을 캡처해 공유해주세요.
        </p>
      )}
    </div>
  );
}
