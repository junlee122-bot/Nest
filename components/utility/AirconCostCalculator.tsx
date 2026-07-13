"use client";

// 에어컨 전기요금 계산기 (v15)
// - 모든 계산은 lib/electricity 순수 엔진에서 브라우저 안에서 즉시 실행 (네트워크 요청 없음)
// - 종류·평수·시간 세 입력만으로 동작, 고급 설정으로 범위를 좁힐 수 있다
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import AirconTypeSelector from "./AirconTypeSelector";
import AirconResults from "./AirconResults";
import {
  calculateAirconCost,
  calculateAirconUsage,
  clamp,
  TARIFF,
  type AirconType,
  type CoolingEnvironment,
  type InverterType,
  type MultiMode,
  type VoltageType,
} from "@/lib/electricity";
import { formatWonApprox, formatWonRange } from "@/lib/electricity/format";

const STORAGE_KEY = "doongji-aircon-calculator-v1";

interface SavedState {
  v: 1;
  type: AirconType | null;
  multiMode: MultiMode;
  area: number;
  hours: number;
  days: number;
  labelW: number | null;
  inverter: InverterType;
  baseline: number | null;
  voltage: VoltageType;
  environment: CoolingEnvironment;
}

const AIRCON_TYPES: AirconType[] = ["wall", "standing", "window", "portable", "multi"];

const DEFAULTS = {
  multiMode: "standingOnly" as MultiMode,
  area: 6,
  hours: 6,
  days: 30,
  labelW: null as number | null,
  inverter: "unknown" as InverterType,
  baseline: null as number | null,
  voltage: "low" as VoltageType,
  environment: "normal" as CoolingEnvironment,
};

const HOUR_CHIPS = [2, 4, 6, 8, 10];
const COMPARISON_HOURS = [2, 4, 6, 8];

export default function AirconCostCalculator({ initialMonth }: { initialMonth: number }) {
  const [type, setType] = useState<AirconType | null>(null);
  const [multiMode, setMultiMode] = useState<MultiMode>(DEFAULTS.multiMode);
  const [area, setArea] = useState(DEFAULTS.area);
  const [hours, setHours] = useState(DEFAULTS.hours);
  const [days, setDays] = useState(DEFAULTS.days);
  const [labelW, setLabelW] = useState<number | null>(DEFAULTS.labelW);
  const [inverter, setInverter] = useState<InverterType>(DEFAULTS.inverter);
  const [baseline, setBaseline] = useState<number | null>(DEFAULTS.baseline);
  const [voltage, setVoltage] = useState<VoltageType>(DEFAULTS.voltage);
  const [month, setMonth] = useState(clamp(Math.round(initialMonth) || 1, 1, 12));
  const [environment, setEnvironment] = useState<CoolingEnvironment>(DEFAULTS.environment);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── 로컬 저장 (설정만, 개인정보 없음) — mount 후 복원해 hydration mismatch 방지 ──
  // ref가 아니라 state 플래그를 쓰는 이유: 복원된 값이 "렌더에 반영된 뒤"에만
  // 저장 이펙트가 돌아야 한다. ref로 하면 mount 직후 저장 이펙트가 초기값으로
  // 스토리지를 덮어써 StrictMode 이중 실행에서 복원값이 유실된다.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Partial<SavedState>;
        if (s && s.v === 1) {
          if (s.type && AIRCON_TYPES.includes(s.type)) setType(s.type);
          if (s.multiMode === "wallOnly" || s.multiMode === "both" || s.multiMode === "standingOnly")
            setMultiMode(s.multiMode);
          if (typeof s.area === "number" && Number.isFinite(s.area)) setArea(clamp(s.area, 1, 60));
          if (typeof s.hours === "number" && Number.isFinite(s.hours)) setHours(clamp(s.hours, 0.5, 24));
          if (typeof s.days === "number" && Number.isFinite(s.days))
            setDays(clamp(Math.round(s.days), 1, 31));
          if (typeof s.labelW === "number" && Number.isFinite(s.labelW))
            setLabelW(clamp(s.labelW, 100, 5000));
          if (s.inverter === "inverter" || s.inverter === "fixed" || s.inverter === "unknown")
            setInverter(s.inverter);
          if (typeof s.baseline === "number" && Number.isFinite(s.baseline))
            setBaseline(clamp(s.baseline, 0, 1500));
          if (s.voltage === "low" || s.voltage === "high") setVoltage(s.voltage);
          if (s.environment === "favorable" || s.environment === "normal" || s.environment === "harsh")
            setEnvironment(s.environment);
        }
      }
    } catch {
      // 파손된 저장값은 무시하고 기본값 사용
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const s: SavedState = {
        v: 1, type, multiMode, area, hours, days, labelW, inverter, baseline, voltage, environment,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // 저장 실패는 무시 (기능 동작에 영향 없음)
    }
  }, [hydrated, type, multiMode, area, hours, days, labelW, inverter, baseline, voltage, environment]);

  function resetToDefaults() {
    // 종류 선택은 유지, 나머지는 정의된 초기 상태로
    setMultiMode(DEFAULTS.multiMode);
    setArea(DEFAULTS.area);
    setHours(DEFAULTS.hours);
    setDays(DEFAULTS.days);
    setLabelW(DEFAULTS.labelW);
    setInverter(DEFAULTS.inverter);
    setBaseline(DEFAULTS.baseline);
    setVoltage(DEFAULTS.voltage);
    setEnvironment(DEFAULTS.environment);
    setMonth(clamp(Math.round(initialMonth) || 1, 1, 12));
  }

  // ── 계산 (순수 엔진, 즉시) ──
  const result = useMemo(() => {
    if (!type) return null;
    const usageInput = {
      type,
      multiMode,
      cooledAreaPyeong: area,
      hoursPerDay: hours,
      daysPerMonth: days,
      labelPowerW: labelW ?? undefined,
      inverter,
      environment,
    };
    const usage = calculateAirconUsage(usageInput);
    const cost = calculateAirconCost({
      usage,
      month,
      voltage,
      baselineKwh: baseline ?? undefined,
    });
    const hoursComparison = COMPARISON_HOURS.map((h) => {
      const u = calculateAirconUsage({ ...usageInput, hoursPerDay: h });
      const c = calculateAirconCost({ usage: u, month, voltage, baselineKwh: baseline ?? undefined });
      return {
        hours: h,
        monthlyKwh: u.scenarios.central.monthlyKwh,
        cost: c.additionalCost.central,
        low: c.additionalCost.low,
        high: c.additionalCost.high,
      };
    });
    return { usage, cost, hoursComparison };
  }, [type, multiMode, area, hours, days, labelW, inverter, baseline, voltage, month, environment]);

  // ── 스크린리더용 요약 (debounce, 짧게) ──
  const [liveText, setLiveText] = useState("");
  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => {
      setLiveText(
        `예상 추가요금 ${formatWonApprox(result.cost.additionalCost.central)}, 예상 범위 ${formatWonRange(
          result.cost.additionalCost.low,
          result.cost.additionalCost.high
        )}`
      );
    }, 700);
    return () => clearTimeout(id);
  }, [result]);

  return (
    <div className="space-y-5">
      {/* 입력 카드 */}
      <div className="card p-5">
        <h2 className="text-base font-bold text-ink">세 가지만 알려주세요</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          실제 제품과 집 상태에 따라 달라질 수 있어 예상 범위로 보여드려요.
        </p>

        <div className="mt-4 space-y-5">
          <AirconTypeSelector
            value={type}
            onChange={setType}
            multiMode={multiMode}
            onMultiModeChange={setMultiMode}
          />

          <SliderNumberField
            id="aircon-area"
            label="실제로 냉방할 공간은 몇 평인가요?"
            help="원룸이면 전체 평수, 방이 나뉘어 있다면 에어컨으로 식힐 공간만 입력하세요."
            unit="평"
            min={1}
            max={60}
            step={0.5}
            value={area}
            onCommit={setArea}
          />

          <SliderNumberField
            id="aircon-hours"
            label="하루에 몇 시간 정도 틀까요?"
            help="한 번 켰을 때가 아니라 하루 전체 사용시간을 입력하세요."
            unit="시간"
            min={0.5}
            max={24}
            step={0.5}
            value={hours}
            onCommit={setHours}
            chips={HOUR_CHIPS}
          />

          <DaysField value={days} onCommit={setDays} />
        </div>
      </div>

      {/* 고급 설정 */}
      <div className="card p-5">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          aria-controls="aircon-advanced"
          className="flex w-full items-center gap-2 text-[15px] font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          제품 정보로 정확도 높이기
          <ChevronDown
            size={17}
            className={`ml-auto shrink-0 text-muted transition-transform ${advancedOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {advancedOpen && (
          <div id="aircon-advanced" className="mt-4 space-y-5">
            <p className="text-[13px] leading-relaxed text-muted">
              고지서와 에어컨 라벨을 알고 있다면 예상 범위를 더 좁힐 수 있어요.
            </p>

            <OptionalNumberField
              id="aircon-label-w"
              label="제품 라벨의 냉방 소비전력"
              help="실내기나 에너지효율 라벨에서 '냉방 소비전력'을 확인하세요. 냉방능력 W와 혼동하지 마세요."
              unit="W"
              min={100}
              max={5000}
              value={labelW}
              onCommit={setLabelW}
              placeholder="예) 700"
            />

            <SegmentedField<InverterType>
              name="aircon-inverter"
              legend="에어컨 방식"
              help="인버터형은 설정 온도에 도달한 뒤 출력을 낮출 수 있어요."
              value={inverter}
              onChange={setInverter}
              options={[
                { id: "inverter", label: "인버터형" },
                { id: "fixed", label: "정속형" },
                { id: "unknown", label: "잘 모르겠어요" },
              ]}
            />

            <OptionalNumberField
              id="aircon-baseline"
              label="평소 월 전력 사용량"
              help="최근 전기 고지서의 '사용량'을 입력하면 누진구간 계산이 더 정확해져요."
              unit="kWh"
              min={0}
              max={1500}
              value={baseline}
              onCommit={setBaseline}
              placeholder="예) 200"
              emptyNote="평소 사용량 미입력 · 150~250kWh 범위로 가정"
            />

            <SegmentedField<VoltageType>
              name="aircon-voltage"
              legend="주택용 요금 구분"
              help="모르겠다면 저압으로 두세요. 일부 아파트는 관리비에 주택용 고압이 적용돼요."
              value={voltage}
              onChange={setVoltage}
              options={[
                { id: "low", label: "주택용 저압" },
                { id: "high", label: "주택용 고압" },
              ]}
            />

            <div>
              <label htmlFor="aircon-month" className="text-sm font-bold text-ink">
                계산 월
              </label>
              <p id="aircon-month-help" className="mt-0.5 text-xs text-muted">
                {`7~8월은 하계 누진 기준(${TARIFF.thresholds.summer.first}/${TARIFF.thresholds.summer.second}kWh)이 적용돼요.`}
              </p>
              <select
                id="aircon-month"
                aria-describedby="aircon-month-help"
                value={month}
                onChange={(e) => setMonth(clamp(parseInt(e.target.value, 10) || 1, 1, 12))}
                className="mt-2 w-full rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            <SegmentedField<CoolingEnvironment>
              name="aircon-environment"
              legend="냉방 환경"
              help="추정 범위를 조정하는 용도로만 써요."
              value={environment}
              onChange={setEnvironment}
              options={[
                { id: "favorable", label: "그늘지고 단열이 좋은 편" },
                { id: "normal", label: "보통" },
                { id: "harsh", label: "햇빛이 강하거나 꼭대기층" },
              ]}
            />

            <button type="button" onClick={resetToDefaults} className="btn-ghost w-full text-sm">
              기본값으로 초기화
            </button>
          </div>
        )}
      </div>

      {/* 결과 / 빈 상태 */}
      {!type && (
        <div className="card flex flex-col items-center gap-1.5 px-6 py-9 text-center">
          <p className="text-base font-bold text-ink">에어컨 종류를 고르면 바로 계산해요</p>
          <p className="text-sm leading-relaxed text-muted">
            평수와 사용시간은 나중에 자유롭게 바꿀 수 있어요.
          </p>
        </div>
      )}
      {type && result && (
        <AirconResults
          type={type}
          usage={result.usage}
          cost={result.cost}
          areaPyeong={area}
          hoursPerDay={hours}
          daysPerMonth={days}
          month={month}
          voltage={voltage}
          inverter={inverter}
          environment={environment}
          hoursComparison={result.hoursComparison}
        />
      )}

      {/* 스크린리더용 결과 요약 (짧게, debounce) */}
      <p className="sr-only" aria-live="polite">
        {liveText}
      </p>
    </div>
  );
}

/* ── 슬라이더 + 숫자 입력 동기화 필드 ── */
function SliderNumberField({
  id,
  label,
  help,
  unit,
  min,
  max,
  step,
  value,
  onCommit,
  chips,
}: {
  id: string;
  label: string;
  help: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onCommit: (v: number) => void;
  chips?: number[];
}) {
  const [str, setStr] = useState(String(value));
  const [error, setError] = useState<string | null>(null);
  // 이 필드가 마지막으로 만든 문자열. blur의 onCommit이 되돌아오는 value 변경과
  // 외부(슬라이더·칩·복원) 변경을 구분해, blur 직후 조정 안내가 지워지지 않게 한다.
  const strRef = useRef(String(value));

  // 외부(슬라이더·칩·초기화·복원)에서 값이 바뀌면 문자열 동기화
  // 단, 사용자가 "6." 처럼 입력 중인 동등값은 덮어쓰지 않는다
  useEffect(() => {
    if (parseFloat(strRef.current) === value) return;
    strRef.current = String(value);
    setStr(String(value));
    setError(null);
  }, [value]);

  // 타이핑 중에는 오류를 띄우지 않는다 — 유효해지는 즉시 반영하고,
  // 범위 밖 확정은 blur에서 clamp + 조정 안내(role=status)로 처리한다.
  function handleText(s: string) {
    strRef.current = s;
    setStr(s);
    setError(null);
    const n = parseFloat(s);
    if (Number.isFinite(n) && n >= min && n <= max) onCommit(n);
  }

  function handleBlur() {
    const n = parseFloat(str);
    if (!Number.isFinite(n)) {
      strRef.current = String(value);
      setStr(String(value));
      setError(null);
      return;
    }
    const clamped = clamp(n, min, max);
    strRef.current = String(clamped);
    onCommit(clamped);
    setStr(String(clamped));
    setError(n !== clamped ? `${min}~${max}${unit} 범위에 맞춰 ${clamped}${unit}으로 조정했어요` : null);
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
      </label>
      <p id={`${id}-help`} className="mt-0.5 text-xs text-muted">
        {help}
      </p>
      <div className="mt-2 flex items-center gap-2.5">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={str}
          onChange={(e) => handleText(e.target.value)}
          onBlur={handleBlur}
          aria-describedby={`${id}-help`}
          aria-invalid={error ? true : undefined}
          className="w-24 shrink-0 rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <span className="shrink-0 text-sm font-semibold text-muted">{unit}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onCommit(parseFloat(e.target.value))}
          aria-label={`${label} 슬라이더`}
          className="min-w-0 flex-1 accent-brand"
        />
      </div>
      {error && (
        <p role="status" className="mt-1 text-[12px] font-medium text-muted">
          {error}
        </p>
      )}
      {chips && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const selected = value === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={selected}
                onClick={() => onCommit(c)}
                className={`min-h-[36px] rounded-full border px-3 py-1.5 text-[13px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                  selected
                    ? "border-brand/50 bg-brand-tint font-bold text-brand-deep"
                    : "border-line bg-card font-medium text-muted"
                }`}
              >
                {c}
                {unit}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── 사용일수 스테퍼 ── */
function DaysField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  return (
    <div>
      <label htmlFor="aircon-days" className="text-sm font-bold text-ink">
        한 달 사용일수
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCommit(clamp(value - 1, 1, 31))}
          aria-label="사용일수 줄이기"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-muted transition hover:border-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Minus size={16} aria-hidden />
        </button>
        <input
          id="aircon-days"
          type="number"
          inputMode="numeric"
          min={1}
          max={31}
          step={1}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onCommit(clamp(n, 1, 31));
          }}
          className="w-20 min-w-0 rounded-xl border border-line bg-bg p-3 text-center text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <span className="shrink-0 text-sm font-semibold text-muted">일</span>
        <button
          type="button"
          onClick={() => onCommit(clamp(value + 1, 1, 31))}
          aria-label="사용일수 늘리기"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-muted transition hover:border-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Plus size={16} aria-hidden />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[10, 20, 30].map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={value === d}
            onClick={() => onCommit(d)}
            className={`min-h-[36px] rounded-full border px-3 py-1 text-[13px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              value === d
                ? "border-brand/50 bg-brand-tint font-bold text-brand-deep"
                : "border-line bg-card font-medium text-muted"
            }`}
          >
            {d}일
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 선택 숫자 입력 (라벨 W·평소 kWh) — 비우면 자동 추정 복귀 ── */
function OptionalNumberField({
  id,
  label,
  help,
  unit,
  min,
  max,
  value,
  onCommit,
  placeholder,
  emptyNote,
}: {
  id: string;
  label: string;
  help: string;
  unit: string;
  min: number;
  max: number;
  value: number | null;
  onCommit: (v: number | null) => void;
  placeholder: string;
  emptyNote?: string;
}) {
  const [str, setStr] = useState(value === null ? "" : String(value));
  const [error, setError] = useState<string | null>(null);
  // blur의 onCommit이 되돌아오는 value 변경과 외부 변경(복원 등)을 구분하는 기준값
  const strRef = useRef(value === null ? "" : String(value));

  useEffect(() => {
    const cur = strRef.current;
    if (value === null) {
      if (cur.trim() === "") return;
      strRef.current = "";
      setStr("");
      setError(null);
      return;
    }
    if (parseFloat(cur) === value) return;
    strRef.current = String(value);
    setStr(String(value));
    setError(null);
  }, [value]);

  // 타이핑 중 오류 금지 (min이 100인 필드는 모든 정상 입력이 오류로 시작하게 됨)
  function handleText(s: string) {
    strRef.current = s;
    setStr(s);
    setError(null);
    if (s.trim() === "") {
      onCommit(null);
      return;
    }
    const n = parseFloat(s);
    if (Number.isFinite(n) && n >= min && n <= max) onCommit(n);
  }

  function handleBlur() {
    if (str.trim() === "") {
      setError(null);
      onCommit(null);
      return;
    }
    const n = parseFloat(str);
    if (!Number.isFinite(n)) {
      strRef.current = "";
      setStr("");
      setError(null);
      onCommit(null);
      return;
    }
    const clamped = clamp(n, min, max);
    strRef.current = String(clamped);
    onCommit(clamped);
    setStr(String(clamped));
    setError(
      n !== clamped
        ? `${min.toLocaleString("ko-KR")}~${max.toLocaleString("ko-KR")}${unit} 범위에 맞춰 조정했어요`
        : null
    );
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label} <span className="font-medium text-muted">(선택)</span>
      </label>
      <p id={`${id}-help`} className="mt-0.5 text-xs text-muted">
        {help}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={str}
          placeholder={placeholder}
          onChange={(e) => handleText(e.target.value)}
          onBlur={handleBlur}
          aria-describedby={`${id}-help`}
          aria-invalid={error ? true : undefined}
          className="w-32 rounded-xl border border-line bg-bg p-3 text-base text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <span className="text-sm font-semibold text-muted">{unit}</span>
      </div>
      {error && (
        <p role="status" className="mt-1 text-[12px] font-medium text-muted">
          {error}
        </p>
      )}
      {!error && value === null && emptyNote && (
        <p className="mt-1 text-[12px] text-muted">{emptyNote}</p>
      )}
    </div>
  );
}

/* ── 세그먼트 선택 — 실제 radio input(sr-only)으로 네이티브 키보드(화살표) 지원 ── */
function SegmentedField<T extends string>({
  name,
  legend,
  help,
  value,
  onChange,
  options,
}: {
  name: string;
  legend: string;
  help: string;
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-bold text-ink">{legend}</legend>
      <p className="mt-0.5 text-xs text-muted">{help}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const selected = value === o.id;
          return (
            <label
              key={o.id}
              className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-xl border px-3 py-2 text-[13px] transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                selected
                  ? "border-brand/50 bg-brand-tint font-bold text-brand-deep"
                  : "border-line bg-card font-medium text-muted hover:border-brand/30"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.id}
                checked={selected}
                onChange={() => onChange(o.id)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
