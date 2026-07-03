# 둥지(Nest) 디자인 시스템 요약

Figma 없이도 참조할 수 있는 코드 기준 문서입니다. 토큰의 원본은 `tailwind.config.ts`,
공통 클래스는 `app/globals.css`입니다.

## 1. Foundations

### 색상 (tailwind.config.ts)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| brand | #0DA05C | 주요 행동·핵심 CTA (hover #0B8A4F, tint #E7F6EE, deep #086B3D) |
| ink / bg / card / line / muted | #1A1E1B / #F6F7F6 / #FFF / #ECEEEC / #79817B | 텍스트·배경·헤어라인 |
| sun / coral / sky / straw | 파스텔 계열 (각 tint·deep) | 기능 블록·아이콘 로테이션 |
| warn / danger / ok | #F5A623 / #B91C1C / #15803D | 안전 시맨틱 — 브랜드와 절대 혼용 금지 |

색상 규칙: Green=행동/진행, Yellow·Orange=주의/초과, Red=위험/긴급/법률 리스크,
Sky=정보/데이터 출처, Neutral=보조. **상태는 색+텍스트를 항상 병행**(색맹 대응).

### 타이포그래피

- 디스플레이: Gmarket Sans — h1과 `.font-display`만
- 본문: Pretendard
- 크기 가이드: 버튼·탭 13~15px+, 카드 제목 15~17px, 본문 13~15px, 보조 12~13px,
  배지 10~12px. `text-[9px]` 사용 금지 (현재 0곳).
- 폼 컨트롤은 16px(text-base) — iOS 자동 줌 방지. 데스크톱은 `sm:text-sm` 축소 허용.

### 라운드·그림자·모션

- radius: xl 1rem / 2xl 1.375rem / 3xl 1.75rem (플레이풀 카드)
- shadow: card(은은) / lift(부양) / cta(브랜드 발광)
- 모션: framer-motion(LazyMotion domMax + `m.*`만), 실기능 화면은 결과 등장·카드 전환만,
  쇼케이스는 적극 사용. `MotionConfig reducedMotion="user"` + CSS 애니메이션은
  prefers-reduced-motion 미디어쿼리로 정지.

## 2. 컴포넌트 (코드 기준)

- 버튼: `.btn-primary`(52px, 브랜드) / `.btn-ghost`(보조) — globals.css
- 카드: `.card` + 위계 variant는 톤으로 구분
  - Hero(판단·CTA): 위험도 tint 배경 배너
  - Action(바로 누를 것): 브랜드 tint 배지 + 버튼
  - Info(근거): 접힘(details) 기본
  - Warning: warn/danger tint + 아이콘
  - Data: 출처 배지 + 각주
  - Demo: "예시/데모 재현" 배지
- 배지: PriceSourceBadge(오늘 시세/참고가/AI 추정/없음), RISK_BADGE(높음/주의/참고),
  UrgencySignal(신호등 3색), TrustBadges(신뢰 5종), BETA/예시
- 공통 앱 셸: AppBar(sticky) + AppTabBar(HIDE_PATHS로 /showcase 숨김)
- 상태: 로딩(둥이 thinking + skeleton), 빈 상태(둥이 hello), 에러(role=alert + 재시도)

## 3. 마스코트(둥이) 사용 규칙

- 적극: 홈, 온보딩, 인트로, 빈 상태, 로딩, 생활 도구
- 소량: 집수리 결과 (로딩까지만)
- 최소(사용 안 함): 계약서 결과, 월세 판단, 머니/오픈뱅킹, 법률·개인정보 문구 주변
- 법률·금융 화면은 마스코트 대신 근거·출처·날짜·주의 문구 우선

## 4. 화면 인벤토리

홈 / 수리 입력·결과 / 계약서 입력·결과 / 시세 입력·결과 / 장보기 계획·남은재료·냉장고 사진 /
머니 베타 / 공과금 / 행정 / 전체 / 쇼케이스(기본·발표자 모드)

## 5. 접근성 규칙

- 모든 input에 label(또는 sr-only label), placeholder를 label 대용 금지
- 토글 aria-pressed, 탭 role=tablist/tab/aria-selected, 에러 role=alert,
  로딩 aria-live, 장식 SVG aria-hidden
- 터치 타깃 44px 근처(btn-primary 52px), focus-visible 링 명확
- 쇼케이스 자동재생은 opt-in + 일시정지 가능, 방향키·Esc 지원
