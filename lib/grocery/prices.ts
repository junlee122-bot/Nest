// 자취 장보기 참고 가격표 (v6) — 내장 큐레이션 데이터 (서울 소매가 범위, 2025~2026)
// 키 불필요. est_price 접지(프롬프트 주입) + 항목별 '참고가' 표기에 사용.
// KAMIS 키가 있으면 '오늘 시세'가 우선 표시된다. 어디까지나 참고용.

export interface PriceRef {
  name: string;
  unit: string; // 자취생이 실제 사는 단위
  low: number; // 원
  high: number; // 원
  note?: string;
}

export const PRICE_REFS: PriceRef[] = [
  { name: "쌀(백미)", unit: "10kg", low: 27000, high: 40000, note: "시세 변동 큼" },
  { name: "즉석밥", unit: "1개(210g)", low: 900, high: 2000, note: "낱개 정가와 묶음 할인 개당 단가 차이 큼" },
  { name: "라면", unit: "1묶음(5개입)", low: 3000, high: 4800 },
  { name: "소면", unit: "1봉(900g)", low: 2000, high: 4500 },
  { name: "스파게티면", unit: "1봉(500g)", low: 1500, high: 3500 },
  { name: "식빵", unit: "1봉(380g 내외)", low: 1800, high: 3800 },
  { name: "계란(특란)", unit: "10구", low: 3000, high: 4800, note: "시세 변동 큼" },
  { name: "삼겹살(국산 냉장)", unit: "100g", low: 1900, high: 3800, note: "시세 변동 큼" },
  { name: "돼지 앞다리살", unit: "100g", low: 1100, high: 2000 },
  { name: "닭가슴살(냉장)", unit: "100g", low: 900, high: 1600 },
  { name: "두부(부침용)", unit: "1모(300g)", low: 1000, high: 2800, note: "PB와 브랜드 제품 가격차 큼" },
  { name: "순두부", unit: "1봉(350g)", low: 1000, high: 2200 },
  { name: "참치캔", unit: "1캔(150g)", low: 1800, high: 3200 },
  { name: "스팸(런천미트)", unit: "1캔(200g)", low: 3500, high: 5500 },
  { name: "비엔나소시지", unit: "1봉(300g)", low: 3000, high: 5500 },
  { name: "사각어묵", unit: "1봉(300g)", low: 2000, high: 4500 },
  { name: "대파", unit: "1단", low: 1800, high: 4500, note: "시세 변동 큼" },
  { name: "양파", unit: "1망(1.5kg)", low: 3000, high: 5500, note: "시세 변동 큼" },
  { name: "감자", unit: "1kg", low: 2500, high: 5000, note: "시세 변동 큼" },
  { name: "당근", unit: "1개", low: 700, high: 1500 },
  { name: "애호박", unit: "1개", low: 1000, high: 3500, note: "시세 변동 큼" },
  { name: "오이", unit: "1개", low: 800, high: 2000, note: "시세 변동 큼" },
  { name: "콩나물", unit: "1봉(300g)", low: 1000, high: 2200 },
  { name: "상추", unit: "1봉(150g)", low: 1500, high: 4000, note: "시세 변동 큼" },
  { name: "깻잎", unit: "1봉(30장)", low: 1000, high: 2500 },
  { name: "깐마늘", unit: "1봉(200g)", low: 2000, high: 4500 },
  { name: "팽이버섯", unit: "1봉(150g)", low: 500, high: 1500 },
  { name: "바나나", unit: "1송이(1kg 내외)", low: 2800, high: 4500 },
  { name: "사과", unit: "1개", low: 1500, high: 3500, note: "시세 변동 큼" },
  { name: "방울토마토", unit: "1팩(500g)", low: 3500, high: 7000, note: "시세 변동 큼" },
  { name: "흰우유", unit: "1L", low: 2400, high: 3300 },
  { name: "슬라이스 치즈", unit: "1봉(18매)", low: 4000, high: 7500 },
  { name: "생수", unit: "2L×6병", low: 2400, high: 6500, note: "PB와 브랜드 생수 가격차 큼" },
  { name: "포장김치", unit: "1kg", low: 7000, high: 13000 },
  { name: "냉동만두(왕교자)", unit: "1봉(1kg 내외)", low: 7500, high: 12000 },
  { name: "도시락김", unit: "1묶음(4.5g×16봉)", low: 3500, high: 7000, note: "시세 변동 큼" },
  { name: "식용유(콩기름)", unit: "1병(900ml)", low: 4000, high: 7000 },
  { name: "진간장", unit: "1병(860ml)", low: 3500, high: 8000 },
  { name: "고추장", unit: "1통(500g)", low: 5000, high: 9000 },
  { name: "된장", unit: "1통(500g)", low: 4000, high: 8000 },
  { name: "설탕(백설탕)", unit: "1kg", low: 1700, high: 3000 },
  { name: "즉석카레(레토르트)", unit: "1개(200g)", low: 1200, high: 2500 },
  { name: "떡볶이떡", unit: "1봉(500g)", low: 2000, high: 4000 },
];
