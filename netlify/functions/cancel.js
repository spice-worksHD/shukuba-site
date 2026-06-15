import { getStore } from '@netlify/blobs';

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | SHUKUBA</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, 'Hiragino Sans', sans-serif; background: #f7f5f1; color: #2b2b28; margin: 0; padding: 0; }
  .wrap { max-width: 480px; margin: 60px auto; padding: 40px 32px; background: #fff; border: 1px solid #e6e1d8; text-align: center; }
  h1 { font-size: 18px; letter-spacing: 2px; margin-bottom: 20px; font-weight: 500; }
  p { font-size: 14px; line-height: 1.9; color: #6b6a64; margin-bottom: 28px; }
  .btn { display: inline-block; padding: 14px 32px; background: #2b3f3c; color: #fff; text-decoration: none; font-size: 13px; letter-spacing: 3px; }
  .btn.danger { background: #b8584f; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  const confirm = url.searchParams.get('confirm');

  if (!id || !token) {
    return new Response(page('リンクが無効です', '<p>このキャンセルリンクは無効です。お手数ですが宿までお問い合わせください。</p>'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];
  const idx = bookings.findIndex((b) => b.id === id && b.cancelToken === token);

  if (idx === -1) {
    return new Response(page('リンクが無効です', '<p>該当する予約が見つかりません。このキャンセルリンクは無効です。</p>'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const booking = bookings[idx];

  if (booking.status === 'cancelled') {
    return new Response(page('キャンセル済みです', '<p>この予約はすでにキャンセルされています。</p>'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!confirm) {
    const confirmUrl = `${url.origin}${url.pathname}?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}&confirm=1`;
    return new Response(page('予約のキャンセル', `
      <p>${booking.checkin} 〜 ${booking.checkout}<br>${booking.roomName || ''}<br>のご予約をキャンセルします。よろしいですか？</p>
      <a class="btn danger" href="${confirmUrl}">キャンセルを確定する</a>
    `), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const now = new Date().toISOString();
  booking.status = 'cancelled';
  booking.cancelledAt = now;
  booking.history = Array.isArray(booking.history) ? booking.history : [];
  booking.history.push({ event: 'cancelled', at: now, by: 'guest' });

  await store.setJSON('bookings.json', bookings);

  return new Response(page('キャンセルが完了しました', '<p>ご予約のキャンセルを承りました。<br>またのご利用をお待ちしております。</p>'), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

export const config = {
  path: '/.netlify/functions/cancel',
};
