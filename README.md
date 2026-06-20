# 둥지 (Nest) 🐣

> **혼자 살아도, 든든하게** — 자취생·청년 1인 가구를 위한 AI 주거 생활 도우미.

집에서 생긴 문제(곰팡이·누수·보일러·변기막힘 등)를 **사진/텍스트**로 물으면, AI가
**① 셀프 응급처치 → ② 집주인 vs 세입자 책임 판단 → ③ 집주인에게 보낼 연락 문구**까지
3단으로 답해줍니다. 정보가 부족한 청년 세입자가 자기 권리를 알고 행동하도록 돕는 것이 목표입니다.

2026 K-AI 콘텐츠 공모전(주최: KT 희망나눔재단) Track B 솔루션 부문 출품작.

## 기능

- **🏠 집 수리 — 살림 응급실 (메인)**: 사진/텍스트 → 응급처치 · 책임 판단(민법 제623조·판례) · 집주인 문구(정중/단호 토글 + 복사)
- **📋 이사·행정 길잡이**: 전입신고·확정일자·보증보험·공과금 명의변경 맞춤 체크리스트
- **💡 공과금 점검**: 요금 입력 → 1인 가구 평균 대비 진단 + 절약 팁 (출처 표기)
- **🛒 혼밥 장보기 코치**: 로드맵 (v2)

설계는 "**엔진 1개 + 테마 입구 4개**" — 입력 UI·API 호출·결과 렌더는 공통 컴포넌트로
재사용하고, 주제별로 시스템 프롬프트만 교체합니다.

## 기술 스택

- **Next.js 14 (App Router)** + TypeScript + Tailwind CSS
- **Anthropic Claude API** (`claude-opus-4-8`, 멀티모달/비전) — 서버 라우트에서만 호출
- 배포: **Vercel**

## 로컬 실행

```bash
# 1) 의존성 설치
npm install

# 2) 환경 변수 설정
cp .env.example .env.local
# .env.local 을 열어 ANTHROPIC_API_KEY 에 실제 키 입력

# 3) 개발 서버
npm run dev   # http://localhost:3000
```

## 환경 변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | ✅ | Claude API 키 (서버에서만 사용, 레포에 커밋 금지) |
| `ANTHROPIC_MODEL` | – | 사용할 모델 ID (기본 `claude-opus-4-8`) |

## 배포 (Vercel)

1. 이 레포를 Vercel에 임포트
2. Environment Variables 에 `ANTHROPIC_API_KEY` 추가
3. 빌드 → 배포 URL 확인 (`npm run build` 가 통과하는지 사전 확인 권장)

## 프로젝트 구조

```
app/
  page.tsx                 # 홈(주제 카드 4개)
  repair/page.tsx          # 집 수리 (메인)
  admin/page.tsx           # 이사·행정
  utility/page.tsx         # 공과금
  api/assist/route.ts      # Claude 호출(공통, topic 분기)
components/
  AssistWorkspace.tsx      # 공통 엔진(입력→되묻기→결과, 단계적 로딩·예시·빈 상태)
  ResultCards.tsx          # 결과 렌더(긴급도 신호등·책임 배너·하단 액션바·다음단계·공과금 차트)
  PhotoUpload.tsx SafetyBanner.tsx NestMark.tsx
  RecentProblems.tsx       # 최근 본 문제(localStorage)
  Onboarding.tsx           # 첫 방문 1회 사용법 오버레이
lib/
  prompts.ts               # topic별 시스템 프롬프트
  types.ts                 # 공통 타입
  history.ts               # 최근 기록(localStorage 전용)
  contacts.ts              # 응급/분쟁 연락처 + 확인 시점
  sample.ts                # 데모용 샘플 결과(곰팡이)
PROMPTS.md                 # 제출용 핵심 프롬프트 정리
```

## 개인정보 · 보안 · 라이선스

- 로그인·회원가입 없음. **개인정보를 수집·저장하지 않습니다.** 업로드한 사진·텍스트는
  API 처리 후 서버에 영구 저장하지 않습니다.
- API 키는 **서버 라우트(`app/api/assist`)에서만** 사용하며 클라이언트 번들/레포에 노출되지 않습니다.
- 책임 판단·문구는 **참고용이며 법적 자문이 아닙니다.** 분쟁 시 주택임대차분쟁조정위원회 또는
  변호사 상담을 권장합니다 (결과·푸터에 명시).
- 폰트: [Pretendard](https://github.com/orioncactus/pretendard) (SIL Open Font License 1.1)
- 아이콘: [lucide-react](https://lucide.dev) (ISC License)
- 공과금 평균은 한국전력·도시가스·통계청 등 공개 기준의 참고 범위이며, 결과 화면에 출처를 표기합니다.

## 라이선스

출품작 코드. 사용된 오픈소스의 라이선스는 위 표기를 따릅니다.
