import { getStore } from '@netlify/blobs';

function jstDateString(d) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function sendLinePush(userId, text) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken || !userId) return;
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ to: userId, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) {
    console.error(`LINE push error (${res.status}): ${await res.text()}`);
  }
}

const DEFAULT_CHECKOUT_TEXT =
  '{name}様、ご滞在ありがとうございました。またのお越しをお待ちしております。';

export async function runAutoCheckout({ by = 'system' } = {}) {
  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
  const checkoutTemplate = (await store.get('checkout-template.json', { type: 'json' })) || null;
  const templateText = checkoutTemplate?.text || DEFAULT_CHECKOUT_TEXT;

  const today = jstDateString(new Date());
  let changed = false;
  const processed = [];

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    if (booking.checkedOut) continue;
    if (booking.checkout > today) continue;

    const now = new Date().toISOString();
    booking.checkedOut = true;
    booking.checkedOutAt = now;
    booking.history = Array.isArray(booking.history) ? booking.history : [];
    booking.history.push({ event: 'checked-out', at: now, by });
    changed = true;

    if (booking.lineUserId && !booking.checkoutThanksSent) {
      const text = templateText
        .replace('{name}', booking.name || '')
        .replace('{roomName}', booking.roomName || '')
        .replace('{checkout}', booking.checkout || '');
      await sendLinePush(booking.lineUserId, text);
      booking.checkoutThanksSent = true;
      booking.checkoutThanksSentAt = now;
      booking.history.push({ event: 'checkout-thanks-sent', at: now, by });
    }

    processed.push({ id: booking.id, name: booking.name });
  }

  if (changed) await store.setJSON('bookings.json', bookings);
  return { processedCount: processed.length, processed, bookings };
}
