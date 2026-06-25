import { getStore } from '@netlify/blobs';

const THEME = `
  :root {
    --ink: #2B2118; --paper: #F4EEE2; --reed: #3D5A52; --susuki: #8A6E4B;
    --bengara: #C14C32; --dark: #211A14; --muted: #6B7770; --border: #DCD0B8;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif;
    background: var(--paper); color: var(--ink); margin: 0; padding: 0 0 40px;
  }
  .brand-bar { background: var(--dark); padding: 22px 16px; text-align: center; }
  .brand-bar .brand { font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', serif; font-size: 20px; letter-spacing: 5px; color: var(--paper); }
  .wrap { max-width: 520px; margin: -20px auto 0; background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 32px 28px; position: relative; box-shadow: 0 8px 28px rgba(43,33,24,0.10); }
  h1 { font-family: 'Shippori Mincho', 'Hiragino Mincho ProN', serif; font-size: 19px; letter-spacing: 1px; margin: 0 0 8px; font-weight: 600; color: var(--dark); }
  .lead { font-size: 13px; color: var(--muted); margin-bottom: 24px; line-height: 1.8; }
  .summary { background: var(--paper); border-radius: 8px; padding: 14px 16px; font-size: 13px; line-height: 1.9; margin-bottom: 24px; border-left: 3px solid var(--susuki); }
  .summary strong { color: var(--dark); }
  label { display: block; font-size: 12px; color: var(--muted); margin: 16px 0 6px; }
  input, textarea, select {
    width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 6px;
    font-size: 14px; font-family: inherit; color: var(--ink); background: #fff;
  }
  input:focus, textarea:focus, select:focus { outline: none; border-color: var(--susuki); box-shadow: 0 0 0 3px rgba(138,110,75,0.15); }
  textarea { resize: vertical; min-height: 64px; }
  .hint { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .req { color: var(--bengara); }
  .btn { display: inline-block; width: 100%; padding: 14px; background: var(--reed); color: #fff; border: none;
    border-radius: 6px; font-size: 14px; letter-spacing: 2px; cursor: pointer; margin-top: 28px; transition: background .2s; }
  .btn:hover { background: var(--dark); }
  .error { background: #fbe9e7; color: #b8584f; font-size: 12px; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; }
  .done-mark { text-align: center; }
  .done-mark p { font-size: 14px; line-height: 1.9; color: var(--muted); }
  #passport-field { display: none; }
`;

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<title>${title} | SHUKUBA</title>
<style>${THEME}</style>
</head>
<body>
  <div class="brand-bar"><span class="brand">SHUKUBA</span></div>
  <div class="wrap">
    <h1>${title}</h1>
    ${body}
  </div>
</body>
</html>`;
}

function html(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isJapan(nationality) {
  const n = (nationality || '').trim();
  return n === '' || n === '日本' || n === '日本国';
}

function renderForm({ booking, error, values }) {
  const v = values || {};
  const nationality = v.nationality ?? '日本';

  return `
    <p class="lead">ご来訪前のお手続きとして、宿泊者名簿のご記入をお願いいたします（旅館業法に基づく必須事項です）。</p>
    <div class="summary">
      <strong>${html(booking.roomName || '')}</strong><br>
      チェックイン: ${html(booking.checkin)} 〜 チェックアウト: ${html(booking.checkout)}<br>
      人数: ${booking.guests || '-'}名 ／ ご予約者: ${html(booking.name)}
    </div>
    ${error ? `<div class="error">${html(error)}</div>` : ''}
    <form method="POST">
      <input type="hidden" name="id" value="${html(booking.id)}">
      <input type="hidden" name="token" value="${html(booking.checkinToken)}">
      <label>代表者氏名 <span class="req">必須</span></label>
      <input type="text" name="name" required value="${html(v.name ?? booking.name ?? '')}">

      <label>フリガナ <span class="req">必須</span></label>
      <input type="text" name="nameKana" required value="${html(v.nameKana ?? '')}">

      <label>ご住所 <span class="req">必須</span></label>
      <input type="text" name="address" required placeholder="都道府県・市区町村・番地まで" value="${html(v.address ?? '')}">

      <label>電話番号</label>
      <input type="tel" name="phone" value="${html(v.phone ?? booking.phone ?? '')}">

      <label>ご職業 <span class="req">必須</span></label>
      <input type="text" name="occupation" required value="${html(v.occupation ?? '')}">

      <label>国籍</label>
      <input type="text" name="nationality" id="nationality-input" value="${html(nationality)}" placeholder="日本">
      <div class="hint">日本国内に住所をお持ちでない方は、旅券（パスポート）番号のご記入が必要です。</div>

      <div id="passport-field">
        <label>旅券（パスポート）番号 <span class="req">必須</span></label>
        <input type="text" name="passportNumber" value="${html(v.passportNumber ?? '')}">
      </div>

      <label>到着予定時刻</label>
      <input type="time" name="arrivalTime" value="${html(v.arrivalTime ?? '')}">

      <label>同行者の氏名（代表者以外。1行に1名ずつご記入ください）</label>
      <textarea name="companions" placeholder="例）山田 花子&#10;山田 一郎">${html(v.companions ?? '')}</textarea>

      <button class="btn" type="submit">この内容で送信する</button>
    </form>
    <script>
      (function () {
        var input = document.getElementById('nationality-input');
        var field = document.getElementById('passport-field');
        function sync() {
          var val = (input.value || '').trim();
          var isJp = val === '' || val === '日本' || val === '日本国';
          field.style.display = isJp ? 'none' : 'block';
        }
        input.addEventListener('input', sync);
        sync();
      })();
    </script>
  `;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];

  let formId = id;
  let formToken = token;
  let postedFields = null;

  if (req.method === 'POST') {
    const formData = await req.formData();
    formId = formData.get('id') || id;
    formToken = formData.get('token') || token;
    postedFields = {
      name: formData.get('name') || '',
      nameKana: formData.get('nameKana') || '',
      address: formData.get('address') || '',
      phone: formData.get('phone') || '',
      occupation: formData.get('occupation') || '',
      nationality: formData.get('nationality') || '',
      passportNumber: formData.get('passportNumber') || '',
      arrivalTime: formData.get('arrivalTime') || '',
      companions: formData.get('companions') || '',
    };
  }

  if (!formId || !formToken) {
    return new Response(page('リンクが無効です', '<p>このチェックインリンクは無効です。お手数ですが宿までお問い合わせください。</p>'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const idx = bookings.findIndex((b) => b.id === formId && b.checkinToken === formToken);
  if (idx === -1) {
    return new Response(page('リンクが無効です', '<p>該当する予約が見つかりません。このチェックインリンクは無効です。</p>'), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const booking = bookings[idx];

  if (booking.status === 'cancelled') {
    return new Response(page('ご予約はキャンセルされています', '<p>このご予約はキャンセル済みのため、チェックイン手続きを行うことができません。</p>'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (req.method === 'GET') {
    if (booking.checkedIn) {
      return new Response(page('チェックイン手続き済みです', `
        <div class="done-mark">
          <p>このご予約はすでにチェックイン手続きが完了しています。<br>当日のお越しをお待ちしております。</p>
        </div>
      `), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response(page('チェックイン手続き', renderForm({ booking, values: { phone: booking.phone, name: booking.name } })), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // POST: validate and save
  const f = postedFields;
  const errors = [];
  if (!f.name.trim()) errors.push('代表者氏名を入力してください。');
  if (!f.nameKana.trim()) errors.push('フリガナを入力してください。');
  if (!f.address.trim()) errors.push('ご住所を入力してください。');
  if (!f.occupation.trim()) errors.push('ご職業を入力してください。');
  if (!isJapan(f.nationality) && !f.passportNumber.trim()) {
    errors.push('日本国内に住所をお持ちでない場合は、旅券番号の入力が必要です。');
  }

  if (errors.length) {
    return new Response(page('チェックイン手続き', renderForm({ booking, error: errors.join(' '), values: f })), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const now = new Date().toISOString();
  const companions = f.companions
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  booking.checkedIn = true;
  booking.checkedInAt = now;
  booking.ledger = {
    name: f.name.trim(),
    nameKana: f.nameKana.trim(),
    address: f.address.trim(),
    phone: f.phone.trim(),
    occupation: f.occupation.trim(),
    nationality: f.nationality.trim() || '日本',
    passportNumber: f.passportNumber.trim(),
    arrivalTime: f.arrivalTime.trim(),
    companions,
  };
  booking.history = Array.isArray(booking.history) ? booking.history : [];
  booking.history.push({ event: 'checked-in', at: now, by: 'guest' });

  bookings[idx] = booking;
  await store.setJSON('bookings.json', bookings);

  return new Response(page('チェックイン手続きが完了しました', `
    <div class="done-mark">
      <p>宿泊者名簿のご記入ありがとうございました。<br>チェックイン手続きが完了しました。<br>当日のお越しをお待ちしております。</p>
    </div>
  `), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
};

export const config = {
  path: '/.netlify/functions/checkin',
};
