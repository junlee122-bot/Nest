import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "둥지 Nest — 혼자 살아도, 든든하게",
    short_name: "둥지",
    description: "자취생·청년 1인 가구를 위한 AI 주거 생활 도우미",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F7F6",
    theme_color: "#0DA05C",
    lang: "ko",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
