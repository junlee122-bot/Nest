"use client";

// 내 에어컨 찾기 (v16) — 라벨 사진 판독 + 모델명 검색으로 계산 정확도 높이기 (선택 기능)
//
// 원칙:
// - 이 패널이 닫혀 있어도, 실패해도, 키가 없어도 기존 종류·평수 계산은 완전히 동작한다
// - 모델은 절대 단정하지 않는다: "라벨에서 OOO로 읽었어요" + 사용자가 "내 에어컨이 맞아요"를
//   눌러야만 적용된다 (후보가 하나뿐이어도 자동 확정 금지)
// - 냉방능력 W는 소비전력으로 쓰지 않는다 (서버 sanitize + 여기서도 ratedCoolingPowerW만 사용)
// - 시리얼 번호는 서버에서 제거되고, 사진은 분석 외 목적으로 저장하지 않는다
import { useRef, useState } from "react";
import {
  AirVent,
  Camera,
  Check,
  ChevronDown,
  ExternalLink,
  Fan,
  Keyboard,
  Layers,
  Luggage,
  PanelTop,
  Search,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AirconType } from "@/lib/electricity";
import { AIRCON_PROFILES } from "@/lib/electricity";
import {
  PHOTO_KIND_LABELS,
  type AirconIdentifyResponse,
  type AirconImageIdentification,
  type AirconPhotoKind,
  type AirconProductCandidate,
  type AirconProductsResponse,
  type CoolingPowerSource,
  type SelectedAirconProduct,
} from "@/lib/aircon/types";
import {
  LABEL_POWER_MIN_CONFIDENCE,
  powerSourceText,
  resolveCoolingPower,
} from "@/lib/aircon/power";

const MAX_PHOTOS = 3;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TARGET_DIM = 1800; // 긴 변 1600~2000px 권장 범위의 중간값
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TYPE_ICONS: Record<AirconType | "unknown", LucideIcon> = {
  wall: AirVent,
  standing: Fan,
  window: PanelTop,
  portable: Luggage,
  multi: Layers,
  unknown: Fan,
};

interface Photo {
  id: string;
  dataUrl: string;
  kind: AirconPhotoKind;
}

export interface AirconIdentifyProps {
  currentType: AirconType | null;
  appliedPowerW: number | null;
  powerSource: CoolingPowerSource;
  onApplyPower: (watts: number, source: CoolingPowerSource) => void;
  onApplyType: (t: AirconType) => void;
  product: SelectedAirconProduct | null;
  onProductChange: (p: SelectedAirconProduct | null) => void;
}

export default function AirconIdentify({
  currentType,
  appliedPowerW,
  powerSource,
  onApplyPower,
  onApplyType,
  product,
  onProductChange,
}: AirconIdentifyProps) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<"photo" | "model" | null>(null);

  // 사진 경로
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [reading, setReading] = useState(false); // 파일 리사이즈 중 (중복 업로드 방지)
  const [uploadError, setUploadError] = useState<string | null>(null); // 업로드 오류
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null); // 분석 오류 (구분)
  const [ident, setIdent] = useState<AirconImageIdentification | null>(null);
  const [powerNote, setPowerNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 모델명 경로 (사진 판독 후에도 이 값으로 검색)
  const [brandInput, setBrandInput] = useState("");
  const [modelInput, setModelInput] = useState("");

  // 검색
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [candidates, setCandidates] = useState<AirconProductCandidate[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({}); // "아니에요"로 제외한 후보
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  async function handleFiles(files: FileList | null) {
    if (!files || reading) return; // reading 게이트 — 리사이즈 중 중복 호출 방지
    setUploadError(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setUploadError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
      return;
    }
    const list = Array.from(files);
    if (list.length > room) {
      setUploadError(`사진은 최대 ${MAX_PHOTOS}장까지라 앞의 ${room}장만 추가했어요.`);
    }
    setReading(true);
    try {
      const prepared: string[] = [];
      for (const file of list.slice(0, room)) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setUploadError("JPG·PNG·WebP 이미지만 올릴 수 있어요.");
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          setUploadError("파일당 8MB 이하만 올릴 수 있어요. 용량을 줄여 다시 시도해주세요.");
          continue;
        }
        try {
          // canvas 재인코딩 — 긴 변 1800px 리사이즈 + EXIF 메타데이터 제거
          prepared.push(await resizeToDataUrl(file));
        } catch {
          setUploadError("사진을 읽지 못했어요. 다른 사진으로 다시 시도해주세요.");
        }
      }
      if (prepared.length > 0) {
        // kind는 updater 안에서 prev 기준으로 결정 (클로저의 photos.length 사용 금지)
        setPhotos((prev) =>
          [
            ...prev,
            ...prepared.map((dataUrl, i) => ({
              id: `p${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
              dataUrl,
              kind: (prev.length + i === 0 ? "nameplate" : "energy-label") as AirconPhotoKind,
            })),
          ].slice(0, MAX_PHOTOS)
        );
      }
    } finally {
      setReading(false);
    }
  }

  async function analyze() {
    if (photos.length === 0 || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setIdent(null);
    setPowerNote(null);
    try {
      const res = await fetch("/api/aircon/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: photos.map((p) => ({ dataUrl: p.dataUrl, kind: p.kind })),
        }),
      });
      const json = (await res.json()) as AirconIdentifyResponse;
      if (!json.ok) {
        setAnalyzeError(json.error);
        return;
      }
      const id = json.identification;
      setIdent(id);
      if (id.modelNumber) setModelInput(id.modelNumber);
      if (id.brand) setBrandInput(id.brand);

      // 소비전력: 우선순위 함수(resolveCoolingPower)를 통해 높은 신뢰도일 때만 자동 반영
      const resolved = resolveCoolingPower({
        labelPhoto:
          id.ratedCoolingPowerW !== null
            ? { watts: id.ratedCoolingPowerW, confidence: id.confidence.ratedCoolingPowerW }
            : null,
      });
      if (resolved.source === "label-photo" && resolved.watts !== null) {
        onApplyPower(resolved.watts, "label-photo");
        setPowerNote(
          `라벨에서 읽은 냉방 소비전력 ${resolved.watts.toLocaleString("ko-KR")}W를 계산에 반영했어요.`
        );
      }
      // 낮은 신뢰도로 읽힌 값은 아래에서 확인 버튼으로만 노출
    } catch {
      setAnalyzeError("분석 요청에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function searchProducts() {
    const model = modelInput.trim();
    if (model.length < 3 || searching) return;
    setSearching(true);
    setSearchError(null);
    setSearched(false); // 재검색 실패 시 이전 성공의 "찾지 못했어요"가 남지 않게 리셋
    setCandidates([]);
    setDismissed({});
    setBrokenImages({});
    try {
      const params = new URLSearchParams({ model });
      if (brandInput.trim()) params.set("brand", brandInput.trim());
      if (currentType) params.set("type", currentType);
      const res = await fetch(`/api/aircon/products?${params.toString()}`);
      const json = (await res.json()) as AirconProductsResponse;
      if (!json.ok) {
        setSearchError(json.error);
        return;
      }
      setConfigured(json.configured);
      setCandidates(json.candidates);
      setSearched(true);
    } catch {
      setSearchError("검색 요청에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSearching(false);
    }
  }

  function confirmCandidate(c: AirconProductCandidate) {
    // 자동 확정 금지 — 이 함수는 "내 에어컨이 맞아요" 클릭에서만 호출된다
    onProductChange({
      brand: c.brand,
      modelNumber: c.modelNumber ?? (modelInput.trim() || null),
      title: c.title,
      imageUrl: brokenImages[c.id] ? null : c.imageUrl,
      productUrl: c.productUrl,
      sourceLabel: c.sourceLabel,
      productType: c.productType,
    });
    if (c.productType !== "unknown" && c.productType !== currentType) {
      onApplyType(c.productType);
    }
  }

  const modelUncertain =
    ident !== null &&
    (ident.modelNumber === null || ident.confidence.modelNumber < LABEL_POWER_MIN_CONFIDENCE);

  // "라벨 소비전력 확인됨"은 라벨 사진 출처일 때만 — 다른 출처는 각자 문구로 표기
  const powerVerified = appliedPowerW !== null && powerSource === "label-photo";

  return (
    <section className="card p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="aircon-identify-panel"
        className="flex w-full items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-tint text-coral-deep">
          <Sparkles size={18} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">
            내 에어컨 사진으로 정확도 높이기
          </span>
          <span className="block text-[12px] text-muted">
            제품 라벨을 찍거나 모델명을 입력하면 소비전력을 찾아드려요 (선택)
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {/* 선택된 제품 요약 — 패널이 닫혀 있어도 표시 */}
      {product && (
        <SelectedProductSummary
          product={product}
          powerVerified={powerVerified}
          powerSource={powerSource}
          appliedPowerW={appliedPowerW}
          onClear={() => onProductChange(null)}
        />
      )}

      {open && (
        <div id="aircon-identify-panel" className="mt-4 space-y-4">
          {/* 경로 선택 */}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="찾기 방법 선택">
            <button
              type="button"
              onClick={() => setPath("photo")}
              className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border p-3 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                path === "photo"
                  ? "border-brand/50 bg-brand-tint text-brand-deep"
                  : "border-line bg-card text-ink hover:border-brand/30"
              }`}
            >
              <Camera size={17} aria-hidden /> 제품 라벨 촬영하기
            </button>
            <button
              type="button"
              onClick={() => setPath("model")}
              className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border p-3 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                path === "model"
                  ? "border-brand/50 bg-brand-tint text-brand-deep"
                  : "border-line bg-card text-ink hover:border-brand/30"
              }`}
            >
              <Keyboard size={17} aria-hidden /> 모델명 직접 입력하기
            </button>
          </div>

          {/* ── 경로 1: 사진 ── */}
          {path === "photo" && (
            <div className="space-y-3">
              <ul className="space-y-1 rounded-2xl bg-bg p-3.5 text-[12px] leading-relaxed text-muted">
                <li>에어컨 전체 모습보다 옆면이나 아래쪽 제품 라벨을 찍으면 더 정확해요.</li>
                <li>모델명, 정격전압, 냉방 소비전력이 선명하게 보이도록 찍어주세요.</li>
                <li>시리얼 번호는 저장하지 않아요.</li>
              </ul>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />

              {photos.length > 0 && (
                <ul className="space-y-2">
                  {photos.map((p, i) => (
                    <li key={p.id} className="rounded-2xl border border-line p-2.5">
                      <div className="flex items-start gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.dataUrl}
                          alt={`업로드한 ${PHOTO_KIND_LABELS[p.kind]} 사진 ${i + 1} 미리보기`}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-muted">사진 종류</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(Object.keys(PHOTO_KIND_LABELS) as AirconPhotoKind[]).map((k) => (
                              <label
                                key={k}
                                className={`cursor-pointer rounded-lg border px-2 py-1 text-[11px] font-semibold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                                  p.kind === k
                                    ? "border-brand/50 bg-brand-tint text-brand-deep"
                                    : "border-line bg-card text-muted"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`photo-kind-${p.id}`}
                                  checked={p.kind === k}
                                  onChange={() =>
                                    setPhotos((prev) =>
                                      prev.map((x) => (x.id === p.id ? { ...x, kind: k } : x))
                                    )
                                  }
                                  className="sr-only"
                                />
                                {PHOTO_KIND_LABELS[k]}
                              </label>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`사진 ${i + 1} 삭제`}
                          onClick={() => setPhotos((prev) => prev.filter((x) => x.id !== p.id))}
                          className="shrink-0 rounded-full bg-bg p-1.5 text-muted transition hover:text-danger"
                        >
                          <X size={15} aria-hidden />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2">
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={reading}
                    className="min-h-[44px] flex-1 rounded-xl border-2 border-dashed border-line bg-bg px-3 text-[13px] font-semibold text-muted transition hover:border-brand/50 hover:text-brand-deep disabled:opacity-50"
                  >
                    <Camera size={15} className="mr-1 inline" aria-hidden />
                    {reading ? "사진 처리 중…" : `사진 추가 (${photos.length}/${MAX_PHOTOS})`}
                  </button>
                )}
                {photos.length > 0 && (
                  <button
                    type="button"
                    onClick={analyze}
                    disabled={analyzing || reading}
                    className="min-h-[44px] flex-1 rounded-xl bg-brand px-3 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {analyzing ? "라벨을 읽는 중…" : "사진 분석하기"}
                  </button>
                )}
              </div>

              {uploadError && (
                <p role="alert" className="text-[13px] font-medium text-danger">
                  {uploadError}
                </p>
              )}
              {analyzeError && (
                <p role="alert" className="text-[13px] font-medium leading-relaxed text-danger">
                  {analyzeError}
                </p>
              )}

              {/* 판독 결과 — 단정 금지: "라벨에서 ~로 읽었어요" */}
              {ident && (
                <div className="rounded-2xl border border-line bg-bg p-3.5 text-[13px] leading-relaxed text-ink">
                  {ident.modelNumber ? (
                    <p>
                      라벨에서 <b>{ident.brand ? `${ident.brand} ` : ""}{ident.modelNumber}</b>
                      {modelUncertain ? "로 읽었지만 글자가 흐려 정확하지 않을 수 있어요." : "로 읽었어요."}
                    </p>
                  ) : (
                    <p>글자가 흐려 모델번호를 정확히 읽지 못했어요. 아래에 직접 입력해주세요.</p>
                  )}
                  {ident.alternativeModelNumbers.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] text-muted">다른 읽기:</span>
                      {ident.alternativeModelNumbers.map((alt) => (
                        <button
                          key={alt}
                          type="button"
                          onClick={() => setModelInput(alt)}
                          className="rounded-lg border border-line bg-card px-2 py-0.5 text-[12px] font-semibold text-ink transition hover:border-brand/40"
                        >
                          {alt}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* 노트는 실제 적용 상태와 함께만 표시 — 초기화·수동 수정 후 잔존 방지 */}
                  {powerNote && powerSource === "label-photo" && appliedPowerW !== null && (
                    <p role="status" className="mt-1.5 font-semibold text-ok">
                      {powerNote}
                    </p>
                  )}
                  {ident.ratedCoolingPowerW !== null &&
                    ident.confidence.ratedCoolingPowerW < LABEL_POWER_MIN_CONFIDENCE && (
                      <div className="mt-1.5">
                        <p className="text-muted">
                          냉방 소비전력이 {ident.ratedCoolingPowerW.toLocaleString("ko-KR")}W로
                          보이지만 선명하지 않아요. 라벨과 일치하면 적용해주세요.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyPower(ident.ratedCoolingPowerW as number, "label-photo");
                            setPowerNote(
                              `냉방 소비전력 ${(ident.ratedCoolingPowerW as number).toLocaleString("ko-KR")}W를 계산에 반영했어요.`
                            );
                          }}
                          className="mt-1 rounded-lg bg-brand px-2.5 py-1 text-[12px] font-bold text-white"
                        >
                          이 값 적용하기
                        </button>
                      </div>
                    )}
                  {ident.warnings.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-[12px] text-muted">
                      {ident.warnings.map((w) => (
                        <li key={w}>· {w}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 경로 2 + 검색 (사진 판독 후에도 공통 사용) ── */}
          {(path === "model" || ident !== null) && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-[1fr_1.6fr] gap-2">
                <div>
                  <label htmlFor="aircon-brand-input" className="text-[12px] font-bold text-ink">
                    제조사 (선택)
                  </label>
                  <input
                    id="aircon-brand-input"
                    type="text"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="예) LG"
                    className="mt-1 w-full rounded-xl border border-line bg-bg p-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label htmlFor="aircon-model-input" className="text-[12px] font-bold text-ink">
                    모델번호
                  </label>
                  <input
                    id="aircon-model-input"
                    type="text"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    placeholder="예) SQ07EJ1WAS"
                    className="mt-1 w-full rounded-xl border border-line bg-bg p-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted">
                모델번호는 실내기 옆·아래 라벨이나 구매 내역에서 확인할 수 있어요.
              </p>
              <button
                type="button"
                onClick={searchProducts}
                disabled={searching || modelInput.trim().length < 3}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-3 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Search size={15} aria-hidden />
                {searching ? "제품을 찾는 중…" : "이 모델로 제품 검색"}
              </button>

              {searchError && (
                <p role="alert" className="text-[13px] font-medium text-danger">
                  {searchError}
                </p>
              )}

              {searched && configured === false && (
                <p role="status" className="rounded-xl bg-bg p-3 text-[12px] leading-relaxed text-muted">
                  제품 검색 키가 설정되지 않아 검색은 건너뛰어요. 라벨의 냉방 소비전력을 위
                  고급 설정에 직접 입력하면 같은 정확도를 얻을 수 있어요.
                </p>
              )}

              {searched &&
                configured === true &&
                candidates.length > 0 &&
                candidates.every((c) => dismissed[c.id]) &&
                !product && (
                  <div role="status" className="rounded-xl bg-bg p-3 text-[12px] leading-relaxed text-muted">
                    모두 아니라면 모델번호를 수정해 다시 검색하거나, 고급 설정에 냉방 소비전력을
                    직접 입력해주세요. 지금도 평수 기준 계산은 정상 동작하고 있어요.
                  </div>
                )}

              {searched && configured === true && candidates.length === 0 && (
                <div role="status" className="rounded-xl bg-bg p-3 text-[12px] leading-relaxed text-muted">
                  <p>
                    <b className="text-ink">{modelInput.trim()}</b>(으)로 일치하는 제품을 찾지
                    못했어요. 모델번호를 수정해 다시 검색하거나, 고급 설정에 냉방 소비전력을 직접
                    입력해주세요.
                  </p>
                  <p className="mt-1">지금도 평수 기준 계산은 정상 동작하고 있어요.</p>
                </div>
              )}

              {/* 후보 카드 — 사용자가 눌러야만 확정 */}
              {candidates.some((c) => !dismissed[c.id]) && !product && (
                <div className="space-y-2">
                  <p className="text-[13px] font-bold text-ink">
                    다음 제품 중 사용 중인 에어컨을 확인해주세요.
                  </p>
                  {candidates
                    .filter((c) => !dismissed[c.id])
                    .map((c) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        broken={!!brokenImages[c.id]}
                        onImageError={() => setBrokenImages((prev) => ({ ...prev, [c.id]: true }))}
                        onConfirm={() => confirmCandidate(c)}
                        onDismiss={() => setDismissed((prev) => ({ ...prev, [c.id]: true }))}
                      />
                    ))}
                  <p className="text-[11px] text-muted">
                    이미지는 검색 결과이며 실제 제품과 다를 수 있어요.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── 후보 카드 ── */
function CandidateCard({
  candidate: c,
  broken,
  onImageError,
  onConfirm,
  onDismiss,
}: {
  candidate: AirconProductCandidate;
  broken: boolean;
  onImageError: () => void;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const TypeIcon = TYPE_ICONS[c.productType];
  const typeLabel = c.productType !== "unknown" ? AIRCON_PROFILES[c.productType].label : null;
  const alt = `${c.brand ?? ""} ${c.modelNumber ?? ""} ${typeLabel ?? "에어컨"} 제품 이미지`.trim();

  return (
    <div className="rounded-2xl border border-line bg-card p-3">
      <div className="flex items-start gap-3">
        {c.thumbnailUrl && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.thumbnailUrl}
            alt={alt}
            onError={onImageError}
            className="h-16 w-16 shrink-0 rounded-xl border border-line bg-white object-contain"
          />
        ) : (
          // 이미지 로딩 실패/없음 — 항상 유형별 기본 아이콘 (깨진 이미지 아이콘 노출 금지)
          <span
            role="img"
            aria-label={typeLabel ? `${typeLabel} 기본 아이콘` : "에어컨 기본 아이콘"}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-bg text-muted"
          >
            <TypeIcon size={22} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">{c.title}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {[c.brand, c.modelNumber, typeLabel].filter(Boolean).join(" · ") || "정보 없음"}
          </p>
          <p className="text-[11px] text-muted">
            {c.sourceLabel}
            {c.mallName ? ` · ${c.mallName}` : ""}
            {c.exactModelMatch ? " · 모델번호 일치" : ""}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-[40px] flex-1 rounded-xl bg-brand text-[13px] font-bold text-white transition hover:opacity-90"
        >
          내 에어컨이 맞아요
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[40px] rounded-xl border border-line px-3 text-[12px] font-semibold text-muted transition hover:border-brand/40"
        >
          아니에요
        </button>
        <a
          href={c.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${c.title} 상품 페이지 새 창에서 보기`}
          className="flex min-h-[40px] items-center gap-1 rounded-xl border border-line px-3 text-[12px] font-semibold text-muted transition hover:border-brand/40"
        >
          <ExternalLink size={13} aria-hidden /> 보기
        </a>
      </div>
    </div>
  );
}

/* ── 선택된 제품 요약 + 확인 상태 배지 ── */
function SelectedProductSummary({
  product,
  powerVerified,
  powerSource,
  appliedPowerW,
  onClear,
}: {
  product: SelectedAirconProduct;
  powerVerified: boolean;
  powerSource: CoolingPowerSource;
  appliedPowerW: number | null;
  onClear: () => void;
}) {
  const [broken, setBroken] = useState(false);
  const TypeIcon = TYPE_ICONS[product.productType];
  const typeLabel =
    product.productType !== "unknown" ? AIRCON_PROFILES[product.productType].label : null;
  const powerPending = appliedPowerW === null;

  return (
    <div className="mt-3 rounded-2xl border border-ok/30 bg-ok-tint p-3.5">
      <div className="flex items-start gap-3">
        {product.imageUrl && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={`${product.brand ?? ""} ${product.modelNumber ?? ""} ${typeLabel ?? "에어컨"} 제품 이미지`.trim()}
            onError={() => setBroken(true)}
            className="h-14 w-14 shrink-0 rounded-xl border border-line bg-white object-contain"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/70 text-muted">
            <TypeIcon size={20} aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-bold leading-snug text-ink">{product.title}</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {[product.brand, product.modelNumber, typeLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="선택한 제품 해제"
          className="shrink-0 rounded-full bg-white/70 p-1.5 text-muted transition hover:text-danger"
        >
          <X size={14} aria-hidden />
        </button>
      </div>

      {/* 확인 상태 — 사진 일치와 소비전력 검증은 다른 상태 */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <StatusBadge ok label="모델 확인됨" />
        {product.imageUrl && !broken && <StatusBadge ok label="제품 사진 확인됨" />}
        {powerVerified ? (
          <StatusBadge ok label="라벨 소비전력 확인됨" />
        ) : appliedPowerW !== null ? (
          <StatusBadge ok label={powerSourceText(powerSource, appliedPowerW)} />
        ) : (
          <StatusBadge ok={false} label="소비전력 확인 필요" />
        )}
      </div>
      {powerPending && (
        <p className="mt-2 text-[12px] leading-relaxed text-muted">
          제품 모델은 찾았지만 냉방 소비전력은 확인하지 못했어요. 현재는 평수 기준으로 계산하고
          있어요. 라벨 사진을 찍거나 고급 설정에 직접 입력하면 더 정확해져요.
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-muted">
        이미지는 검색 결과이며 실제 제품과 다를 수 있어요. · {product.sourceLabel}
      </p>
    </div>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        ok ? "bg-white/80 text-ok" : "bg-sun-tint text-sun-deep"
      }`}
    >
      {ok ? <Check size={11} strokeWidth={3} aria-hidden /> : null}
      {label}
    </span>
  );
}

// canvas 재인코딩 — 긴 변 TARGET_DIM 리사이즈, EXIF 제거(재인코딩으로 자동 소거)
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > TARGET_DIM || height > TARGET_DIM) {
          const ratio = Math.min(TARGET_DIM / width, TARGET_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.87));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
