// "내 에어컨 찾기" 공통 타입 (v16)
//
// 사진/모델명으로 제품을 찾는 기능은 전부 "선택"이다 — 이 타입들이 없어도
// lib/electricity 계산기는 종류·평수만으로 완전히 동작한다.

import type { AirconType } from "@/lib/electricity";

/** 업로드 사진의 종류 (사용자가 지정) */
export type AirconPhotoKind = "nameplate" | "energy-label" | "product";

export const PHOTO_KIND_LABELS: Record<AirconPhotoKind, string> = {
  nameplate: "제품 명판",
  "energy-label": "에너지효율 라벨",
  product: "제품 전체 모습",
};

/** 라벨 사진에서 읽어낸 정보 — 신뢰도가 낮은 값은 null */
export interface AirconImageIdentification {
  brand: string | null;
  modelNumber: string | null;
  alternativeModelNumbers: string[];
  productType: AirconType | "unknown";
  indoorUnitModel: string | null;
  outdoorUnitModel: string | null;
  /** 냉방 "소비전력"(입력전력) W — 냉방능력 W와 절대 혼동 금지 */
  ratedCoolingPowerW: number | null;
  /** 냉방능력(capacity) W — 참고용, 계산기 override에 쓰지 않는다 */
  coolingCapacityW: number | null;
  ratedVoltageV: number | null;
  manufacturingYear: number | null;
  confidence: {
    brand: number;
    modelNumber: number;
    ratedCoolingPowerW: number;
  };
  /** 라벨에서 실제로 보인 텍스트 근거 (시리얼은 제거됨) */
  visibleEvidence: string[];
  warnings: string[];
}

/** 제품 검색 후보 (네이버 쇼핑/이미지 검색 정규화 결과) */
export interface AirconProductCandidate {
  id: string;
  brand: string | null;
  modelNumber: string | null;
  title: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  productUrl: string;
  mallName: string | null;
  productType: AirconType | "unknown";
  exactModelMatch: boolean;
  matchScore: number;
  source: "naver-shopping" | "naver-image";
  sourceLabel: string;
}

/** 계산기에 적용된 냉방 소비전력의 출처 */
export type CoolingPowerSource =
  | "label-photo" // 촬영한 라벨에서 높은 신뢰도로 읽음
  | "user-input" // 사용자가 직접 입력
  | "manufacturer" // 공식 제조사 출처
  | "cross-checked-search" // 여러 검색 결과에서 같은 모델·같은 값 일치
  | "area-estimate"; // 평수 기반 자동 추정 (기본)

export const POWER_SOURCE_LABELS: Record<CoolingPowerSource, string> = {
  "label-photo": "제품 라벨",
  "user-input": "직접 입력",
  manufacturer: "제조사 사양",
  "cross-checked-search": "검색 교차 확인",
  "area-estimate": "평수 기준 자동 추정",
};

/** 사용자가 "내 에어컨이 맞아요"로 확정한 제품 요약 (localStorage 보존용 최소 정보) */
export interface SelectedAirconProduct {
  brand: string | null;
  modelNumber: string | null;
  title: string;
  imageUrl: string | null;
  productUrl: string;
  sourceLabel: string;
  productType: AirconType | "unknown";
}

/** POST /api/aircon/identify 응답 */
export type AirconIdentifyResponse =
  | { ok: true; identification: AirconImageIdentification }
  | { ok: false; error: string };

/** GET /api/aircon/products 응답 — 키 미설정이어도 계산기는 계속 동작해야 한다 */
export type AirconProductsResponse =
  | { ok: true; configured: boolean; candidates: AirconProductCandidate[] }
  | { ok: false; error: string };
