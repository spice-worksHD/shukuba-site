import { getStore } from '@netlify/blobs';

export default async () => {
  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
  const blocked = (await store.get('blocked.json', { type: 'json' })) || {};

  const result = { '0': [], '1': [], '2': [] };

  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    const key = String(b.room);
    if (!result[key]) result[key] = [];
    const dates = [];
    const cur = new Date(b.checkin);
    const end = new Date(b.checkout);
    while (cur < end) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    result[key].push(...dates);
  }

  Object.keys(blocked).forEach((key) => {
    if (!result[key]) result[key] = [];
    result[key].push(...(blocked[key] || []));
  });

  Object.keys(result).forEach((key) => {
    result[key] = [...new Set(result[key])];
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/availability',
};
