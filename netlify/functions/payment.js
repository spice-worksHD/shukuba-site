import { getStore } from '@netlify/blobs';

const DEFAULT_PAYMENT = {
  methods: { credit: true, paypay: true, onsite: true },
  depositType: 'percent', // 'percent' | 'fixed'
  depositValue: 30,
};

export default async () => {
  const store = getStore('shukuba-bookings');
  const payment = (await store.get('payment.json', { type: 'json' })) || DEFAULT_PAYMENT;

  return new Response(JSON.stringify(payment), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/payment',
};
