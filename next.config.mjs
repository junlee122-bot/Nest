/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // 파일 입력의 capture(카메라 앱 호출)는 Permissions-Policy와 무관하지만,
          // getUserMedia 계열은 쓰지 않으므로 보수적으로 잠근다.
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
          // TODO(운영 전환 시): Content-Security-Policy 추가.
          // 외부 리소스(Pretendard/Gmarket 폰트 CDN, Daum 우편번호 스크립트,
          // Pexels·식약처 이미지)를 화이트리스트로 정리한 뒤 점진 적용할 것.
        ],
      },
    ];
  },
};

export default nextConfig;
