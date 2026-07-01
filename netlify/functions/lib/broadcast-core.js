import { getStore } from '@netlify/blobs';

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 一斉送信の実処理。管理画面の即時送信と、予約投稿のcronの両方から使う。
// labelId を指定するとそのラベルが付いたフォロワーのみが対象。null なら全員。
export async function runBroadcast({ text, labelId = null, store: passedStore } = {}) {
  const t = typeof text === 'string' ? text.trim() : '';
  if (!t) return { ok: false, error: 'no_text' };
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return { ok: false, error: 'no_access_token' };

  const store = passedStore || getStore('shukuba-bookings');
  const index = (await store.get('chat-index.json', { type: 'json' })) || {};
  const lid = labelId ? String(labelId) : null;
  let recipients = Object.keys(index);
  if (lid) recipients = recipients.filter((uid) => Array.isArray(index[uid].labels) && index[uid].labels.includes(lid));
  if (!recipients.length) return { ok: false, error: 'no_recipients' };

  let sent = 0, failed = 0, lastErr = '';
  for (let i = 0; i < recipients.length; i += 500) {
    const chunk = recipients.slice(i, i + 500);
    const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ to: chunk, messages: [{ type: 'text', text: t }] }),
    });
    if (res.ok) { sent += chunk.length; }
    else { failed += chunk.length; lastErr = await res.text().catch(() => ''); }
  }

  // 送信できた場合のみ各スレッドの履歴とインボックスに記録
  if (sent > 0) {
    const at = new Date().toISOString();
    for (const uid of recipients) {
      const chatKey = `chat-${uid}.json`;
      const hist = (await store.get(chatKey, { type: 'json' })) || [];
      hist.push({ id: genId(), direction: 'out', type: 'text', text: t, at, broadcast: true });
      await store.setJSON(chatKey, hist);
      const ix = index[uid] || {};
      ix.lastAt = at; ix.lastType = 'text'; ix.lastDirection = 'out'; ix.lastText = t;
      index[uid] = ix;
    }
    await store.setJSON('chat-index.json', index);
  }

  return { ok: sent > 0, sent, failed, total: recipients.length, error: failed ? `LINE API: ${lastErr}` : undefined };
}
