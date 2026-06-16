export type FuelSurchargeResult = {
  rate: number;
  percent: number;
  effectiveDate: string;
  source: string;
  fetchedAt: string;
};

const SOURCE_URL =
  "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page?loc=ko_KR";

// Public CORS proxy (read-only HTML scrape)
const PROXY = "https://api.allorigins.win/raw?url=";

export const FSC_FALLBACK: FuelSurchargeResult = {
  rate: 0.4375,
  percent: 43.75,
  effectiveDate: "",
  source: SOURCE_URL,
  fetchedAt: new Date(0).toISOString(),
};

function parseLatestFsc(
  html: string,
): { rate: number; percent: number; effectiveDate: string } | null {
  const rowRe = /(\d{4}\/\d{1,2}\/\d{1,2})[^%]{0,200}?(\d{1,3}(?:\.\d+)?)\s*%/;
  const m = rowRe.exec(html);
  if (!m) return null;
  const percent = parseFloat(m[2]);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 200) return null;
  return { rate: percent / 100, percent, effectiveDate: m[1] };
}

export async function fetchUpsFuelSurcharge(): Promise<FuelSurchargeResult> {
  const res = await fetch(PROXY + encodeURIComponent(SOURCE_URL));
  if (!res.ok) throw new Error(`Proxy responded ${res.status}`);
  const html = await res.text();
  const parsed = parseLatestFsc(html);
  if (!parsed) throw new Error("FSC not found");
  return {
    rate: parsed.rate,
    percent: parsed.percent,
    effectiveDate: parsed.effectiveDate,
    source: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
  };
}
