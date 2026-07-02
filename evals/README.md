# evals — 둥지 응답 품질 회귀 테스트

프롬프트나 모델을 바꾼 뒤 핵심 동작이 깨지지 않았는지 확인하는 하네스입니다.

## 무엇을 검사하나

`cases.json`의 케이스별로 `/api/assist`를 호출해 다음을 확인합니다.

- **되묻기 정책**: 곰팡이(원인에 따라 책임이 갈림)만 1회 되묻고, 누수·보일러·가스는 바로 결과
- **책임 판정**: 누수·보일러 → `landlord`, 전구 → `tenant` 등
- **긴급도·안전**: 가스 냄새 → `emergency` + `safety.level: danger`
- **톤 규칙 회귀**: 단호 문구에 위협성 표현("손해배상을 청구", "오늘 중으로" 등) 금지
- **구조**: polite/firm 문구·disclaimer 누락 여부

## 실행

```bash
# 1) 키가 설정된 서버 실행
npm run dev

# 2) 별도 터미널에서
node evals/run.mjs                     # 기본 http://localhost:3000
BASE=http://localhost:3100 node evals/run.mjs
ONLY=gas-emergency node evals/run.mjs  # 케이스 1개만
```

## 주의

- 실제 Anthropic API를 호출합니다 — 케이스당 1콜(기본 8콜) 비용 발생.
- 모델 출력은 확률적입니다(temperature 0.2). 간헐적 1회 실패는 재실행으로 확인하고,
  **같은 케이스가 2회 연속 실패할 때만** 프롬프트 회귀로 간주하세요.
- 케이스를 추가할 때는 "정답이 하나로 수렴하는" 상황만 넣으세요. 애매한 상황은
  `verdict: ["landlord", "depends"]`처럼 허용 집합으로 표현합니다.
