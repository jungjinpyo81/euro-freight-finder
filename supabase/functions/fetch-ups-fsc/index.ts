import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SOURCE_URL =
  'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page?loc=ko_KR';

const FSC_FALLBACK = {
  rate: 0.4225,
  percent: 42.25,
  effectiveDate: '',
};

function fallbackResponse(error: string) {
  return new Response(
    JSON.stringify({
      ...FSC_FALLBACK,
      source: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      fallback: true,
      error,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
  );
}

function parseLatestFsc(html: string): { rate: number; percent: number; effectiveDate: string } | null {
  const rowRe = /(\d{4}\/\d{1,2}\/\d{1,2})[^%]{0,400}?(\d{1,3}(?:\.\d+)?)\s*%/;
  const m = rowRe.exec(html);
  if (!m) return null;
  const percent = parseFloat(m[2]);
  if (!Number.isFinite(percent) || percent <= 0 || percent > 200) return null;
  return { rate: percent / 100, percent, effectiveDate: m[1] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return fallbackResponse(`UPS HTTP ${res.status}`);
    const html = await res.text();
    const parsed = parseLatestFsc(html);
    if (!parsed) return fallbackResponse('FSC not found in HTML');

    return new Response(
      JSON.stringify({
        rate: parsed.rate,
        percent: parsed.percent,
        effectiveDate: parsed.effectiveDate,
        source: SOURCE_URL,
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return fallbackResponse(message);
  }
});
