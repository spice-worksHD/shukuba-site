import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {} },
  '1': { base: 20000, overrides: {} },
  '2': { base: 22000, overrides: {} },
};

export default async () => {
  const store = getStore('shukuba-bookings');
  const pricing = (await store.get('pricing.json', { type: 'json' })) || DEFAULT_PRICING;

  return new Response(JSON.stringify(pricing), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/pricing',
};
