# 주거비 자동분석 베타 — 로컬 테스트 가이드

> 오픈뱅킹 **테스트베드(모의계좌)** 로 `/money` 베타를 본인 PC에서 끝까지 돌려보는 절차.
> secret은 로컬 `.env.local`에만 두고 절대 커밋·공유하지 마세요(`.gitignore`로 보호됨).

## 0. 사전 준비 (금융결제원 개발자사이트)

1. developers.kftc.or.kr / developers.openbanking.or.kr 에서 **테스트베드** 이용기관·서비스 등록.
2. 필요한 API "이용 중" 전환: **사용자인증(OAuth) · 사용자정보조회 · 거래내역조회**(필요시 잔액조회).
3. **인증정보** 확보: `Client ID`, `Client Secret`(캡처로 노출됐다면 **재발급**), **이용기관코드(10자리)**.
4. **Redirect URI 사전 등록** — 로컬용으로 정확히:
   ```
   http://localhost:3000/api/openbanking/callback
   ```
   (배포 시 실제 도메인 콜백도 추가 등록)
5. **모의계좌 + 모의 거래내역 등록** — 사이트 가이드대로. 이걸 안 하면 거래내역이 0건으로 나옵니다(정상 동작이지만 분석할 데이터가 없음).

## 1. 코드 받기 & 설치

```bash
git clone <repo-url>
cd Nest
git checkout claude/nest-housing-assistant-lfnwbp
npm install
```

## 2. `.env.local` 작성 (프로젝트 루트)

```bash
cp .env.example .env.local   # 또는 직접 생성
```

`.env.local` 에 실제 값 입력:

```
# 둥지 AI (이 베타에서는 '둥지의 한마디' 코멘트에만 사용 — 없어도 분석은 동작)
ANTHROPIC_API_KEY=sk-ant-...          # 없으면 비워둬도 됨(코멘트만 생략)
ANTHROPIC_MODEL=claude-sonnet-4-6

# 오픈뱅킹 테스트베드
OPENBANKING_CLIENT_ID=발급받은_Client_ID
OPENBANKING_CLIENT_SECRET=재발급한_Client_Secret
OPENBANKING_REDIRECT_URI=http://localhost:3000/api/openbanking/callback
OPENBANKING_BASE_URL=https://testapi.openbanking.or.kr
OPENBANKING_ORG_CODE=이용기관코드_10자리   # 거래내역조회 bank_tran_id 생성에 필요
OPENBANKING_SCOPE=login inquiry
OPENBANKING_API_VERSION=v2.0
```

> ⚠️ `.env.local` 변경 후에는 **dev 서버를 껐다 다시** 켜야 반영됩니다.

## 3. 실행

```bash
npm run dev
```

- 브라우저에서 **http://localhost:3000/money** 접속.
- 포트가 3000이 아니면(예: 3001) Redirect URI와 불일치 → 3000을 비우고 다시 실행하거나, 그 포트의 콜백 URI도 KFTC에 등록.

## 4. 흐름 확인

1. `/money` 진입 → 상단 "베타 · 테스트베드(모의계좌)" 고지 + **"내 주거비 분석해보기 (베타)"** 버튼.
2. 버튼 클릭 → 오픈뱅킹 **동의 페이지**로 이동(테스트베드).
3. 모의 인증/동의 → `/api/openbanking/callback`로 복귀 → 자동으로 분석 실행.
4. 결과: **"테스트베드 모의데이터" 배지** + 카테고리별 막대(월세·관리비·전기·가스·수도·통신비) + 총 주거비 (+ 키 있으면 둥지 코멘트).

## 5. 트러블슈팅

| 증상 | 원인 | 해결 |
|---|---|---|
| "베타 준비중 — 설정 필요" | CLIENT_ID/SECRET/REDIRECT_URI 중 빈 값 | `.env.local` 채우고 dev 재시작 |
| `?berror=config` 로 튕김 | 위와 동일(서버가 미설정 판단) | 동일 |
| `?berror=state` | state 쿠키 불일치(다른 포트/도메인, 쿠키 차단) | 항상 `localhost:3000`으로 접속, 쿠키 허용 |
| `?berror=token` | 토큰 교환 실패 | Redirect URI가 KFTC 등록값과 **정확히 일치**(http·포트·경로)하는지, Secret 재발급값 맞는지 확인 |
| "이용기관코드 설정 필요" 안내 | `OPENBANKING_ORG_CODE` 빈 값 | 이용기관코드(10자리) 입력 후 재시도 |
| "최근 출금 거래가 없어요" | 모의 거래내역 미등록 | 테스트베드에서 모의계좌·거래내역 등록 |
| "연결이 만료됐어요" | access_token 만료 | 다시 연결(버튼) |
| 결과에 코멘트 없음 | `ANTHROPIC_API_KEY` 미설정 | 정상(코멘트는 선택). 분석·집계는 정상 동작 |

## 6. 디버깅 팁

- 서버 콘솔에 `[openbanking/analyze]` + 코드 식별자만 찍힙니다(토큰·금융정보는 로그에 남기지 않음).
- API 콘솔(Swagger)에서 거래내역조회를 직접 호출해 본인 테스트 계정의 `fintech_use_num`/응답 필드를 먼저 확인하면 디버깅이 빨라요.
- `rsp_code`가 `A0000`이 아니면 개발자사이트에서 해당 코드 의미(파라미터/권한)를 확인하세요.

## 7. 배포 시

- Vercel/kt cloud 환경변수에 동일 키 입력.
- 실제 도메인 콜백(`https://<도메인>/api/openbanking/callback`)을 오픈뱅킹 사이트에 **추가 등록**.
- 운영(실계좌) 전환은 정식 참가기관 등록·보안점검 필요 → 지원서 로드맵 항목으로.
