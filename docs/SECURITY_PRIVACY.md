# 둥지(Nest) 보안·개인정보 정책 요약

심사·리뷰 시 참고용으로, 코드가 실제로 지키는 것만 적었습니다.

## 저장하지 않는 데이터

- 업로드한 사진 원본 (집 사진·냉장고 사진 — API 처리 후 폐기)
- 계약서 원문
- 주소 상세 (시세 조회는 법정동 코드 5자리만 서버로 전송)
- 집주인 메시지 전문 (사용자가 고친 내용 포함)
- 금융 거래내역 원문

## localStorage 정책

- 저장하는 것: 최근 본 문제의 **요약 제목**, 체크리스트 체크 상태(결과 해시별),
  둥지 키우기 카운트, 온보딩 완료 플래그
- 민감한 원문·사진은 저장하지 않음
- 모든 저장 항목에 "이 기기에만 저장돼요" 안내 표시, 사용자가 삭제 가능

## API 키 정책

- 모든 외부 API 키는 서버 라우트에서만 사용 (`process.env`, `NEXT_PUBLIC_` 접두어 없음)
- 클라이언트 번들에 키 문자열이 없는지 빌드 후 스캔으로 확인
- `.env.local`은 `.gitignore` 대상

## 서버 로그 정책

- LLM 라우트 에러는 **status 코드만** 기록 (`[assist] error status: 500`)
- 사용자 원문, 사진 data URL, 계약서 원문, 주소, 거래내역을 로그에 남기지 않음
- 오픈뱅킹은 코드 식별자(`org_code_missing` 등)만 기록

## 레이트리밋

- `lib/ratelimit.ts` — IP × 버킷별 슬라이딩 윈도우(5분)
- 버킷: assist(20) / assist-image(10) / contract(10) / grocery(20) /
  grocery-extract(10) / rent(30) / openbanking(30)
- 인메모리라 서버리스 인스턴스별로 분리되는 **보험 수준** —
  운영 전환 시 Upstash Redis·Vercel KV 등 분산 저장소 어댑터로 교체 (코드에 TODO)

## 입력 상한 (서버측 이중 방어)

- 요청 바디 9MB, 이미지 base64 7.5M자, 디코딩 후 5.5MB, MIME 화이트리스트(JPG/PNG/GIF/WebP)
- 계약서 12,000자, 장보기 재료 1,000자
- 413/429 응답은 사용자 친화 문구로 표시

## 보안 헤더 (next.config.mjs)

- X-Content-Type-Options: nosniff / Referrer-Policy / X-Frame-Options: SAMEORIGIN /
  Permissions-Policy (camera=self, mic·geo·payment 차단)
- CSP: 외부 리소스(폰트 CDN, Daum 우편번호, Pexels·식약처 이미지) 화이트리스트 정리 후
  점진 적용 예정 (TODO)

## 오픈뱅킹 (베타)

- 금융결제원 **테스트베드 모의계좌** 전용 — 실계좌·실금융정보 없음 (화면 명시)
- 토큰은 httpOnly 쿠키, 클라이언트 노출 금지, 거래내역 원문 로그 금지
- 실서비스 전 별도 보안 검토 필요 (화면·문서 고지)

## 의존성 보안 (npm audit, 2026-07-03 기준)

- `next@14.2.35`: high 1건(이미지 최적화·미들웨어·RSC 관련 다수 advisory 묶음),
  `postcss<8.5.10`: moderate 1건
- 해결에는 **next@16 메이저 업그레이드가 필요** — 공모전 마감 전 대규모 업그레이드는
  회귀 위험이 커서 보류. 본 앱은 next/image·middleware·WebSocket·i18n을 쓰지 않아
  해당 advisory의 실제 노출면이 제한적임.
- 권장 절차: **별도 브랜치**에서 Next/PostCSS/ESLint 조합을 함께 올리고
  build·lint·전체 라우트 QA 후 병합.
