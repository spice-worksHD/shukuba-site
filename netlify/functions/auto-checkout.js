import { runAutoCheckout } from './lib/auto-checkout-core.js';

export default async () => {
  await runAutoCheckout({ by: 'system' });
  return new Response('ok', { status: 200 });
};

export const config = {
  schedule: '0 3 * * *', // 毎日 12:00 JST (= 03:00 UTC)
};
