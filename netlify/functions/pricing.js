import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {}, minGuests: 2, maxGuests: 6, extraGuestFee: 2000 },
  '1': { base: 20000, overrides: {}, minGuests: 2, maxGuests: 8, extraGuestFee: 2000 },
  '2': { base: 22000, overrides: {}, minGuests: 2, maxGuests: 10, extraGuestFee: 2000 },
};

export default async () => {
  const store = getStore('shukuba-bookings');
  const pricing = (await store.get('pricing-live.json', { type: 'json' })) || DEFAULT_PRICING;

  return new Response(JSON.stringify(pricing), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/pricing',
};
