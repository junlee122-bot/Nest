import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "KT 느낌" — 클린한 테크 + 신뢰 (브리프 7-2)
        brand: {
          DEFAULT: "#E6002D", // KT 스타일 레드 — 로고·CTA·강조
          hover: "#C20026", // hover/pressed
          tint: "#FDEAEE", // 아주 옅은 레드 틴트 (배지/배경)
        },
        ink: "#1A1A1A", // KT Black — 텍스트·헤더
        bg: "#FAFAFA", // 클린 뉴트럴 배경
        card: "#FFFFFF",
        line: "#ECECEC", // 보더·구분선
        muted: "#6B6B6B", // 보조 텍스트
        // 안전 경고 (레드 금지 → 앰버)
        warn: {
          DEFAULT: "#F5A623",
          tint: "#FEF6E7",
        },
        danger: {
          DEFAULT: "#B91C1C", // 치명적 위험 — 진한 배경용
          tint: "#FEECEC",
        },
      },
      fontFamily: {
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
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
        lift: "0 4px 24px rgba(0,0,0,0.08)",
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
