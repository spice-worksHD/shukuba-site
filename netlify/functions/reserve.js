import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {}, minGuests: 2, maxGuests: 6, extraGuestFee: 2000 },
  '1': { base: 20000, overrides: {}, minGuests: 2, maxGuests: 8, extraGuestFee: 2000 },
  '2': { base: 22000, overrides: {}, minGuests: 2, maxGuests: 10, extraGuestFee: 2000 },
};

const DEFAULT_PAYMENT = {
  methods: { credit: true, paypay: true, onsite: true },
  depositType: 'percent', // 'percent' | 'fixed'
  depositValue: 30,
};

function calcDeposit(total, payment) {
  if (payment.depositType === 'fixed') return Math.min(payment.depositValue, total);
  return Math.round(total * (payment.depositValue / 100));
}

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

  const { room, roomName, checkin, checkout, guests, name, email, phone, message, paymentMethod } = data;
  if (!room || !checkin || !checkout || !name || !email || !paymentMethod) {
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

  const conflict = bookings.some((b) => {
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

  const payment = (await store.get('payment.json', { type: 'json' })) || DEFAULT_PAYMENT;
  if (!payment.methods?.[paymentMethod]) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_payment_method' }), { status: 400 });
  }

  const total = calcTotal(roomPricing, checkin, checkout, guests);
  const depositAmount = paymentMethod === 'onsite' ? 0 : calcDeposit(total, payment);

  bookings.push({
    room,
    roomName: roomName || '',
    checkin,
    checkout,
    guests: guests || '',
    name,
    email,
    phone: phone || '',
    message: message || '',
    paymentMethod,
    depositAmount,
    total,
    createdAt: new Date().toISOString(),
  });

  await store.setJSON('bookings.json', bookings);

  return new Response(JSON.stringify({ ok: true, total, paymentMethod, depositAmount }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/reserve',
};
