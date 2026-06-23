import { getStore } from '@netlify/blobs';

const DEFAULT_PRICING = {
  '0': { base: 18000, overrides: {}, minGuests: 2, maxGuests: 6, extraGuestFee: 2000 },
  '1': { base: 20000, overrides: {}, minGuests: 2, maxGuests: 8, extraGuestFee: 2000 },
  '2': { base: 22000, overrides: {}, minGuests: 2, maxGuests: 10, extraGuestFee: 2000 },
};

const DEFAULT_PAYMENT = {
  methods: { credit: true, paypay: true },
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
    if (b.status === 'cancelled') return false;
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
  const id = crypto.randomUUID();
  const cancelToken = crypto.randomUUID();
  const now = new Date().toISOString();

  bookings.push({
    id,
    cancelToken,
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
    total,
    status: 'confirmed',
    createdAt: now,
    cancelledAt: null,
    history: [{ event: 'created', at: now, by: 'guest' }],
  });

  await store.setJSON('bookings.json', bookings);

  await sendReservationEmails({
    roomName: roomName || room,
    checkin,
    checkout,
    guests,
    name,
    email,
    phone,
    total,
  });

  return new Response(JSON.stringify({ ok: true, total, paymentMethod, id, cancelToken }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

async function sendResendEmail({ to, subject, html }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not set; skipping email send');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Resend API error (${res.status}): ${text}`);
  }
}

async function sendReservationEmails({ roomName, checkin, checkout, guests, name, email, phone, total }) {
  const ownerEmail = process.env.OWNER_EMAIL;
  const lineQrImageUrl = process.env.LINE_QR_IMAGE_URL || 'https://placehold.co/200x200?text=LINE+QR';

  const detailsHtml = `
    <p>部屋名: ${roomName}</p>
    <p>チェックイン: ${checkin}</p>
    <p>チェックアウト: ${checkout}</p>
    <p>人数: ${guests || '-'}名</p>
    <p>ゲスト名: ${name}</p>
    <p>連絡先: ${email} / ${phone || '-'}</p>
    <p>金額: ${Number(total).toLocaleString()}円</p>
  `;

  try {
    if (ownerEmail) {
      await sendResendEmail({
        to: ownerEmail,
        subject: `【新規予約】${name}`,
        html: `<h2>新規予約が入りました</h2>${detailsHtml}`,
      });
    } else {
      console.error('OWNER_EMAIL is not set; skipping owner notification email');
    }
  } catch (err) {
    console.error('Failed to send owner notification email:', err);
  }

  try {
    await sendResendEmail({
      to: email,
      subject: 'ご予約ありがとうございます',
      html: `
        <h2>ご予約ありがとうございます</h2>
        <p>以下の内容でご予約を承りました。</p>
        ${detailsHtml}
        <p>当日まで、また滞在中も公式LINEでご案内いたします。下記QRコードからお友だち登録をお願いします。</p>
        <p><img src="${lineQrImageUrl}" alt="LINE公式アカウント友だち追加QRコード" width="200" height="200" /></p>
      `,
    });
  } catch (err) {
    console.error('Failed to send guest thank-you email:', err);
  }
}

export const config = {
  path: '/.netlify/functions/reserve',
};
