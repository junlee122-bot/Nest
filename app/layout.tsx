import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: "둥지 Nest — 혼자 살아도, 든든하게",
  description:
    "자취생·청년 1인 가구를 위한 AI 주거 생활 도우미. 집 문제(곰팡이·누수·보일러 등)를 사진/텍스트로 물으면 응급처치 → 책임 판단 → 집주인 연락 문구까지 알려드려요.",
  applicationName: "둥지 Nest",
  keywords: ["자취", "1인가구", "임대차", "수선의무", "집주인", "곰팡이", "누수", "전입신고"],
  openGraph: {
    title: "둥지 Nest — 혼자 살아도, 든든하게",
    description:
      "집 문제(곰팡이·누수·보일러)를 사진/텍스트로 물으면 응급처치 → 책임 판단 → 집주인 연락 문구까지. 자취생을 위한 AI 주거 생활 도우미.",
    siteName: "둥지 Nest",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "둥지 Nest — 혼자 살아도, 든든하게",
    description: "자취생을 위한 AI 주거 생활 도우미",
  },
};

export const viewport: Viewport = {
  themeColor: "#E6002D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
