import { getStore } from '@netlify/blobs';
import { runBroadcast } from './lib/broadcast-core.js';

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

// インボックス一覧用の「最新メッセージ」プレビュー文（webhook側と揃える）
function previewOf(entry) {
  if (!entry) return '';
  switch (entry.type) {
    case 'text': return entry.text || '';
    case 'image': return '📷 写真';
    case 'video': return '🎞 動画';
    case 'audio': return '🎤 音声メッセージ';
    case 'file': return '📎 ' + (entry.fileName || 'ファイル');
    case 'sticker': return '😊 スタンプ';
    case 'location': return '📍 ' + (entry.title || '位置情報');
    default: return entry.text || 'メッセージ';
  }
}

// 短縮版JSONレスポンス（フォロワー・ラベル・一斉送信系の新規アクションで使用）
const jsonRes = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
    const checkoutTemplate = (await store.get('checkout-template.json', { type: 'json' })) || null;
    return new Response(JSON.stringify({ ok: true, bookings, pricing, pricingLive, blocked, payment, lineTemplate, checkoutTemplate }), {
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

    if (data.action === 'get-passport-photos') {
      const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const idx = Number(data.index);
      if (!(idx >= 0 && idx < bookings.length)) {
        return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
      }
      const photos = bookings[idx]?.ledger?.passportPhotos || [];
      const photoData = await Promise.all(photos.map(async (p) => {
        try {
          const entry = await store.getWithMetadata(p.key, { type: 'arrayBuffer' });
          if (!entry?.data) return null;
          const base64 = Buffer.from(entry.data).toString('base64');
          const contentType = entry.metadata?.type || 'image/jpeg';
          return { dataUrl: `data:${contentType};base64,${base64}`, name: p.name || '' };
        } catch { return null; }
      }));
      return new Response(JSON.stringify({ ok: true, photos: photoData.filter(Boolean) }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
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

    if (data.action === 'confirm-checkin') {
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
      if (accessToken) {
        const doorCode = process.env.DOOR_CODE || '####';
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            to: booking.lineUserId,
            messages: [{ type: 'text', text: `ご来訪ありがとうございます。パスポートのご確認が完了しました。\n\nドアロックの番号をお知らせします。\n\n【暗証番号】${doorCode}\n\nどうぞごゆっくりお過ごしください。` }],
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          return new Response(JSON.stringify({ ok: false, error: `LINE API: ${errText}` }), { status: 500 });
        }
      }
      const now = new Date().toISOString();
      booking.doorCodeSent = true;
      booking.doorCodeSentAt = now;
      booking.history = Array.isArray(booking.history) ? booking.history : [];
      booking.history.push({ event: 'door-code-sent', at: now, by: 'admin', doorCode });
      bookings[idx] = booking;
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings, doorCode }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'checkout-booking') {
      const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const idx = Number(data.index);
      if (!(idx >= 0 && idx < bookings.length)) {
        return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
      }
      const booking = bookings[idx];
      if (booking.status === 'cancelled') {
        return new Response(JSON.stringify({ ok: false, error: 'cancelled' }), { status: 400 });
      }
      const now = new Date().toISOString();
      booking.checkedOut = true;
      booking.checkedOutAt = now;
      booking.history = Array.isArray(booking.history) ? booking.history : [];
      booking.history.push({ event: 'checked-out', at: now, by: 'admin' });

      if (booking.lineUserId && !booking.checkoutThanksSent) {
        const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (accessToken) {
          const checkoutTemplate = (await store.get('checkout-template.json', { type: 'json' })) || null;
          const DEFAULT_CHECKOUT_TEXT = '{name}様、ご滞在ありがとうございました。またのお越しをお待ちしております。';
          const text = (checkoutTemplate?.text || DEFAULT_CHECKOUT_TEXT)
            .replace('{name}', booking.name || '')
            .replace('{roomName}', booking.roomName || '')
            .replace('{checkout}', booking.checkout || '');
          const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({ to: booking.lineUserId, messages: [{ type: 'text', text }] }),
          });
          if (res.ok) {
            booking.checkoutThanksSent = true;
            booking.checkoutThanksSentAt = now;
            booking.history.push({ event: 'checkout-thanks-sent', at: now, by: 'admin' });
          }
        }
      }
      bookings[idx] = booking;
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'set-checkout-template') {
      const text = typeof data.text === 'string' ? data.text : '';
      await store.setJSON('checkout-template.json', { text });
      return new Response(JSON.stringify({ ok: true, checkoutTemplate: { text } }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'send-checkout-thanks') {
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
      const checkoutTemplate = (await store.get('checkout-template.json', { type: 'json' })) || null;
      const DEFAULT_CHECKOUT_TEXT = '{name}様、ご滞在ありがとうございました。またのお越しをお待ちしております。';
      const text = (checkoutTemplate?.text || DEFAULT_CHECKOUT_TEXT)
        .replace('{name}', booking.name || '')
        .replace('{roomName}', booking.roomName || '')
        .replace('{checkout}', booking.checkout || '');
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ to: booking.lineUserId, messages: [{ type: 'text', text }] }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ ok: false, error: `LINE API: ${errText}` }), { status: 500 });
      }
      const now = new Date().toISOString();
      booking.checkoutThanksSent = true;
      booking.checkoutThanksSentAt = now;
      booking.history = Array.isArray(booking.history) ? booking.history : [];
      booking.history.push({ event: 'checkout-thanks-sent', at: now, by: 'admin' });
      bookings[idx] = booking;
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
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
      const now = new Date().toISOString();
      booking.ciLineSent = true;
      booking.ciLineSentAt = now;
      booking.history = Array.isArray(booking.history) ? booking.history : [];
      booking.history.push({ event: 'ci-line-sent', at: now, by: 'admin' });
      bookings[idx] = booking;
      await store.setJSON('bookings.json', bookings);
      return new Response(JSON.stringify({ ok: true, bookings }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'get-chat') {
      const { lineUserId } = data;
      if (!lineUserId) return new Response(JSON.stringify({ ok: false, error: 'no_lineUserId' }), { status: 400 });
      const messages = (await store.get(`chat-${lineUserId}.json`, { type: 'json' })) || [];
      return new Response(JSON.stringify({ ok: true, messages }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'send-chat') {
      const { lineUserId, text } = data;
      if (!lineUserId || !text) return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
      const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!accessToken) return new Response(JSON.stringify({ ok: false, error: 'no_access_token' }), { status: 500 });
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text }] }),
      });
      if (!res.ok) {
        const errText = await res.text();
        return new Response(JSON.stringify({ ok: false, error: `LINE API: ${errText}` }), { status: 500 });
      }
      const chatKey = `chat-${lineUserId}.json`;
      const chatHistory = (await store.get(chatKey, { type: 'json' })) || [];
      const at = new Date().toISOString();
      chatHistory.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        direction: 'out',
        type: 'text',
        text,
        at,
      });
      await store.setJSON(chatKey, chatHistory);

      // インボックス用インデックスを更新（最新メッセージ・送信なので未読は増やさない）
      const sendIndex = (await store.get('chat-index.json', { type: 'json' })) || {};
      const six = sendIndex[lineUserId] || {};
      six.lastAt = at;
      six.lastType = 'text';
      six.lastDirection = 'out';
      six.lastText = text;
      sendIndex[lineUserId] = six;
      await store.setJSON('chat-index.json', sendIndex);

      return new Response(JSON.stringify({ ok: true, messages: chatHistory }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'list-chats') {
      const allBookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const index = (await store.get('chat-index.json', { type: 'json' })) || {};
      // userId -> 代表予約（キャンセルでない・チェックインが新しいものを優先）
      const bookingByUser = {};
      for (const b of allBookings) {
        if (!b.lineUserId) continue;
        const cur = bookingByUser[b.lineUserId];
        if (!cur) { bookingByUser[b.lineUserId] = b; continue; }
        const score = (x) => (x.status === 'cancelled' ? 0 : 1);
        if (score(b) > score(cur) || (score(b) === score(cur) && (b.checkin || '') > (cur.checkin || ''))) {
          bookingByUser[b.lineUserId] = b;
        }
      }
      const userIds = new Set([...Object.keys(index), ...Object.keys(bookingByUser)]);
      const chats = [];
      for (const uid of userIds) {
        const ix = index[uid] || {};
        let { lastText, lastAt, lastType, lastDirection } = ix;
        const unread = ix.unread || 0;
        if (lastAt == null) {
          const hist = (await store.get(`chat-${uid}.json`, { type: 'json' })) || [];
          if (hist.length) {
            const m = hist[hist.length - 1];
            lastAt = m.at; lastType = m.type || 'text'; lastDirection = m.direction;
            lastText = previewOf(m);
          }
        }
        const b = bookingByUser[uid];
        chats.push({
          lineUserId: uid,
          displayName: ix.displayName || (b ? b.name : '') || 'LINEゲスト',
          pictureUrl: ix.pictureUrl || '',
          unread,
          lastText: lastText || '',
          lastAt: lastAt || null,
          lastType: lastType || null,
          lastDirection: lastDirection || null,
          bookingId: (b && b.id) || ix.bookingId || null,
          name: b ? b.name : '',
          room: b ? b.room : null,
          roomName: b ? b.roomName : '',
          checkin: b ? b.checkin : '',
          checkout: b ? b.checkout : '',
          status: b ? b.status : null,
        });
      }
      chats.sort((a, c) => (c.lastAt || '').localeCompare(a.lastAt || ''));
      const totalUnread = chats.reduce((s, x) => s + (x.unread || 0), 0);
      return new Response(JSON.stringify({ ok: true, chats, totalUnread }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'mark-chat-read') {
      const { lineUserId } = data;
      if (!lineUserId) return new Response(JSON.stringify({ ok: false, error: 'no_lineUserId' }), { status: 400 });
      const index = (await store.get('chat-index.json', { type: 'json' })) || {};
      if (index[lineUserId]) {
        index[lineUserId].unread = 0;
        await store.setJSON('chat-index.json', index);
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (data.action === 'get-chat-media') {
      const { mediaKey } = data;
      if (!mediaKey || !/^chatmedia-/.test(mediaKey)) {
        return new Response(JSON.stringify({ ok: false, error: 'bad_key' }), { status: 400 });
      }
      try {
        const entry = await store.getWithMetadata(mediaKey, { type: 'arrayBuffer' });
        if (!entry?.data) return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
        const base64 = Buffer.from(entry.data).toString('base64');
        const contentType = entry.metadata?.type || 'application/octet-stream';
        return new Response(JSON.stringify({ ok: true, dataUrl: `data:${contentType};base64,${base64}`, mime: contentType }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ ok: false, error: 'not_found' }), { status: 404 });
      }
    }

    // ===== ラベル定義の取得・保存 =====
    if (data.action === 'get-labels') {
      const labels = (await store.get('labels.json', { type: 'json' })) || [];
      return jsonRes({ ok: true, labels });
    }

    if (data.action === 'save-labels') {
      const labels = Array.isArray(data.labels) ? data.labels.map((l) => ({
        id: String(l.id || genId()),
        name: String(l.name || '').slice(0, 30),
        color: String(l.color || '#3D5A52'),
      })).filter((l) => l.name) : [];
      await store.setJSON('labels.json', labels);
      return jsonRes({ ok: true, labels });
    }

    // ===== 特定フォロワーへのラベル付与 =====
    if (data.action === 'set-follower-labels') {
      const { lineUserId } = data;
      if (!lineUserId) return jsonRes({ ok: false, error: 'no_lineUserId' }, 400);
      const index = (await store.get('chat-index.json', { type: 'json' })) || {};
      const ix = index[lineUserId] || {};
      ix.labels = Array.isArray(data.labels) ? data.labels.map(String) : [];
      index[lineUserId] = ix;
      await store.setJSON('chat-index.json', index);
      return jsonRes({ ok: true });
    }

    // ===== フォロワー一覧（chat-index を基点に予約情報・ラベルを合成）=====
    if (data.action === 'list-followers') {
      const allBookings = (await store.get('bookings.json', { type: 'json' })) || [];
      const index = (await store.get('chat-index.json', { type: 'json' })) || {};
      const labels = (await store.get('labels.json', { type: 'json' })) || [];
      const bookingByUser = {};
      for (const b of allBookings) {
        if (!b.lineUserId) continue;
        const cur = bookingByUser[b.lineUserId];
        if (!cur) { bookingByUser[b.lineUserId] = b; continue; }
        const score = (x) => (x.status === 'cancelled' ? 0 : 1);
        if (score(b) > score(cur) || (score(b) === score(cur) && (b.checkin || '') > (cur.checkin || ''))) {
          bookingByUser[b.lineUserId] = b;
        }
      }
      const userIds = new Set([...Object.keys(index), ...Object.keys(bookingByUser)]);
      const followers = [];
      for (const uid of userIds) {
        const ix = index[uid] || {};
        const b = bookingByUser[uid];
        followers.push({
          lineUserId: uid,
          displayName: ix.displayName || (b ? b.name : '') || 'LINEゲスト',
          pictureUrl: ix.pictureUrl || '',
          labels: Array.isArray(ix.labels) ? ix.labels : [],
          lastAt: ix.lastAt || null,
          linked: !!b,
          bookingName: b ? b.name : '',
          room: b ? b.room : null,
          roomName: b ? b.roomName : '',
          checkin: b ? b.checkin : '',
          checkout: b ? b.checkout : '',
          status: b ? b.status : null,
        });
      }
      followers.sort((a, c) => (c.lastAt || '').localeCompare(a.lastAt || ''));
      return jsonRes({ ok: true, followers, labels, total: followers.length });
    }

    // ===== チャット履歴の削除（フォロワー自体は残す）=====
    if (data.action === 'delete-chat') {
      const { lineUserId } = data;
      if (!lineUserId) return jsonRes({ ok: false, error: 'no_lineUserId' }, 400);
      const chatKey = `chat-${lineUserId}.json`;
      const history = (await store.get(chatKey, { type: 'json' })) || [];
      // このスレッドが参照するメディア実体も併せて削除
      for (const m of history) {
        if (m.mediaKey) { try { await store.delete(m.mediaKey); } catch {} }
      }
      try { await store.delete(chatKey); } catch {}
      const index = (await store.get('chat-index.json', { type: 'json' })) || {};
      if (index[lineUserId]) {
        const ix = index[lineUserId];
        ix.lastText = ''; ix.lastAt = null; ix.lastType = null; ix.lastDirection = null; ix.unread = 0;
        index[lineUserId] = ix;
        await store.setJSON('chat-index.json', index);
      }
      return jsonRes({ ok: true });
    }

    // ===== 一斉送信（全員 or ラベル絞り込み、multicastを500件ずつ）=====
    if (data.action === 'broadcast') {
      const r = await runBroadcast({ text: data.text, labelId: data.labelId, store });
      const status = r.ok ? 200 : (r.error === 'no_text' || r.error === 'no_recipients' ? 400 : 500);
      return jsonRes(r, status);
    }

    // ===== 一斉送信の下書き・予約投稿の一覧 =====
    if (data.action === 'list-broadcasts') {
      const drafts = (await store.get('broadcast-drafts.json', { type: 'json' })) || [];
      const scheduled = (await store.get('broadcast-scheduled.json', { type: 'json' })) || [];
      return jsonRes({ ok: true, drafts, scheduled });
    }

    // ===== 下書きの保存（新規 or 更新）=====
    if (data.action === 'save-draft') {
      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (!text) return jsonRes({ ok: false, error: 'no_text' }, 400);
      const drafts = (await store.get('broadcast-drafts.json', { type: 'json' })) || [];
      const labelId = data.labelId ? String(data.labelId) : null;
      const now = new Date().toISOString();
      const id = data.id ? String(data.id) : genId();
      const existing = drafts.find((d) => d.id === id);
      if (existing) { existing.text = text; existing.labelId = labelId; existing.savedAt = now; }
      else { drafts.unshift({ id, text, labelId, savedAt: now }); }
      await store.setJSON('broadcast-drafts.json', drafts);
      return jsonRes({ ok: true, drafts });
    }

    if (data.action === 'delete-draft') {
      const id = data.id ? String(data.id) : '';
      let drafts = (await store.get('broadcast-drafts.json', { type: 'json' })) || [];
      drafts = drafts.filter((d) => d.id !== id);
      await store.setJSON('broadcast-drafts.json', drafts);
      return jsonRes({ ok: true, drafts });
    }

    // ===== 予約投稿の登録 =====
    if (data.action === 'schedule-broadcast') {
      const text = typeof data.text === 'string' ? data.text.trim() : '';
      if (!text) return jsonRes({ ok: false, error: 'no_text' }, 400);
      const sendAtRaw = data.sendAt ? new Date(data.sendAt) : null;
      if (!sendAtRaw || isNaN(sendAtRaw.getTime())) return jsonRes({ ok: false, error: 'bad_date' }, 400);
      if (sendAtRaw.getTime() < Date.now() - 60 * 1000) return jsonRes({ ok: false, error: 'past_date' }, 400);
      const scheduled = (await store.get('broadcast-scheduled.json', { type: 'json' })) || [];
      scheduled.push({
        id: genId(),
        text,
        labelId: data.labelId ? String(data.labelId) : null,
        sendAt: sendAtRaw.toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      await store.setJSON('broadcast-scheduled.json', scheduled);
      return jsonRes({ ok: true, scheduled });
    }

    // ===== 予約投稿の取り消し（pendingは削除、送信済みは履歴として残す）=====
    if (data.action === 'cancel-scheduled') {
      const id = data.id ? String(data.id) : '';
      let scheduled = (await store.get('broadcast-scheduled.json', { type: 'json' })) || [];
      scheduled = scheduled.filter((s) => !(s.id === id && s.status === 'pending'));
      await store.setJSON('broadcast-scheduled.json', scheduled);
      return jsonRes({ ok: true, scheduled });
    }

    // ===== LINE友だち一覧をこの管理画面に同期（プロフィール取得）=====
    if (data.action === 'sync-followers') {
      const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      if (!accessToken) return jsonRes({ ok: false, error: 'no_access_token' }, 500);
      const index = (await store.get('chat-index.json', { type: 'json' })) || {};
      let ids = [];
      let next = null, guard = 0;
      do {
        const url = 'https://api.line.me/v2/bot/followers/ids?limit=1000' + (next ? `&start=${encodeURIComponent(next)}` : '');
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          return jsonRes({ ok: false, error: `LINE API: ${t}` }, 500);
        }
        const j = await res.json();
        ids = ids.concat(j.userIds || []);
        next = j.next || null;
        guard++;
      } while (next && guard < 20);

      let added = 0;
      for (const uid of ids) {
        const existed = !!index[uid];
        const ix = index[uid] || {};
        if (!ix.displayName) {
          try {
            const pr = await fetch(`https://api.line.me/v2/bot/profile/${uid}`, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (pr.ok) { const p = await pr.json(); ix.displayName = p.displayName || ''; ix.pictureUrl = p.pictureUrl || ''; }
          } catch {}
        }
        if (!existed) added++;
        index[uid] = ix;
      }
      await store.setJSON('chat-index.json', index);
      return jsonRes({ ok: true, total: ids.length, added });
    }

    return new Response(JSON.stringify({ ok: false, error: 'unknown_action' }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405 });
};

export const config = {
  path: '/.netlify/functions/admin',
};
