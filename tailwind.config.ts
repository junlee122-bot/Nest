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
          DEFAULT: "#45A567", // 새싹 그린 — CTA·로고·강조
          hover: "#38905A",
          tint: "#E6F4EA", // 옅은 민트 (배지/배경 블록)
          deep: "#2D6A4F", // 본문 속 강조 텍스트용 (충분한 대비)
          edge: "#2F7A4C", // 3D 촉감 버튼의 아랫면
        },
        ink: "#33403A", // 딥 모스 차콜 — 텍스트·헤더 (완전 검정보다 부드럽게)
        bg: "#FAFAF3", // 웜 크림 배경
        card: "#FFFFFF",
        line: "#E7EDE2", // 민트 기 도는 보더·구분선
        muted: "#7E8A7E", // 보조 텍스트 (세이지 그레이)
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
        card: "0 2px 0 rgba(51,64,58,0.05), 0 6px 20px rgba(51,64,58,0.05)",
        lift: "0 6px 28px rgba(51,64,58,0.10)",
        // 3D 촉감 버튼 (듀오링고식 press) — 색은 컴포넌트에서 지정
        press: "0 4px 0 0 var(--press-color, #2F7A4C)",
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
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
