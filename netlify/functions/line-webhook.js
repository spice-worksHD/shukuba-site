import { getStore } from '@netlify/blobs';

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

async function verifySignature(body, signature) {
  if (!CHANNEL_SECRET || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(CHANNEL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return expected === signature;
}

async function reply(replyToken, messages) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const bodyText = await req.text();
  const signature = req.headers.get('x-line-signature');
  if (!(await verifySignature(bodyText, signature))) {
    return new Response('invalid signature', { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
  const lineUsers = (await store.get('line-users.json', { type: 'json' })) || {};

  let bookingsChanged = false;
  let lineUsersChanged = false;

  for (const event of body.events || []) {
    const userId = event.source?.userId;

    if (event.type === 'follow' && event.replyToken) {
      await reply(event.replyToken, [{
        type: 'text',
        text: 'SHUKUBA公式LINEへのご登録ありがとうございます。\nご予約の確認・チェックインのご案内をこちらのトークでお送りするため、ご予約時にご入力いただいたメールアドレスを送信してください。',
      }]);
      continue;
    }

    if (event.type === 'message' && event.message?.type === 'text' && event.replyToken) {
      const rawText = event.message.text.trim();
      const text = rawText.toLowerCase();

      // チェックアウトキーワード検知
      const CHECKOUT_KEYWORDS = ['チェックアウト', 'checkout', '退出しました', '退出'];
      if (CHECKOUT_KEYWORDS.some((kw) => rawText.includes(kw) || text.includes(kw.toLowerCase()))) {
        const bookingId = lineUsers[userId];
        const match = bookings.find((b) => b.id === bookingId && b.status !== 'cancelled' && !b.checkedOut);
        if (match) {
          const now = new Date().toISOString();
          match.checkedOut = true;
          match.checkedOutAt = now;
          match.history = Array.isArray(match.history) ? match.history : [];
          match.history.push({ event: 'checked-out', at: now, by: 'guest' });
          bookingsChanged = true;

          const checkoutTemplate = (await store.get('checkout-template.json', { type: 'json' })) || null;
          const DEFAULT_CHECKOUT_TEXT = '{name}様、ご滞在ありがとうございました。またのお越しをお待ちしております。';
          const thanksText = (checkoutTemplate?.text || DEFAULT_CHECKOUT_TEXT)
            .replace('{name}', match.name || '')
            .replace('{roomName}', match.roomName || '')
            .replace('{checkout}', match.checkout || '');

          match.checkoutThanksSent = true;
          match.checkoutThanksSentAt = now;
          match.history.push({ event: 'checkout-thanks-sent', at: now, by: 'system' });

          await reply(event.replyToken, [{ type: 'text', text: thanksText }]);
          continue;
        } else {
          await reply(event.replyToken, [{ type: 'text', text: 'チェックアウトのご連絡ありがとうございます。またのお越しをお待ちしております。' }]);
          continue;
        }
      }

      const candidates = bookings.filter((b) => b.status !== 'cancelled' && b.email?.toLowerCase() === text);
      // Prefer a booking that isn't linked yet, so re-sending the email links
      // the next pending reservation instead of always re-matching the first one.
      const match = candidates.find((b) => !b.lineUserId) || candidates[0];

      if (match) {
        lineUsers[userId] = match.id;
        match.lineUserId = userId;
        bookingsChanged = true;
        lineUsersChanged = true;
        await reply(event.replyToken, [{
          type: 'text',
          text: `ご予約を確認しました。\n\n${match.roomName}\n${match.checkin} 〜 ${match.checkout}\n\nチェックイン前日に、こちらのトークでチェックインのご案内をお送りします。`,
        }]);
      } else {
        await reply(event.replyToken, [{
          type: 'text',
          text: 'ご予約時にご登録いただいたメールアドレスを送信してください。ご予約内容を確認のうえ、こちらのトークでご案内を承れるようになります。',
        }]);
      }
    }
  }

  if (bookingsChanged) await store.setJSON('bookings.json', bookings);
  if (lineUsersChanged) await store.setJSON('line-users.json', lineUsers);

  return new Response('ok', { status: 200 });
};

export const config = {
  path: '/.netlify/functions/line-webhook',
};
