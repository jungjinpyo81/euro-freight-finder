import { useMemo, useState } from "react";
import {
  Plane,
  Package,
  Ruler,
  Flame,
  ShieldCheck,
  Receipt,
  ArrowRight,
  Info,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CountryKey = "UK" | "FR" | "IT" | "DE";
type DestinationCountryKey = "KR" | "JP" | "SG" | "AE" | "US";

const COUNTRIES: Record<
  CountryKey,
  { label: string; sub: string; rate: number; flag: string }
> = {
  UK: { label: "United Kingdom", sub: "영국", rate: 12000, flag: "🇬🇧" },
  FR: { label: "France", sub: "프랑스", rate: 13500, flag: "🇫🇷" },
  IT: { label: "Italy", sub: "이탈리아", rate: 14000, flag: "🇮🇹" },
  DE: { label: "Germany", sub: "독일", rate: 12500, flag: "🇩🇪" },
};

const DESTINATION_COUNTRIES: Record<
  DestinationCountryKey,
  { label: string; flag: string }
> = {
  KR: { label: "South Korea", flag: "KR" },
  JP: { label: "Japan", flag: "JP" },
  SG: { label: "Singapore", flag: "SG" },
  AE: { label: "United Arab Emirates", flag: "AE" },
  US: { label: "United States", flag: "US" },
};

const QUARANTINE_FEE = 55000;

const formatKRW = (n: number) =>
  "₩ " + Math.round(n).toLocaleString("ko-KR");

const ceilHalf = (n: number) => Math.ceil(n * 2) / 2;

export function ShippingCalculator() {
  const [country, setCountry] = useState<CountryKey>("FR");
  const [destinationCountry, setDestinationCountry] =
    useState<DestinationCountryKey>("KR");
  const [actualWeight, setActualWeight] = useState<number>(5);
  const [length, setLength] = useState<number>(40);
  const [width, setWidth] = useState<number>(30);
  const [height, setHeight] = useState<number>(25);
  const [quarantine, setQuarantine] = useState<boolean>(true);
  const [fsc, setFsc] = useState<number>(25.5);

  const calc = useMemo(() => {
    const volumetric = (length * width * height) / 5000;
    const heavier = Math.max(actualWeight || 0, volumetric || 0);
    const chargeable = ceilHalf(heavier);
    const rate = COUNTRIES[country].rate;
    const baseFreight = chargeable * rate;
    const fuelSurcharge = baseFreight * (fsc / 100);
    const additional = quarantine ? QUARANTINE_FEE : 0;
    const total = baseFreight + fuelSurcharge + additional;
    const usedVolumetric = volumetric > (actualWeight || 0);
    return {
      volumetric,
      chargeable,
      rate,
      baseFreight,
      fuelSurcharge,
      additional,
      total,
      usedVolumetric,
    };
  }, [country, actualWeight, length, width, height, quarantine, fsc]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
          Real-time Air Freight Estimator
        </div>
        <h1 className="mt-4 text-4xl font-bold text-foreground md:text-5xl">
          International Air Shipping Quote Calculator
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
          유럽 프리미엄 F&B 수입 전문 — 실시간으로 운임을 산출해드립니다.
        </p>
      </div>

      <Card className="overflow-hidden border-border/60 bg-gradient-surface p-0 shadow-elegant">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* LEFT — Input Form */}
          <div className="lg:col-span-3 p-6 md:p-10">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4.5 w-4.5" strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  화물 정보 입력
                </h2>
                <p className="text-xs text-muted-foreground">
                  Shipment details
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Country */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  출발 국가 · Origin Country
                </Label>
                <Select
                  value={country}
                  onValueChange={(v) => setCountry(v as CountryKey)}
                >
                  <SelectTrigger className="h-12 bg-surface text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COUNTRIES) as CountryKey[]).map((k) => (
                      <SelectItem key={k} value={k} className="py-2.5">
                        <span className="flex items-center gap-3">
                          <span className="text-lg">
                            {COUNTRIES[k].flag}
                          </span>
                          <span className="font-medium">
                            {COUNTRIES[k].label}
                          </span>
                          <span className="text-muted-foreground">
                            {COUNTRIES[k].sub}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {COUNTRIES[k].rate.toLocaleString()} ₩/kg
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Destination Country
                </Label>
                <Select
                  value={destinationCountry}
                  onValueChange={(v) =>
                    setDestinationCountry(v as DestinationCountryKey)
                  }
                >
                  <SelectTrigger className="h-12 bg-surface text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        DESTINATION_COUNTRIES,
                      ) as DestinationCountryKey[]
                    ).map((k) => (
                      <SelectItem key={k} value={k} className="py-2.5">
                        <span className="flex items-center gap-3">
                          <span className="font-medium">
                            {DESTINATION_COUNTRIES[k].label}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {DESTINATION_COUNTRIES[k].flag}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  실 중량 · Actual Weight (kg)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={actualWeight}
                    onChange={(e) =>
                      setActualWeight(parseFloat(e.target.value) || 0)
                    }
                    className="h-12 bg-surface pr-14 text-base font-medium"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    kg
                  </span>
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    박스 규격 · Dimensions (cm)
                  </Label>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Ruler className="h-3 w-3" />
                    L × W × H
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: length, set: setLength, lbl: "L" },
                    { v: width, set: setWidth, lbl: "W" },
                    { v: height, set: setHeight, lbl: "H" },
                  ].map((d, i) => (
                    <div key={i} className="relative">
                      <Input
                        type="number"
                        min={0}
                        value={d.v}
                        onChange={(e) =>
                          d.set(parseFloat(e.target.value) || 0)
                        }
                        className="h-12 bg-surface pr-9 text-center text-base font-medium"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        {d.lbl}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  부피중량 = (L × W × H) / 5000 ={" "}
                  <span className="font-semibold text-foreground">
                    {calc.volumetric.toFixed(2)} kg
                  </span>
                </p>
              </div>

              {/* Quarantine toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      식품 검역 · Food Quarantine
                    </div>
                    <div className="text-xs text-muted-foreground">
                      식검 진행 시 + ₩ 55,000 추가
                    </div>
                  </div>
                </div>
                <Switch
                  checked={quarantine}
                  onCheckedChange={setQuarantine}
                />
              </div>

              {/* FSC slider */}
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary-glow" />
                    <Label className="text-sm font-semibold text-foreground">
                      유류할증료 · Fuel Surcharge
                    </Label>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-sm font-bold tabular-nums text-primary">
                    {fsc.toFixed(1)} %
                  </span>
                </div>
                <Slider
                  value={[fsc]}
                  onValueChange={(v) => setFsc(v[0])}
                  min={0}
                  max={60}
                  step={0.1}
                />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>0%</span>
                  <span>실시간 연동 (Mock API)</span>
                  <span>60%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Result */}
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-primary p-6 text-primary-foreground md:p-10">
            {/* Decorative orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-glow/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-primary-glow/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  Live Quote
                </div>
                <Plane className="h-5 w-5 opacity-70" />
              </div>

              <p className="mt-8 text-xs uppercase tracking-widest text-primary-foreground/60">
                최종 예상 견적 · Total
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums tracking-tight md:text-5xl">
                  {formatKRW(calc.total)}
                </span>
              </div>
              <p className="hidden">
                {COUNTRIES[country].flag} {COUNTRIES[country].sub} → 🇰🇷
                대한민국 · 항공 운송 기준
              </p>

              <p className="mt-1 text-xs text-primary-foreground/60">
                {COUNTRIES[country].label}
                <ArrowRight className="mx-1 inline h-3 w-3" />
                {DESTINATION_COUNTRIES[destinationCountry].label}
              </p>

              {/* Chargeable weight badge */}
              <div className="mt-6 rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/70" />
                  <div className="text-xs leading-relaxed text-primary-foreground/85">
                    <span className="font-semibold text-primary-foreground">
                      과금중량 {calc.chargeable.toFixed(1)} kg 적용
                    </span>{" "}
                    —{" "}
                    {calc.usedVolumetric
                      ? `부피중량(${calc.volumetric.toFixed(2)}kg)이 실중량(${actualWeight}kg)보다 커서 부피중량 기준으로 산정됩니다.`
                      : `실중량(${actualWeight}kg)이 부피중량(${calc.volumetric.toFixed(2)}kg)보다 커서 실중량 기준으로 산정됩니다.`}
                  </div>
                </div>
              </div>

              {/* Breakdown receipt */}
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                  <Receipt className="h-3.5 w-3.5" />
                  상세 내역
                </div>
                <div className="space-y-2.5 text-sm">
                  <Row
                    label="기본 운임"
                    sub={`${calc.chargeable.toFixed(1)}kg × ${COUNTRIES[country].rate.toLocaleString()}₩`}
                    value={formatKRW(calc.baseFreight)}
                  />
                  <Row
                    label="유류할증료"
                    sub={`FSC ${fsc.toFixed(1)}%`}
                    value={formatKRW(calc.fuelSurcharge)}
                  />
                  <Row
                    label="식품 검역비"
                    sub={quarantine ? "식검 진행" : "미진행"}
                    value={
                      quarantine ? formatKRW(calc.additional) : "— 0"
                    }
                    muted={!quarantine}
                  />
                  <div className="my-3 border-t border-dashed border-white/20" />
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold">
                      합계 · Total
                    </span>
                    <span className="text-xl font-bold tabular-nums">
                      {formatKRW(calc.total)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="mt-8 h-12 w-full bg-white text-primary hover:bg-white/90"
                onClick={() =>
                  alert(
                    "운송 의뢰가 접수되었습니다.\n담당자가 곧 연락드립니다.",
                  )
                }
              >
                운송 의뢰하기
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <p className="mt-3 text-center text-[11px] text-primary-foreground/50">
                * 본 견적은 참고용이며, 실제 운임은 화물 검수 후 확정됩니다.
              </p>
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
  muted,
}: {
  label: string;
  sub?: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <div
          className={`text-sm ${muted ? "text-primary-foreground/50" : "text-primary-foreground/90"}`}
        >
          {label}
        </div>
        {sub && (
          <div className="text-[11px] text-primary-foreground/50">{sub}</div>
        )}
      </div>
      <div
        className={`tabular-nums ${muted ? "text-primary-foreground/50" : "font-semibold text-primary-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}
