import { supabase } from '@/integrations/supabase/client';

export type FuelSurchargeResult = {
  rate: number;
  percent: number;
  effectiveDate: string;
  source: string;
  fetchedAt: string;
};

const SOURCE_URL =
  'https://www.ups.com/kr/ko/support/shipping-support/shipping-costs-rates/fuel-surcharges.page?loc=ko_KR';

export const FSC_FALLBACK: FuelSurchargeResult = {
  rate: 0.4225,
  percent: 42.25,
  effectiveDate: '',
  source: SOURCE_URL,
  fetchedAt: new Date(0).toISOString(),
};

export async function fetchUpsFuelSurcharge(): Promise<FuelSurchargeResult> {
  const { data, error } = await supabase.functions.invoke('fetch-ups-fsc');
  if (error) throw error;
  if (!data || typeof data.percent !== 'number') {
    throw new Error('Invalid response from fetch-ups-fsc');
  }
  return data as FuelSurchargeResult;
}
