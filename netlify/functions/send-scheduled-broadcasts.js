import { getStore } from '@netlify/blobs';
import { runBroadcast } from './lib/broadcast-core.js';

// 予約投稿の実行（5分ごと）。送信予定時刻を過ぎた pending の一斉送信を送る。
export default async () => {
  const store = getStore('shukuba-bookings');
  const scheduled = (await store.get('broadcast-scheduled.json', { type: 'json' })) || [];
  const now = Date.now();
  let changed = false;

  for (const s of scheduled) {
    if (s.status !== 'pending') continue;
    if (new Date(s.sendAt).getTime() > now) continue;
    const r = await runBroadcast({ text: s.text, labelId: s.labelId, store });
    s.status = r.ok ? 'sent' : 'failed';
    s.sentAt = new Date().toISOString();
    s.sent = r.sent || 0;
    s.failed = r.failed || 0;
    if (r.error) s.error = r.error;
    changed = true;
  }

  if (changed) await store.setJSON('broadcast-scheduled.json', scheduled);
  return new Response('ok', { status: 200 });
};

export const config = {
  schedule: '*/15 * * * *', // 15分ごと（クレジット節約のため。予約投稿は最大15分の誤差で送信）
};
