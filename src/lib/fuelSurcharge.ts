export type FuelSurchargeResult = {
  rate: number;
  percent: number;
  effectiveDate: string;
  source: string;
  fetchedAt: string;
};

const SOURCE_URL =
  "https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page?loc=ko_KR";

// Multiple public CORS proxies (try in order) — public proxies are flaky, so we fall back.
const PROXIES: Array<(url: string) => string> = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
];

export const FSC_FALLBACK: FuelSurchargeResult = {
  rate: 0.4225,
  percent: 42.25,
  effectiveDate: "",
  source: SOURCE_URL,
  fetchedAt: new Date(0).toISOString(),
};

function parseLatestFsc(
  html: string,
): { rate: number; percent: number; effectiveDate: string } | null {
  const rowRe = /(\d{4}\/\d{1,2}\/\d{1,2})[^%]{0,400}?(\d{1,3}(?:\.\d+)?)\s*%/;
  const m = rowRe.exec(html);
  if (!m) return null;
  const percent = parseFloat(m[2]);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 200) return null;
  return { rate: percent / 100, percent, effectiveDate: m[1] };
}

async function tryFetch(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUpsFuelSurcharge(): Promise<FuelSurchargeResult> {
  let lastErr: unknown = null;
  for (const buildUrl of PROXIES) {
    try {
      const html = await tryFetch(buildUrl(SOURCE_URL));
      const parsed = parseLatestFsc(html);
      if (!parsed) {
        lastErr = new Error("FSC not found in HTML");
        continue;
      }
      return {
        rate: parsed.rate,
        percent: parsed.percent,
        effectiveDate: parsed.effectiveDate,
        source: SOURCE_URL,
        fetchedAt: new Date().toISOString(),
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All proxies failed");
}
