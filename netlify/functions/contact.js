// お問い合わせフォームの送信を受け取り、担当者へ通知＋送信者へ自動返信する。
// 送信先はいったん CONTACT_EMAIL（未設定時は kanai@spice-works.co.jp）。
const CONTACT_TO = process.env.CONTACT_EMAIL || 'kanai@spice-works.co.jp';
const FROM = 'SHUKUBA お問い合わせ <reservation@shukuba-shiga.com>';
const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5MB（Netlify Functionのボディ上限に対する安全側）

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

async function sendResendEmail({ to, subject, html, attachments, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error('RESEND_API_KEY is not set; skipping email'); return false; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...(attachments && attachments.length ? { attachments } : {}),
    }),
  });
  if (!res.ok) {
    console.error(`Resend API error (${res.status}): ${await res.text().catch(() => '')}`);
    return false;
  }
  return true;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), { status: 405 });
  }

  let data;
  try { data = await req.json(); }
  catch { return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), { status: 400 }); }

  const { type, content, name, email, phone, detail, lang } = data;
  if (!type || !content || !name || !email) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 400 });
  }
  // 最低限のメール形式チェック
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), { status: 400 });
  }

  // 添付の検証＆整形
  const rawAtt = Array.isArray(data.attachments) ? data.attachments : [];
  let totalBytes = 0;
  const attachments = [];
  for (const a of rawAtt) {
    if (!a || !a.filename || !a.content) continue;
    const bytes = Math.floor((String(a.content).length * 3) / 4); // base64→概算バイト数
    totalBytes += bytes;
    attachments.push({ filename: String(a.filename).slice(0, 200), content: a.content });
  }
  if (totalBytes > MAX_TOTAL_BYTES) {
    return new Response(JSON.stringify({ ok: false, error: 'attachments_too_large' }), { status: 413 });
  }

  const receivedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const attListHtml = attachments.length
    ? `<ul>${attachments.map(a => `<li>${esc(a.filename)}</li>`).join('')}</ul>`
    : '<p>（なし）</p>';

  // --- 担当者への通知メール ---
  const ownerHtml = `
    <h2>Webサイトからお問い合わせが届きました</h2>
    <table cellpadding="6" style="border-collapse:collapse;font-size:14px">
      <tr><td><b>種類</b></td><td>${esc(type)}</td></tr>
      <tr><td><b>お名前</b></td><td>${esc(name)}</td></tr>
      <tr><td><b>メール</b></td><td>${esc(email)}</td></tr>
      <tr><td><b>電話</b></td><td>${esc(phone) || '-'}</td></tr>
      <tr><td valign="top"><b>ご希望・日程</b></td><td>${nl2br(detail) || '-'}</td></tr>
      <tr><td valign="top"><b>内容</b></td><td>${nl2br(content)}</td></tr>
      <tr><td valign="top"><b>添付</b></td><td>${attListHtml}</td></tr>
      <tr><td><b>受信</b></td><td>${esc(receivedAt)}</td></tr>
    </table>
    <p style="color:#888;font-size:12px">このメールに返信すると、お問い合わせ者（${esc(email)}）へ直接返信できます。</p>
  `;

  let ownerSent = false;
  try {
    ownerSent = await sendResendEmail({
      to: CONTACT_TO,
      subject: `【お問い合わせ】${type}／${name}様`,
      html: ownerHtml,
      attachments,
      replyTo: email,
    });
  } catch (err) { console.error('owner mail failed:', err); }

  if (!ownerSent) {
    // 担当者へ届かないなら失敗として返す（送信者に再送を促すため）
    return new Response(JSON.stringify({ ok: false, error: 'mail_failed' }), { status: 502 });
  }

  // --- 送信者への自動返信（ベストエフォート） ---
  const isJa = lang !== 'en';
  const ackHtml = isJa ? `
    <h2>お問い合わせありがとうございます</h2>
    <p>${esc(name)} 様</p>
    <p>下記の内容でお問い合わせを承りました。担当者より、こちらのメールアドレス宛にご返信いたします。ご返信まで少しお時間をいただく場合がございます。</p>
    <hr>
    <p><b>種類</b>：${esc(type)}</p>
    <p><b>内容</b>：<br>${nl2br(content)}</p>
    ${detail ? `<p><b>ご希望・日程</b>：<br>${nl2br(detail)}</p>` : ''}
    ${attachments.length ? `<p><b>添付</b>：<br>${attListHtml}</p>` : ''}
    <hr>
    <p>お急ぎの際はお電話（TEL：098-087-7797）にてご連絡ください。</p>
    <p>SHUKUBA ─ 古民家の宿 滋賀</p>
  ` : `
    <h2>Thank you for your inquiry</h2>
    <p>Dear ${esc(name)},</p>
    <p>We have received your inquiry as below. Our team will reply to this email address. Please allow some time for our response.</p>
    <hr>
    <p><b>Type</b>: ${esc(type)}</p>
    <p><b>Message</b>:<br>${nl2br(content)}</p>
    ${detail ? `<p><b>Preferences</b>:<br>${nl2br(detail)}</p>` : ''}
    ${attachments.length ? `<p><b>Attachments</b>:<br>${attListHtml}</p>` : ''}
    <hr>
    <p>In a hurry? Call us at +81-98-087-7797.</p>
    <p>SHUKUBA ─ Historic Machiya Inn, Shiga</p>
  `;
  try {
    await sendResendEmail({
      to: email,
      subject: isJa ? '【SHUKUBA】お問い合わせを受け付けました' : '[SHUKUBA] We received your inquiry',
      html: ackHtml,
      replyTo: CONTACT_TO,
    });
  } catch (err) { console.error('ack mail failed:', err); }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/contact',
};
