import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  Fuel,
  Globe2,
  Package,
  Plane,
  Receipt,
  RefreshCw,
  Ruler,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import pricingData from "@/data/europeConnectPricing";
import { fetchUpsFuelSurcharge } from "@/lib/fuelSurcharge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TradeType = "import" | "export";

type CountryRecord = {
  id: string;
  rawName: string;
  label: string;
  exportZone: number | null;
  importZone: number | null;
};

type TariffRow = {
  band: string;
  multiplier: number;
};

type RateTable = {
  fuelSurcharge: number | null;
  weights: number[];
  ndcRates: Record<string, Record<string, number | null>>;
};

const countries = pricingData.countries as CountryRecord[];
const importSaver = pricingData.importSaver as RateTable;
const exportSaver = pricingData.exportSaver as RateTable;
const tariffs = pricingData.tariff as {
  import: TariffRow[];
  export: TariffRow[];
  roundingNote: string;
};

const formatKRW = (value: number) =>
  `${Math.round(value).toLocaleString("ko-KR")}원`;

const ceilHalf = (value: number) => Math.ceil(value * 2) / 2;

const normalizeCountry = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const getTariffMultiplier = (tradeType: TradeType, weight: number) => {
  const rows = tradeType === "import" ? tariffs.import : tariffs.export;
  if (weight <= 2) return rows[0]?.multiplier ?? 1.7;
  if (weight <= 3) return rows[1]?.multiplier ?? 1.65;
  if (weight <= 5) return rows[2]?.multiplier ?? 1.6;
  if (weight <= 10) return rows[3]?.multiplier ?? 1.55;
  return rows[4]?.multiplier ?? 1.5;
};

const getWeightBandLabel = (weight: number) => {
  if (weight <= 2) return "~2kg";
  if (weight <= 3) return "~3kg";
  if (weight <= 5) return "~5kg";
  if (weight <= 10) return "~10kg";
  return "10kg+";
};

const roundClientQuote = (value: number) => Math.ceil(value / 1000) * 1000;

export function ShippingCalculator() {
  const [tradeType, setTradeType] = useState<TradeType>("import");
  const [countryQuery, setCountryQuery] = useState<string>("France");
  const [actualWeight, setActualWeight] = useState<number>(5);
  const [length, setLength] = useState<number>(40);
  const [width, setWidth] = useState<number>(30);
  const [height, setHeight] = useState<number>(25);

  const fscQuery = useQuery({
    queryKey: ["ups-fuel-surcharge"],
    queryFn: fetchUpsFuelSurcharge,
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const liveFsc = fscQuery.data?.rate;
  // UPS Korea 공시 기준 단일 유류할증료 (수입/수출 공통). 실시간 조회 실패 시 0.4375 사용.
  const fsc = liveFsc ?? 0.4375;

  const matchedCountry = useMemo(() => {
    const normalized = normalizeCountry(countryQuery);
    if (!normalized) return null;

    return (
      countries.find((country) => {
        const candidates = [country.label, country.rawName, country.id];
        return candidates.some(
          (candidate) => normalizeCountry(candidate) === normalized,
        );
      }) ?? null
    );
  }, [countryQuery]);

  const calc = useMemo(() => {
    const volumetricWeight = (length * width * height) / 5000;
    const chargeableWeight = Math.max(
      0.5,
      ceilHalf(Math.max(actualWeight || 0, volumetricWeight || 0)),
    );
    const rateTable = tradeType === "import" ? importSaver : exportSaver;
    const zone = matchedCountry
      ? tradeType === "import"
        ? matchedCountry.importZone
        : matchedCountry.exportZone
      : null;
    const lookupWeight =
      rateTable.weights.find((weight) => weight >= chargeableWeight) ??
      rateTable.weights[rateTable.weights.length - 1];
    const weightKey = lookupWeight.toFixed(1);
    const ndcBase =
      zone && zone > 0
        ? rateTable.ndcRates[weightKey]?.[String(zone)] ?? null
        : null;
    // 원가 (data sheet 표시값) = NDC base × (1 + 유류할증료)
    const baseCost = ndcBase !== null ? ndcBase * (1 + fsc) : null;
    const multiplier = getTariffMultiplier(tradeType, chargeableWeight);
    const clientQuote =
      baseCost !== null ? roundClientQuote(baseCost * multiplier) : null;
    const zoneMissing = matchedCountry !== null && (!zone || zone <= 0);
    const routeSummary = matchedCountry
      ? tradeType === "import"
        ? `${matchedCountry.label} -> 대한민국`
        : `대한민국 -> ${matchedCountry.label}`
      : tradeType === "import"
        ? "출발 국가 -> 대한민국"
        : "대한민국 -> 도착 국가";

    return {
      volumetricWeight,
      chargeableWeight,
      lookupWeight,
      zone,
      ndcBase,
      baseCost,
      multiplier,
      clientQuote,
      routeSummary,
      rateTable,
      zoneMissing,
      usedVolumetric: volumetricWeight > (actualWeight || 0),
    };
  }, [actualWeight, fsc, height, length, matchedCountry, tradeType, width]);

  const countryFieldLabel =
    tradeType === "import" ? "출발 국가" : "도착 국가";
  const countryFieldHint =
    tradeType === "import"
      ? "어느 나라에서 들어오는 화물인가요?"
      : "어느 나라로 나가는 화물인가요?";

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Calculator className="h-3.5 w-3.5 text-primary-glow" />
          EUROPE CONNECT 운임표 기준
        </div>
        <h1 className="mt-4 text-4xl font-bold text-foreground md:text-5xl">
          국제 항공 배송 견적 계산기
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          첨부된 EUROPE CONNECT 운임표의 ZONE, Saver, Tarif 시트를 기준으로
          수입 또는 수출 견적을 계산합니다.
        </p>
      </div>

      <Card className="overflow-hidden border-border/60 bg-gradient-surface p-0 shadow-elegant">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 p-6 md:p-10">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  배송 정보 입력
                </h2>
                <p className="text-xs text-muted-foreground">
                  수입/수출 구분과 국가 기준 조회
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  운송 구분
                </Label>
                <Select
                  value={tradeType}
                  onValueChange={(value) => setTradeType(value as TradeType)}
                >
                  <SelectTrigger className="h-12 bg-surface text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="import">수입</SelectItem>
                    <SelectItem value="export">
                      수출
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {countryFieldLabel}
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {countryFieldHint}
                  </span>
                </div>
                <Input
                  list="country-options"
                  value={countryQuery}
                  onChange={(event) => setCountryQuery(event.target.value)}
                  placeholder="국가명을 입력해 선택하세요"
                  className="h-12 bg-surface text-base font-medium"
                  autoComplete="off"
                  name="shipping-country"
                />
                <datalist id="country-options">
                  {countries.map((country) => (
                    <option key={country.id} value={country.label} />
                  ))}
                </datalist>
                <p className="text-[11px] text-muted-foreground">
                  ZONE 시트 기준으로 정확히 일치하는 국가를 조회합니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  실중량 (kg)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={actualWeight}
                    onChange={(event) =>
                      setActualWeight(parseFloat(event.target.value) || 0)
                    }
                    className="h-12 bg-surface pr-14 text-base font-medium"
                    autoComplete="off"
                    name="shipping-actual-weight"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    박스 규격 (cm)
                  </Label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Ruler className="h-3 w-3" />
                    L x W x H
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: length, setValue: setLength, label: "L" },
                    { value: width, setValue: setWidth, label: "W" },
                    { value: height, setValue: setHeight, label: "H" },
                  ].map((dimension) => (
                    <div key={dimension.label} className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={dimension.value}
                        onChange={(event) =>
                          dimension.setValue(
                            parseFloat(event.target.value) || 0,
                          )
                        }
                        className="h-12 bg-surface pr-9 text-center text-base font-medium"
                        autoComplete="off"
                        name={`shipping-dim-${dimension.label}`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        {dimension.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  부피중량 = (L x W x H) / 5000 ={" "}
                  <span className="font-semibold text-foreground">
                    {calc.volumetricWeight.toFixed(2)} kg
                  </span>
                </p>
              </div>

            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-primary p-6 text-primary-foreground md:p-10 lg:col-span-2">
            <div className="relative">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
                  <Plane className="h-3.5 w-3.5" />
                  실시간 견적
                </div>
                <button
                  type="button"
                  onClick={() => fscQuery.refetch()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-60"
                  disabled={fscQuery.isFetching}
                  title="UPS 유류할증료 새로고침"
                >
                  <Fuel className="h-3 w-3" />
                  FSC {(fsc * 100).toFixed(2)}%
                  <RefreshCw
                    className={`h-3 w-3 ${fscQuery.isFetching ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <p className="mt-8 text-xs uppercase tracking-widest text-primary-foreground/60">
                최종 예상 견적
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight md:text-5xl">
                  {calc.clientQuote !== null
                    ? formatKRW(calc.clientQuote)
                    : "--"}
                </span>
              </div>
              <p className="mt-1 text-xs text-primary-foreground/60">
                {calc.routeSummary}
              </p>

              <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                <div className="space-y-2 text-xs leading-relaxed text-primary-foreground/85">
                  <p>
                    적용 중량:{" "}
                    <span className="font-semibold text-primary-foreground">
                      {calc.chargeableWeight.toFixed(1)} kg
                    </span>
                  </p>
                  <p>
                    적용 기준:{" "}
                    <span className="font-semibold text-primary-foreground">
                      {calc.usedVolumetric ? "부피중량" : "실중량"}
                    </span>
                  </p>
                  {matchedCountry === null ? (
                    <p>운임표에 있는 국가명을 선택해 주세요.</p>
                  ) : calc.zoneMissing ? (
                    <p>
                      선택한 방향 기준으로 유효한 WXS 존이 없습니다.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                  <Receipt className="h-3.5 w-3.5" />
                  견적 상세
                </div>
                <div className="space-y-2.5 text-sm">
                  <Row
                    label="운송 구분"
                    value={tradeType === "import" ? "수입" : "수출"}
                  />
                  <Row
                    label="국가"
                    value={matchedCountry?.label ?? "미일치"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({
  label,
  sub,
  value,
}: {
  label: string;
  sub?: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <div className="text-sm text-primary-foreground/90">{label}</div>
        {sub ? (
          <div className="text-[11px] text-primary-foreground/50">{sub}</div>
        ) : null}
      </div>
      <div className="text-right font-semibold tabular-nums text-primary-foreground">
        {value}
      </div>
    </div>
  );
}
