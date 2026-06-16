import { createServerFn } from "@tanstack/react-start";

export type FuelSurchargeResult = {
  rate: number; // decimal, e.g. 0.4375
  percent: number; // e.g. 43.75
  effectiveDate: string; // YYYY/MM/DD
  source: string;
  fetchedAt: string; // ISO
  cached: boolean;
};

type CacheEntry = { value: FuelSurchargeResult; expiresAt: number };
let cache: CacheEntry | null = null;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const SOURCE_URL =
  "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page?loc=ko_KR";

const FALLBACK: FuelSurchargeResult = {
  rate: 0.4375,
  percent: 43.75,
  effectiveDate: "",
  source: SOURCE_URL,
  fetchedAt: new Date(0).toISOString(),
  cached: false,
};

function parseLatestFsc(html: string): { rate: number; percent: number; effectiveDate: string } | null {
  // Look for first table row like "2026/06/15 ... 43.75%"
  const rowRe =
    /(\d{4}\/\d{1,2}\/\d{1,2})[^%]{0,200}?(\d{1,3}(?:\.\d+)?)\s*%/g;
  let m: RegExpExecArray | null;
  let best: { date: string; percent: number } | null = null;
  while ((m = rowRe.exec(html)) !== null) {
    const date = m[1];
    const percent = parseFloat(m[2]);
    if (!Number.isFinite(percent) || percent <= 0 || percent > 200) continue;
    if (!best) {
      best = { date, percent };
      // first match is the most recent in UPS table
      break;
    }
  }
  if (!best) return null;
  return { rate: best.percent / 100, percent: best.percent, effectiveDate: best.date };
}

export const getUpsFuelSurcharge = createServerFn({ method: "GET" }).handler(
  async (): Promise<FuelSurchargeResult> => {
    const now = Date.now();
    if (cache && cache.expiresAt > now) {
      return { ...cache.value, cached: true };
    }
    try {
      const res = await fetch(SOURCE_URL, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ShippingQuoteBot/1.0)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        },
      });
      if (!res.ok) throw new Error(`UPS responded ${res.status}`);
      const html = await res.text();
      const parsed = parseLatestFsc(html);
      if (!parsed) throw new Error("FSC not found in UPS response");
      const value: FuelSurchargeResult = {
        rate: parsed.rate,
        percent: parsed.percent,
        effectiveDate: parsed.effectiveDate,
        source: SOURCE_URL,
        fetchedAt: new Date().toISOString(),
        cached: false,
      };
      cache = { value, expiresAt: now + TTL_MS };
      return value;
    } catch (err) {
      console.error("[fuelSurcharge] fetch failed:", err);
      if (cache) return { ...cache.value, cached: true };
      return FALLBACK;
    }
  },
);
