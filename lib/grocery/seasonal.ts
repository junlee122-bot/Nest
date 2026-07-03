// 월별 제철 식재료 달력 (v6) — 내장 큐레이션 데이터 (한국 노지 기준 통념)
// 키 불필요. 프롬프트 주입 + 장보기 리스트 '제철' 뱃지 매칭에 사용.
// 참고용 생활 정보로, 작황·지역에 따라 다를 수 있음.

export interface SeasonalItem {
  name: string;
  note: string; // 자취생 관점 한 줄
}

export interface SeasonalMonth {
  month: number; // 1~12
  vegetables: SeasonalItem[];
  fruits: SeasonalItem[];
  seafood: SeasonalItem[];
}

export const SEASONAL: SeasonalMonth[] = [
  {
    month: 1,
    vegetables: [
      { name: "시금치(포항초·섬초)", note: "겨울 시금치가 제일 달다" },
      { name: "무", note: "국·조림에 단맛 최고" },
      { name: "배추", note: "속 꽉 차고 값도 착함" },
      { name: "우엉", note: "조림 하나로 일주일 반찬" },
      { name: "연근", note: "아삭한 조림 반찬 제철" },
      { name: "브로콜리", note: "추울수록 달고 저렴" },
    ],
    fruits: [
      { name: "딸기", note: "본격 출하로 값 내려감" },
      { name: "귤", note: "박스로 사도 순삭" },
      { name: "한라봉", note: "지금부터가 진짜 제철" },
      { name: "레드향", note: "당도 절정 시즌" },
    ],
    seafood: [
      { name: "굴", note: "굴국밥·굴전 계절" },
      { name: "아귀", note: "아귀탕 한 그릇 든든" },
      { name: "동태", note: "동태탕 가성비 최고" },
      { name: "과메기", note: "겨울 한정 별미 안주" },
    ],
  },
  {
    month: 2,
    vegetables: [
      { name: "봄동", note: "겉절이 한 접시 뚝딱" },
      { name: "냉이", note: "된장국에 봄 향 가득" },
      { name: "달래", note: "달래장 하나면 밥도둑" },
      { name: "시금치(섬초)", note: "끝물 단맛 절정" },
      { name: "브로콜리", note: "겨울 브로콜리 더 달다" },
    ],
    fruits: [
      { name: "딸기", note: "당도 오르고 값 안정" },
      { name: "한라봉", note: "선물 말고 내 입에" },
      { name: "천혜향", note: "과즙 폭발 시즌" },
      { name: "금귤", note: "통째로 먹는 비타민" },
    ],
    seafood: [
      { name: "굴", note: "산란 전 마지막 제철" },
      { name: "꼬막", note: "꼬막무침 밥도둑" },
      { name: "바지락", note: "국물 내기엔 최고" },
      { name: "아귀", note: "찜·탕으로 든든하게" },
    ],
  },
  {
    month: 3,
    vegetables: [
      { name: "냉이", note: "지금이 향 가장 진함" },
      { name: "달래", note: "무침 한 번에 반찬 완성" },
      { name: "쑥", note: "쑥국 한 번은 먹어야 봄" },
      { name: "미나리", note: "삼겹살에 곁들이면 최고" },
      { name: "봄동", note: "끝물이라 헐값" },
      { name: "부추(봄부추)", note: "봄 부추는 보약이라는 말" },
    ],
    fruits: [
      { name: "딸기", note: "1년 중 가장 저렴" },
      { name: "천혜향", note: "당도 절정 막바지" },
      { name: "한라봉", note: "끝물 세일 노리기" },
      { name: "금귤", note: "새콤달콤 간식용" },
    ],
    seafood: [
      { name: "주꾸미", note: "볶음 한 판의 계절" },
      { name: "바지락", note: "봄 바지락 국물 진함" },
      { name: "도다리", note: "도다리쑥국 계절" },
      { name: "미더덕", note: "찜에 넣으면 향 폭발" },
    ],
  },
  {
    month: 4,
    vegetables: [
      { name: "두릅", note: "데쳐서 초장이면 끝" },
      { name: "취나물", note: "무침 반찬 제철" },
      { name: "미나리", note: "향 좋고 값도 착함" },
      { name: "아스파라거스", note: "국산 나오는 짧은 철" },
      { name: "양배추(봄양배추)", note: "부드러워 생으로도 굿" },
    ],
    fruits: [
      { name: "딸기", note: "끝물, 잼 담그기 최적" },
      { name: "참외", note: "첫물 참외 등장" },
      { name: "토마토", note: "지금부터 맛 들기 시작" },
    ],
    seafood: [
      { name: "주꾸미", note: "머리에 알 꽉 찬 철" },
      { name: "키조개", note: "관자 버터구이 강추" },
      { name: "멸치(봄멸치)", note: "생멸치 조림 별미" },
      { name: "꽃게(암게)", note: "봄엔 알 밴 암게" },
    ],
  },
  {
    month: 5,
    vegetables: [
      { name: "마늘종", note: "볶음 반찬 제철" },
      { name: "완두콩", note: "밥에 넣으면 초록밥" },
      { name: "상추", note: "쌈채소 값 착해짐" },
      { name: "양파(햇양파)", note: "물양파 샐러드 최고" },
      { name: "아스파라거스", note: "구이 하나로 근사한 한 끼" },
      { name: "부추", note: "부침개 하나 뚝딱" },
    ],
    fruits: [
      { name: "참외", note: "당도 오르는 중" },
      { name: "수박", note: "첫물 수박 등장" },
      { name: "토마토", note: "샐러드용으로 최적기" },
      { name: "매실", note: "매실청 담글 준비" },
    ],
    seafood: [
      { name: "꽃게(암게)", note: "알 꽉 찬 마지막 시기" },
      { name: "멸치", note: "봄멸치 기름 오른 철" },
      { name: "갑오징어", note: "쫄깃함 절정" },
    ],
  },
  {
    month: 6,
    vegetables: [
      { name: "감자(하지감자)", note: "1년 중 가장 맛있는 감자" },
      { name: "마늘(햇마늘)", note: "장아찌 담글 시기" },
      { name: "열무", note: "열무김치 국수의 계절" },
      { name: "오이", note: "노지 오이 나오기 시작" },
      { name: "애호박", note: "된장찌개 필수템 제철" },
      { name: "양파", note: "저장 전이라 가장 쌈" },
    ],
    fruits: [
      { name: "참외", note: "1년 중 가장 달다" },
      { name: "수박", note: "본격 출하로 값 하락" },
      { name: "매실", note: "지금 담가야 여름 음료" },
      { name: "자두", note: "새콤한 첫물 자두" },
      { name: "블루베리", note: "국산 나오는 짧은 철" },
    ],
    seafood: [
      { name: "병어", note: "조림·구이 제철" },
      { name: "오징어", note: "물오징어 값 내림" },
      { name: "장어", note: "더위 전 미리 보양" },
      { name: "전복", note: "여름 보양 시즌 시작" },
    ],
  },
  {
    month: 7,
    vegetables: [
      { name: "옥수수(찰옥수수)", note: "쪄 먹기 딱 좋은 철" },
      { name: "가지", note: "볶음 반찬 최저가" },
      { name: "오이", note: "냉국의 계절 도래" },
      { name: "애호박", note: "찌개·전 뭘 해도 굿" },
      { name: "깻잎", note: "쌈·장아찌 제철" },
      { name: "풋고추", note: "된장에 찍으면 반찬 끝" },
    ],
    fruits: [
      { name: "수박", note: "가장 달고 저렴" },
      { name: "복숭아", note: "물복 시즌 개막" },
      { name: "자두", note: "당도 절정" },
      { name: "참외", note: "끝물이라 값 뚝" },
    ],
    seafood: [
      { name: "민어", note: "복달임 대표 생선" },
      { name: "장어", note: "복날 보양 필수" },
      { name: "오징어", note: "볶음·물회로 제격" },
      { name: "전복", note: "삼계탕에 하나 추가" },
    ],
  },
  {
    month: 8,
    vegetables: [
      { name: "옥수수(찰옥수수)", note: "막바지, 냉동 쟁여두기" },
      { name: "가지", note: "무침 한 접시 순삭" },
      { name: "오이", note: "노지 오이 가장 쌈" },
      { name: "풋고추", note: "가장 값싼 밑반찬" },
      { name: "애호박", note: "여름 내내 믿는 반찬" },
      { name: "깻잎", note: "장아찌 담그기 좋은 때" },
    ],
    fruits: [
      { name: "복숭아", note: "딱복·물복 모두 절정" },
      { name: "포도(캠벨)", note: "향 진한 국산 포도 철" },
      { name: "수박", note: "막바지 세일 노리기" },
      { name: "자두", note: "끝물 새콤함 즐기기" },
    ],
    seafood: [
      { name: "오징어", note: "물회·볶음 제철" },
      { name: "전복", note: "말복 보양 마무리" },
      { name: "갈치", note: "가을 갈치 미리 맛보기" },
    ],
  },
  {
    month: 9,
    vegetables: [
      { name: "고구마(햇고구마)", note: "햇고구마 출하 시작" },
      { name: "토란", note: "추석 토란국 재료" },
      { name: "표고버섯", note: "가을 표고 향이 다름" },
      { name: "단호박", note: "찜 하나로 든든 간식" },
      { name: "아욱", note: "가을 아욱국은 별미" },
    ],
    fruits: [
      { name: "포도(샤인머스캣)", note: "물량 늘어 값 뚝" },
      { name: "배(햇배)", note: "햇배 나오는 철" },
      { name: "사과(홍로)", note: "추석 햇사과 등장" },
      { name: "무화과", note: "생과 맛볼 짧은 철" },
    ],
    seafood: [
      { name: "전어", note: "집 나간 입맛도 돌아옴" },
      { name: "대하", note: "소금구이 계절 개막" },
      { name: "꽃게(수게)", note: "가을엔 살 찬 수게" },
      { name: "갈치", note: "기름 오른 가을 갈치" },
    ],
  },
  {
    month: 10,
    vegetables: [
      { name: "고구마", note: "군고구마 시즌 준비" },
      { name: "무(가을무)", note: "가을무는 보약이란 말" },
      { name: "늙은호박", note: "호박죽의 계절" },
      { name: "표고버섯", note: "구이·볶음 다 맛있는 때" },
      { name: "연근(햇연근)", note: "햇연근 아삭함 최고" },
      { name: "당근(햇당근)", note: "달큰한 햇당근 철" },
    ],
    fruits: [
      { name: "사과", note: "물량 쏟아져 가성비 굿" },
      { name: "감(단감)", note: "아삭한 단감 개시" },
      { name: "배", note: "지금이 가장 촉촉" },
      { name: "석류", note: "국산 석류 짧은 철" },
    ],
    seafood: [
      { name: "고등어", note: "가을 고등어 기름 최고" },
      { name: "꽃게(수게)", note: "살 꽉 찬 절정기" },
      { name: "전어", note: "끝물 막차 타기" },
      { name: "대하", note: "구이 마지막 기회" },
    ],
  },
  {
    month: 11,
    vegetables: [
      { name: "배추(김장배추)", note: "1년 중 가장 저렴" },
      { name: "무(김장무)", note: "달고 시원한 국물용" },
      { name: "시금치", note: "노지 시금치 개시" },
      { name: "브로콜리", note: "국산 제철 시작" },
      { name: "우엉", note: "조림 반찬 제철" },
      { name: "연근", note: "아삭함 유지되는 때" },
    ],
    fruits: [
      { name: "귤", note: "본격 출하 가성비 갑" },
      { name: "사과(부사)", note: "저장 전이라 가장 신선" },
      { name: "감(대봉)", note: "홍시로 익혀 먹기" },
      { name: "유자", note: "유자청 담글 시기" },
    ],
    seafood: [
      { name: "굴", note: "제철 시작, 값도 착함" },
      { name: "방어", note: "대방어 시즌 개막" },
      { name: "꼬막", note: "무침 반찬 제철" },
      { name: "홍합", note: "탕 하나로 안주 완성" },
    ],
  },
  {
    month: 12,
    vegetables: [
      { name: "시금치(섬초)", note: "노지 시금치 단맛 최고" },
      { name: "무", note: "뭇국 한 솥이면 일주일" },
      { name: "배추", note: "김장 끝물 헐값 득템" },
      { name: "브로콜리", note: "추울수록 달다" },
      { name: "대파", note: "겨울 대파가 가장 달다" },
    ],
    fruits: [
      { name: "귤", note: "최성수기, 박스 구매 각" },
      { name: "딸기", note: "첫물 딸기 등장" },
      { name: "유자", note: "유자차로 감기 예방" },
    ],
    seafood: [
      { name: "방어(대방어)", note: "기름기 절정, 회 추천" },
      { name: "굴", note: "굴전·굴밥의 계절" },
      { name: "과메기", note: "겨울 한정 술안주" },
      { name: "동태", note: "동태탕 값싸고 시원" },
    ],
  },
];
