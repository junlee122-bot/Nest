import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // v4 "민트 가든" — 플레이풀 파스텔 (공모전 교육자료 레퍼런스 무드)
        // 프라이머리는 새싹 그린: 둥지가 자라는 성장 테마와 직결
        brand: {
          DEFAULT: "#0DA05C", // 딥 프레시 그린 — 원포인트 프라이머리 (v5 앱 룩)
          hover: "#0B8A4F",
          tint: "#E7F6EE",
          deep: "#086B3D", // 본문 속 강조 텍스트용 (충분한 대비)
          edge: "#0B8A4F", // (legacy) 프레스 컬러
        },
        ink: "#1A1E1B", // 니어 블랙 — 실제 앱 수준의 대비
        bg: "#F6F7F6", // 뉴트럴 그레이지 배경
        card: "#FFFFFF",
        line: "#ECEEEC", // 헤어라인
        muted: "#79817B", // 보조 텍스트
        // 서브 액센트 — 기능 블록·아이콘 로테이션용 파스텔
        sun: {
          DEFAULT: "#FFB939", // 앰버 (티팁·전구 계열)
          tint: "#FFF3D9",
          deep: "#8A5E0A",
        },
        coral: {
          DEFAULT: "#FF8064", // 코랄 (하트·초과·볼터치 계열)
          tint: "#FFECE6",
          deep: "#C24B31",
        },
        sky: {
          DEFAULT: "#5AB9EA",
          tint: "#E8F5FD",
          deep: "#1F6E9C",
        },
        // 안전 시맨틱 — 플레이풀과 무관하게 불변 (경고 앰버 / 위험 레드)
        warn: {
          DEFAULT: "#F5A623",
          tint: "#FEF6E7",
        },
        danger: {
          DEFAULT: "#B91C1C", // 치명적 위험 — 브랜드가 그린이 되면서 더 명확해짐
          tint: "#FEECEC",
        },
        ok: {
          DEFAULT: "#15803D",
          tint: "#E9F6EE",
        },
        // 둥지 결(짚·잔가지) — 마스코트·둥지 아크 전용
        straw: {
          DEFAULT: "#C89B62",
          tint: "#F7F0E2",
          deep: "#8A653C",
        },
      },
      fontFamily: {
        // 디스플레이(헤딩) — Gmarket Sans: 시스템/AI 기본 폰트 느낌 탈피
        display: [
          "GmarketSans",
          "Pretendard Variable",
          "Pretendard",
          "sans-serif",
        ],
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.375rem",
        "3xl": "1.75rem", // 플레이풀 카드 라운드
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,28,25,0.04), 0 8px 24px rgba(23,28,25,0.06)",
        lift: "0 10px 32px rgba(23,28,25,0.10)",
        cta: "0 6px 16px rgba(13,160,92,0.24)",
      },
      maxWidth: {
        app: "32rem", // 모바일 퍼스트 콘텐츠 폭
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // 냉장고 사진 스캔 오버레이 — 위→아래로 지나가는 스캔 라인
        scan: {
          "0%": { top: "-20%" },
          "100%": { top: "100%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
        scan: "scan 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
