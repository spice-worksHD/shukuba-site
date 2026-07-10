import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe env vars not set');
    return new Response('configuration error', { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const session = event.data.object;
  const meta = session.metadata || {};
  const bookingId = meta.bookingId;

  if (!bookingId) {
    console.error('No bookingId in session metadata');
    return new Response('ok', { status: 200 });
  }

  // 強整合性で読む: stripe-checkout が直前に書いた仮予約を確実に読めるようにする
  // （デフォルトの結果整合性だと古いスナップショットを読み、予約なし扱いで確定・メールが飛ばない競合が起きる）
  const store = getStore({ name: 'shukuba-bookings', consistency: 'strong' });
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
  const idx = bookings.findIndex((b) => b.id === bookingId);

  if (idx === -1) {
    // 200で握りつぶすとStripeが再送しない。500を返してStripeにリトライさせ、
    // 反映遅延・一時的な不整合から自動回復できるようにする。
    console.error('Booking not found (will ask Stripe to retry):', bookingId);
    return new Response('booking not found', { status: 500 });
  }

  const booking = bookings[idx];
  if (booking.status !== 'pending') {
    // すでに確定済み（重複webhook対策）
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const now = new Date().toISOString();
  bookings[idx] = {
    ...booking,
    status: 'confirmed',
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent || null,
    history: [...(booking.history || []), { event: 'payment_confirmed', at: now, by: 'stripe' }],
  };

  await store.setJSON('bookings.json', bookings);

  // 確定メール送信
  const origin = new URL(req.url).origin;
  await sendReservationEmails({ ...booking, origin });

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

async function sendResendEmail({ to, subject, html, attachments }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) { console.error('RESEND_API_KEY not set'); return; }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'SHUKUBA <reservation@shukuba-shiga.com>',
      to: [to],
      subject,
      html,
      ...(attachments ? { attachments } : {}),
    }),
  });
  if (!res.ok) console.error(`Resend error ${res.status}: ${await res.text()}`);
}

async function getLineQrAttachment(origin) {
  try {
    const res = await fetch(`${origin}/assets/line-qr.png`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return { filename: 'line-qr.png', content: buf.toString('base64'), content_id: 'line-qr' };
  } catch { return null; }
}

async function sendReservationEmails(booking) {
  const { room, roomName, checkin, checkout, guests, name, email, phone, arrivalTime, total, cancelToken, origin } = booking;
  const ownerEmail = process.env.OWNER_EMAIL;
  const lineOaUrl = process.env.LINE_OA_URL || '';
  const lineQrAttachment = await getLineQrAttachment(origin);
  const lineQrImageSrc = lineQrAttachment ? 'cid:line-qr' : 'https://placehold.co/200x200?text=LINE+QR';
  const cancelUrl = `${origin}/.netlify/functions/cancel?id=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(cancelToken)}`;

  const detailsHtml = `
    <p>部屋名: ${roomName || room}</p>
    <p>チェックイン: ${checkin}</p>
    <p>チェックアウト: ${checkout}</p>
    <p>人数: ${guests || '-'}名</p>
    <p>チェックイン予定時間: ${arrivalTime || '未定'}</p>
    <p>ゲスト名: ${name}</p>
    <p>連絡先: ${email} / ${phone || '-'}</p>
    <p>金額: ${Number(total).toLocaleString()}円（決済済み）</p>
  `;

  try {
    if (ownerEmail) {
      await sendResendEmail({
        to: ownerEmail,
        subject: `【新規予約・決済完了】${roomName || room} ${checkin}〜${checkout}（${name}様）`,
        html: `<h2>新規予約が入りました（決済完了）</h2>${detailsHtml}`,
      });
    }
  } catch (err) { console.error('Owner email failed:', err); }

  try {
    await sendResendEmail({
      to: email,
      subject: 'ご予約・お支払いありがとうございます',
      html: `
        <h2>ご予約・お支払いありがとうございます</h2>
        <p>以下の内容でご予約を承りました。</p>
        ${detailsHtml}
        <p>当日まで、また滞在中も公式LINEでご案内いたします。下記QRコードからお友だち登録をお願いします。</p>
        <p><img src="${lineQrImageSrc}" alt="LINE公式アカウント" width="200" height="200" /></p>
        ${lineOaUrl ? `<p>QRコードが読み込めない場合は<a href="${lineOaUrl}">こちら</a>から友だち追加できます。</p>` : ''}
        <p>ご予約内容の変更・キャンセルは<a href="${cancelUrl}">こちら</a>からお願いします。</p>
      `,
      attachments: lineQrAttachment ? [lineQrAttachment] : undefined,
    });
  } catch (err) { console.error('Guest email failed:', err); }
}

export const config = {
  path: '/.netlify/functions/stripe-webhook',
};
