import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {} },
  '1': { base: 20000, overrides: {} },
  '2': { base: 22000, overrides: {} },
};

const DEFAULT_BLOCKED = { '0': [], '1': [], '2': [] };

function checkAuth(req) {
  const key = req.headers.get('x-admin-key');
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

export default async (req) => {
  if (!checkAuth(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const store = getStore('shukuba-bookings');

  if (req.method === 'GET') {
    const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
    const pricing = (await store.get('pricing.json', { type: 'json' })) || DEFAULT_PRICING;
    const blocked = (await store.get('blocked.json', { type: 'json' })) || DEFAULT_BLOCKED;
    return new Response(JSON.stringify({ ok: true, bookings, pricing, blocked }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    let data;
    try {
      data = await req.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400 });
    }

    if (data.action === 'set-pricing') {
      const pricing = (await store.get('pricing.json', { type: 'json' })) || DEFAULT_PRICING;
      pricing[String(data.room)] = {
        base: Number(data.base) || 0,
        overrides: data.overrides || {},
      };
      await store.setJSON('pricing.json', pricing);
      return new Response(JSON.stringify({ ok: true, pricing }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'set-blocked') {
      const blocked = (await store.get('blocked.json', { type: 'json' })) || DEFAULT_BLOCKED;
      blocked[String(data.room)] = Array.isArray(data.dates) ? data.dates : [];
      await store.setJSON('blocked.json', blocked);
      return new Response(JSON.stringify({ ok: true, blocked }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'cancel-booking') {
      const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const idx = Number(data.index);
      if (!(idx >= 0 && idx < bookings.length)) {
        return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
      }
      bookings.splice(idx, 1);
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: 'unknown_action' }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405 });
};

export const config = {
  path: '/.netlify/functions/admin',
};
