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

// LINEのプロフィール（表示名・アイコン）を取得
async function getProfile(userId) {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// 画像・動画・音声・ファイルの実体を取得
async function fetchContent(messageId) {
  try {
    const res = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    if (!res.ok) return null;
    const mime = res.headers.get('content-type') || 'application/octet-stream';
    const buf = await res.arrayBuffer();
    return { buf, mime };
  } catch {
    return null;
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// インボックス一覧用の「最新メッセージ」プレビュー文
function previewOf(entry) {
  switch (entry.type) {
    case 'text': return entry.text || '';
    case 'image': return '📷 写真';
    case 'video': return '🎞 動画';
    case 'audio': return '🎤 音声メッセージ';
    case 'file': return '📎 ' + (entry.fileName || 'ファイル');
    case 'sticker': return '😊 スタンプ';
    case 'location': return '📍 ' + (entry.title || '位置情報');
    default: return 'メッセージ';
  }
}

// 新着メッセージのオーナー通知（Resend／ユーザー単位で15分スロットル）
async function notifyOwner(displayName, preview, indexEntry) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  if (!apiKey || !to) return;
  const last = indexEntry.lastNotifiedAt ? new Date(indexEntry.lastNotifiedAt).getTime() : 0;
  if (Date.now() - last < 15 * 60 * 1000) return; // 15分以内は再通知しない
  const siteUrl = process.env.SITE_URL || 'https://shukuba-shiga.com';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: 'SHUKUBA <reservation@shukuba-shiga.com>',
        to,
        subject: `【SHUKUBA】LINE新着メッセージ（${displayName || 'ゲスト'}様）`,
        text: `LINEに新しいメッセージが届きました。\n\n${displayName || 'ゲスト'}様：\n「${preview}」\n\n管理画面のチャットからご返信いただけます。\n${siteUrl}/admin.html`,
      }),
    });
    if (res.ok) indexEntry.lastNotifiedAt = new Date().toISOString();
  } catch (err) {
    console.error('notifyOwner failed:', err);
  }
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
  const chatIndex = (await store.get('chat-index.json', { type: 'json' })) || {};

  let bookingsChanged = false;
  let lineUsersChanged = false;
  let indexChanged = false;

  // 受信メッセージを履歴へ保存し、インボックス用インデックスを更新する
  async function recordIncoming(userId, entry) {
    const chatKey = `chat-${userId}.json`;
    const history = (await store.get(chatKey, { type: 'json' })) || [];
    history.push(entry);
    await store.setJSON(chatKey, history);

    const ix = chatIndex[userId] || {};
    ix.lastAt = entry.at;
    ix.lastType = entry.type;
    ix.lastDirection = 'in';
    ix.lastText = previewOf(entry);
    ix.unread = (ix.unread || 0) + 1;
    if (lineUsers[userId]) ix.bookingId = lineUsers[userId];
    chatIndex[userId] = ix;
    indexChanged = true;
  }

  // 表示名・アイコンを未取得なら取得してインデックスに保存
  async function ensureProfile(userId) {
    const ix = chatIndex[userId] || {};
    if (!ix.displayName) {
      const profile = await getProfile(userId);
      if (profile) {
        ix.displayName = profile.displayName || '';
        ix.pictureUrl = profile.pictureUrl || '';
        chatIndex[userId] = ix;
        indexChanged = true;
      }
    }
  }

  for (const event of body.events || []) {
    const userId = event.source?.userId;

    if (event.type === 'follow' && event.replyToken) {
      if (userId) await ensureProfile(userId);
      await reply(event.replyToken, [{
        type: 'text',
        text: 'SHUKUBA公式LINEへのご登録ありがとうございます。\nご予約の確認・チェックインのご案内をこちらのトークでお送りするため、ご予約時にご入力いただいたメールアドレスを送信してください。',
      }]);
      continue;
    }

    if (event.type !== 'message') continue;
    const msg = event.message;
    if (!userId || !msg) continue;

    await ensureProfile(userId);

    // メッセージ種別ごとに履歴エントリを組み立てる
    const at = new Date().toISOString();
    const entry = { id: genId(), direction: 'in', at, type: msg.type };

    if (msg.type === 'text') {
      entry.text = msg.text;
    } else if (['image', 'video', 'audio', 'file'].includes(msg.type)) {
      if (msg.type === 'file') entry.fileName = msg.fileName || '';
      const content = await fetchContent(msg.id);
      if (content) {
        const mediaKey = `chatmedia-${msg.id}`;
        await store.set(mediaKey, content.buf, { metadata: { type: content.mime } });
        entry.mediaKey = mediaKey;
        entry.mime = content.mime;
      }
    } else if (msg.type === 'sticker') {
      entry.packageId = msg.packageId;
      entry.stickerId = msg.stickerId;
    } else if (msg.type === 'location') {
      entry.title = msg.title || '';
      entry.address = msg.address || '';
      entry.lat = msg.latitude;
      entry.lng = msg.longitude;
    } else {
      entry.type = 'unknown';
    }

    await recordIncoming(userId, entry);
    await notifyOwner(chatIndex[userId]?.displayName, previewOf(entry), chatIndex[userId]);

    // ここから先はテキストメッセージの自動応答（予約紐付け／チェックアウト）
    if (msg.type !== 'text' || !event.replyToken) continue;

    const rawText = msg.text.trim();
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
      if (chatIndex[userId]) { chatIndex[userId].bookingId = match.id; indexChanged = true; }
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

  if (bookingsChanged) await store.setJSON('bookings.json', bookings);
  if (lineUsersChanged) await store.setJSON('line-users.json', lineUsers);
  if (indexChanged) await store.setJSON('chat-index.json', chatIndex);

  return new Response('ok', { status: 200 });
};

export const config = {
  path: '/.netlify/functions/line-webhook',
};
