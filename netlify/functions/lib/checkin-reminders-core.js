import { getStore } from '@netlify/blobs';

const SITE_URL = process.env.SITE_URL || 'https://shukuba-shiga.com';

function jstDateString(d) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function sendLinePush(userId, text) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken || !userId) return;
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ to: userId, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) {
    console.error(`LINE push error (${res.status}): ${await res.text()}`);
  }
}

async function sendReminderEmail(to, html) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not set; skipping reminder email');
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SHUKUBA <reservation@shukuba-shiga.com>',
      to: [to],
      subject: '【ご来訪前のお願い】チェックイン手続きのご案内',
      html,
    }),
  });
  if (!res.ok) {
    console.error(`Resend API error (${res.status}): ${await res.text()}`);
  }
}

// forceAll: when true, sends to every eligible booking checking in tomorrow
// regardless of whether a reminder was already sent (used for manual resend).
const DEFAULT_LINE_TEXT = '明日はご来訪日です。スムーズなご案内のため、下記より宿泊者名簿のご記入（チェックイン手続き）をお願いいたします。\n{checkinUrl}';

export async function runCheckinReminders({ forceAll = false } = {}) {
  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
  const lineTemplate = (await store.get('line-template.json', { type: 'json' })) || null;
  const lineTextTemplate = lineTemplate?.text || DEFAULT_LINE_TEXT;

  const tomorrow = jstDateString(new Date(Date.now() + 24 * 60 * 60 * 1000));
  let changed = false;
  const sentTo = [];

  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue;
    if (booking.checkedIn) continue;
    if (!forceAll && booking.reminderSentAt) continue;
    if (booking.checkin !== tomorrow) continue;

    const checkinUrl = `${SITE_URL}/.netlify/functions/checkin?id=${encodeURIComponent(booking.id)}&token=${encodeURIComponent(booking.checkinToken)}`;

    await sendReminderEmail(booking.email, `
      <h2>チェックイン手続きのお願い</h2>
      <p>明日はいよいよご来訪日です。スムーズにご案内するため、事前に宿泊者名簿のご記入をお願いいたします。</p>
      <p>部屋名: ${booking.roomName || ''}<br>チェックイン: ${booking.checkin}</p>
      <p><a href="${checkinUrl}">こちらからチェックイン手続きを行う</a></p>
    `);

    if (booking.lineUserId) {
      const lineText = lineTextTemplate
        .replace('{checkinUrl}', checkinUrl)
        .replace('{roomName}', booking.roomName || '')
        .replace('{checkin}', booking.checkin || '')
        .replace('{name}', booking.name || '');
      await sendLinePush(booking.lineUserId, lineText);
    }

    booking.reminderSentAt = new Date().toISOString();
    booking.history = Array.isArray(booking.history) ? booking.history : [];
    booking.history.push({ event: 'reminder-sent', at: booking.reminderSentAt, by: forceAll ? 'admin' : 'system' });
    changed = true;
    sentTo.push({ id: booking.id, name: booking.name, email: booking.email });
  }

  if (changed) {
    await store.setJSON('bookings.json', bookings);
  }

  return { sentCount: sentTo.length, sentTo };
}
