import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {}, minGuests: 2, maxGuests: 6, extraGuestFee: 2000 },
  '1': { base: 20000, overrides: {}, minGuests: 2, maxGuests: 8, extraGuestFee: 2000 },
  '2': { base: 22000, overrides: {}, minGuests: 2, maxGuests: 10, extraGuestFee: 2000 },
};

function calcTotal(pricingForRoom, checkin, checkout, guests) {
  const base = pricingForRoom?.base ?? 0;
  const overrides = pricingForRoom?.overrides ?? {};
  const minGuests = pricingForRoom?.minGuests ?? 1;
  const extraFee = pricingForRoom?.extraGuestFee ?? 0;
  const extraPeople = Math.max(0, (Number(guests) || 0) - minGuests);
  let total = 0;
  const cur = new Date(checkin);
  const end = new Date(checkout);
  while (cur < end) {
    const key = cur.toISOString().slice(0, 10);
    const night = overrides[key] ?? base;
    total += night + extraPeople * extraFee;
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405 });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400 });
  }

  const { room, roomName, checkin, checkout, guests, name, email, phone, arrivalTime, message } = data;
  if (!room || !checkin || !checkout || !name || !email) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
  }

  const newStart = new Date(checkin);
  const newEnd = new Date(checkout);
  if (!(newStart < newEnd)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_dates' }), { status: 400 });
  }

  const store = getStore('shukuba-bookings');
  const existing = await store.get('bookings.json', { type: 'json' });
  const bookings = existing || [];
  const blocked = (await store.get('blocked.json', { type: 'json' })) || {};

  // 空室チェック
  const conflict = bookings.some((b) => {
    if (b.status === 'cancelled' || b.status === 'pending') return false;
    if (String(b.room) !== String(room)) return false;
    const s = new Date(b.checkin);
    const e = new Date(b.checkout);
    return newStart < e && newEnd > s;
  });

  const blockedDates = blocked[String(room)] || [];
  const blockedConflict = blockedDates.some((d) => {
    const dt = new Date(d);
    return dt >= newStart && dt < newEnd;
  });

  if (conflict || blockedConflict) {
    return new Response(JSON.stringify({ ok: false, error: 'conflict' }), { status: 409 });
  }

  const pricing = (await store.get('pricing-live.json', { type: 'json' })) || DEFAULT_PRICING;
  const roomPricing = pricing[String(room)] || DEFAULT_PRICING[String(room)];

  const maxGuests = roomPricing?.maxGuests;
  if (maxGuests && Number(guests) > maxGuests) {
    return new Response(JSON.stringify({ ok: false, error: 'guests_over_capacity' }), { status: 400 });
  }

  const total = calcTotal(roomPricing, checkin, checkout, guests);
  const id = crypto.randomUUID();
  const cancelToken = crypto.randomUUID();
  const checkinToken = crypto.randomUUID();
  const now = new Date().toISOString();

  // 仮予約として保存（status: 'pending'）
  bookings.push({
    id,
    cancelToken,
    checkinToken,
    room,
    roomName: roomName || '',
    checkin,
    checkout,
    guests: guests || '',
    name,
    email,
    phone: phone || '',
    arrivalTime: arrivalTime || '',
    message: message || '',
    paymentMethod: 'credit',
    total,
    status: 'pending',
    createdAt: now,
    cancelledAt: null,
    checkedIn: false,
    checkedInAt: null,
    reminderSentAt: null,
    ledger: null,
    history: [{ event: 'created', at: now, by: 'guest' }],
  });

  await store.setJSON('bookings.json', bookings);

  // Stripe Checkout セッション作成
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    // STRIPE_SECRET_KEYが未設定の場合は仮予約IDだけ返す（テスト用）
    return new Response(JSON.stringify({ ok: false, error: 'stripe_not_configured' }), { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const origin = new URL(req.url).origin;

  const nights = Math.round((newEnd - newStart) / (1000 * 60 * 60 * 24));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    locale: 'ja',
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          unit_amount: total,
          product_data: {
            name: `SHUKUBA ${roomName || room} 宿泊料金`,
            description: `${checkin} 〜 ${checkout}（${nights}泊 / ${guests || '-'}名）`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: id,
      cancelToken,
      checkinToken,
      room: String(room),
      roomName: roomName || '',
      checkin,
      checkout,
      guests: String(guests || ''),
      name,
      email,
      phone: phone || '',
      arrivalTime: arrivalTime || '',
    },
    success_url: `${origin}/booking-success.html?id=${id}`,
    cancel_url: `${origin}/?payment=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30分で期限切れ
  });

  return new Response(JSON.stringify({ ok: true, checkoutUrl: session.url, bookingId: id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/stripe-checkout',
};
