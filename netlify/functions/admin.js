import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {}, minGuests: 2, maxGuests: 6, extraGuestFee: 2000 },
  '1': { base: 20000, overrides: {}, minGuests: 2, maxGuests: 8, extraGuestFee: 2000 },
  '2': { base: 22000, overrides: {}, minGuests: 2, maxGuests: 10, extraGuestFee: 2000 },
};

const DEFAULT_BLOCKED = { '0': [], '1': [], '2': [] };

const DEFAULT_PAYMENT = {
  methods: { credit: true, paypay: true },
};

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
    const pricingLive = (await store.get('pricing-live.json', { type: 'json' })) || DEFAULT_PRICING;
    const blocked = (await store.get('blocked.json', { type: 'json' })) || DEFAULT_BLOCKED;
    const payment = (await store.get('payment.json', { type: 'json' })) || DEFAULT_PAYMENT;
    const lineTemplate = (await store.get('line-template.json', { type: 'json' })) || null;
    return new Response(JSON.stringify({ ok: true, bookings, pricing, pricingLive, blocked, payment, lineTemplate }), {
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
      const existing = pricing[String(data.room)] || DEFAULT_PRICING[String(data.room)] || {};
      pricing[String(data.room)] = {
        base: Number(data.base) || 0,
        overrides: data.overrides || {},
        minGuests: data.minGuests != null ? Number(data.minGuests) : (existing.minGuests ?? 1),
        maxGuests: data.maxGuests != null ? Number(data.maxGuests) : (existing.maxGuests ?? 10),
        extraGuestFee: data.extraGuestFee != null ? Number(data.extraGuestFee) : (existing.extraGuestFee ?? 0),
      };
      await store.setJSON('pricing.json', pricing);
      return new Response(JSON.stringify({ ok: true, pricing }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'publish-pricing') {
      const pricing = (await store.get('pricing.json', { type: 'json' })) || DEFAULT_PRICING;
      await store.setJSON('pricing-live.json', pricing);
      return new Response(JSON.stringify({ ok: true, pricingLive: pricing }), {
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

    if (data.action === 'set-payment') {
      const payment = {
        methods: {
          credit: !!data.methods?.credit,
          paypay: !!data.methods?.paypay,
        },
      };
      await store.setJSON('payment.json', payment);
      return new Response(JSON.stringify({ ok: true, payment }), {
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
      if (bookings[idx].status === 'cancelled') {
        return new Response(JSON.stringify({ ok: false, error: 'already_cancelled' }), { status: 400 });
      }
      const now = new Date().toISOString();
      bookings[idx].status = 'cancelled';
      bookings[idx].cancelledAt = now;
      bookings[idx].history = Array.isArray(bookings[idx].history) ? bookings[idx].history : [];
      bookings[idx].history.push({ event: 'cancelled', at: now, by: 'admin' });
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TEST/DEMO TOOL — for creating sample bookings to test reminder emails etc.
    // Remove this action (and its admin.html UI) before real-world launch.
    if (data.action === 'create-test-booking') {
      const { room, checkin, checkout, guests, name, email, phone } = data;
      if (!room || !checkin || !checkout || !name || !email) {
        return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
      }
      const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const id = crypto.randomUUID();
      const cancelToken = crypto.randomUUID();
      const checkinToken = crypto.randomUUID();
      const now = new Date().toISOString();
      bookings.push({
        id,
        cancelToken,
        checkinToken,
        room,
        roomName: '',
        checkin,
        checkout,
        guests: guests || '',
        name,
        email,
        phone: phone || '',
        message: '[テストデータ]',
        paymentMethod: 'credit',
        total: 0,
        status: 'confirmed',
        createdAt: now,
        cancelledAt: null,
        checkedIn: false,
        checkedInAt: null,
        reminderSentAt: null,
        ledger: null,
        history: [{ event: 'created', at: now, by: 'admin-test' }],
      });
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TEST/DEMO TOOL — hard-deletes a booking record entirely (unlike cancel-booking,
    // which only marks status). Remove this action before real-world launch.
    if (data.action === 'delete-booking') {
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

    if (data.action === 'set-line-template') {
      const text = typeof data.text === 'string' ? data.text : '';
      await store.setJSON('line-template.json', { text });
      return new Response(JSON.stringify({ ok: true, lineTemplate: { text } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'send-line-test') {
      const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const idx = Number(data.index);
      if (!(idx >= 0 && idx < bookings.length)) {
        return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
      }
      const booking = bookings[idx];
      if (!booking.lineUserId) {
        return new Response(JSON.stringify({ ok: false, error: 'no_line_user' }), { status: 400 });
      }
      const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!accessToken) {
        return new Response(JSON.stringify({ ok: false, error: 'no_access_token' }), { status: 500 });
      }
      const siteUrl = process.env.SITE_URL || 'https://shukuba-shiga.com';
      const checkinUrl = `${siteUrl}/.netlify/functions/checkin?id=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(booking.checkinToken)}`;
      const lineTemplate = (await store.get('line-template.json', { type: 'json' })) || null;
      const DEFAULT_LINE_TEXT = '明日はご来訪日です。スムーズなご案内のため、下記より宿泊者名簿のご記入（チェックイン手続き）をお願いいたします。\n{checkinUrl}';
      const text = (lineTemplate?.text || DEFAULT_LINE_TEXT)
        .replace('{checkinUrl}', checkinUrl)
        .replace('{roomName}', booking.roomName || '')
        .replace('{checkin}', booking.checkin || '')
        .replace('{name}', booking.name || '');
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ to: booking.lineUserId, messages: [{ type: 'text', text }] }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ ok: false, error: `LINE API: ${errText}` }), { status: 500 });
      }
      return new Response(JSON.stringify({ ok: true }), {
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
