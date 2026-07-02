// ③ 기상청 초단기실황 (v3 P5) — 서버 전용
//
// 수리 진단의 '계절 맥락'을 실황(기온·강수)으로 강화한다.
// 위치는 받지 않는다(무PII) — 서울 대표 격자(60,127) 기준 + 문구에 명시.
// 키가 없거나 실패하면 null → 기존 계절 맥락만 사용.
// 발급: 공공데이터포털(data.go.kr) "기상청_단기예보 조회서비스"

import { kstParts, safeFetch, safeJson, withCache } from "./core";

export function isWeatherConfigured(): boolean {
  return !!process.env.DATA_GO_KR_SERVICE_KEY;
}

export interface WeatherNow {
  tempC: number | null; // T1H 기온(°C)
  rain1h: number | null; // RN1 1시간 강수량(mm)
  humidity: number | null; // REH 습도(%)
  precipType: "none" | "rain" | "rain_snow" | "snow" | null; // PTY
}

interface NcstItem {
  category?: string;
  obsrValue?: string;
}

export async function fetchWeatherNow(): Promise<WeatherNow | null> {
  const key = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!key) return null;

  return withCache("weather:seoul", 30 * 60_000, async () => {
    const { year, month, day, hour, minute } = kstParts();
    // 실황은 매시 40분 이후 제공 — 안전하게 45분 전이면 직전 시각 사용
    let baseDate = `${year}${month}${day}`;
    let baseHour = parseInt(hour, 10);
    if (parseInt(minute, 10) < 45) {
      baseHour -= 1;
      if (baseHour < 0) {
        baseHour = 23;
        const prev = new Date(
          Date.UTC(+year, +month - 1, +day) - 24 * 60 * 60 * 1000
        );
        baseDate = `${prev.getUTCFullYear()}${String(prev.getUTCMonth() + 1).padStart(2, "0")}${String(prev.getUTCDate()).padStart(2, "0")}`;
      }
    }
    const baseTime = `${String(baseHour).padStart(2, "0")}00`;

    const url =
      `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst` +
      `?serviceKey=${encodeURIComponent(key)}&numOfRows=10&pageNo=1&dataType=JSON` +
      `&base_date=${baseDate}&base_time=${baseTime}&nx=60&ny=127`;

    const data = await safeJson<{
      response?: { body?: { items?: { item?: NcstItem[] } } };
    }>(await safeFetch(url));
    const items = data?.response?.body?.items?.item;
    if (!items || !Array.isArray(items)) return null;

    const get = (cat: string) => {
      const v = items.find((i) => i.category === cat)?.obsrValue;
      const n = v != null ? Number(v) : NaN;
      return Number.isFinite(n) ? n : null;
    };
    const ptyMap: Record<number, WeatherNow["precipType"]> = {
      0: "none",
      1: "rain",
      2: "rain_snow",
      3: "snow",
      5: "rain",
      6: "rain_snow",
      7: "snow",
    };
    const pty = get("PTY");
    return {
      tempC: get("T1H"),
      rain1h: get("RN1"),
      humidity: get("REH"),
      precipType: pty === null ? null : (ptyMap[pty] ?? "none"),
    };
  });
}

// 프롬프트 주입용 한 줄 요약 (실패 시 null)
export async function weatherContextLine(): Promise<string | null> {
  const w = await fetchWeatherNow();
  if (!w) return null;
  const bits: string[] = [];
  if (w.tempC !== null) bits.push(`기온 약 ${Math.round(w.tempC)}°C`);
  if (w.precipType === "rain" && (w.rain1h ?? 0) > 0) bits.push("비가 오는 중");
  else if (w.precipType === "snow") bits.push("눈이 오는 중");
  if (w.humidity !== null && w.humidity >= 80) bits.push(`습도 ${Math.round(w.humidity)}%로 높음`);
  if (w.tempC !== null && w.tempC <= -5) bits.push("한파 수준(동파 주의)");
  if (bits.length === 0) return null;
  return `현재 실황(서울 기준, 기상청): ${bits.join(", ")}. 진단과 응급처치에 이 날씨를 참고하되, 사용자의 실제 지역과 다를 수 있음을 감안할 것.`;
}
