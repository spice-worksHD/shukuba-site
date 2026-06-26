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
  input[type="file"] { padding: 8px; background: #fafafa; }
  input:focus, textarea:focus, select:focus { outline: none; border-color: var(--susuki); box-shadow: 0 0 0 3px rgba(138,110,75,0.15); }
  textarea { resize: vertical; min-height: 64px; }
  .hint { font-size: 11px; color: var(--muted); margin-top: 4px; line-height: 1.6; }
  .req { color: var(--bengara); }
  .btn { display: inline-block; width: 100%; padding: 14px; background: var(--reed); color: #fff; border: none;
    border-radius: 6px; font-size: 14px; letter-spacing: 2px; cursor: pointer; margin-top: 28px; transition: background .2s; }
  .btn:hover { background: var(--dark); }
  .error { background: #fbe9e7; color: #b8584f; font-size: 12px; padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; }
  .done-mark { text-align: center; }
  .done-mark p { font-size: 14px; line-height: 1.9; color: var(--muted); }
  #passport-field { display: none; }
  .photo-section { margin-top: 24px; border: 1px dashed var(--border); border-radius: 8px; padding: 16px; }
  .photo-section.required { border-color: var(--susuki); background: #faf7f0; }
  .photo-preview { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  .photo-preview img { width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); }
  .lang-switch { text-align: right; font-size: 11px; color: var(--muted); margin-bottom: 16px; }
  .lang-switch a { color: var(--susuki); text-decoration: none; }
`;

const i18n = {
  ja: {
    docTitle: 'チェックイン手続き',
    lead: 'ご来訪前のお手続きとして、宿泊者名簿のご記入をお願いいたします（旅館業法に基づく必須事項です）。',
    labelName: '代表者氏名', labelNameKana: 'フリガナ',
    labelAddress: 'ご住所', placeholderAddress: '都道府県・市区町村・番地まで',
    labelPhone: '電話番号', labelOccupation: 'ご職業',
    labelNationality: '国籍', defaultNationality: '日本',
    hintPassport: '日本国内に住所をお持ちでない方は、旅券（パスポート）番号のご記入が必要です。',
    labelPassportNumber: '旅券（パスポート）番号',
    labelArrivalTime: '到着予定時刻',
    labelCompanions: '同行者（代表者以外の方）',
    addCompanionBtn: '＋ 同行者を追加',
    companionLabel: '同行者', companionName: '氏名', companionNationality: '国籍',
    companionPassportNumber: '旅券（パスポート）番号', companionPassportRequired: '必須',
    companionAddress: '住所（代表者と同一の場合は空欄）', companionNote: '備考', companionDelete: '削除',
    labelPassportPhotos: 'パスポート写真',
    passportPhotoHint: (n) => `外国籍の方${n}名分のパスポート（顔写真ページ）の写真をアップロードしてください。複数枚選択可。`,
    passportPhotoNotRequired: '全員日本国籍の場合はアップロード不要です。',
    submitBtn: 'この内容で送信する',
    errName: '代表者氏名を入力してください。',
    errNameKana: 'フリガナを入力してください。',
    errAddress: 'ご住所を入力してください。',
    errOccupation: 'ご職業を入力してください。',
    errPassportNumber: '日本国内に住所をお持ちでない場合は、旅券番号の入力が必要です。',
    errPassportPhoto: (req, got) => `外国籍の方${req}名分のパスポート写真が必要です（現在${got}枚）。`,
    doneTitle: 'チェックイン手続きが完了しました',
    doneMsg: '宿泊者名簿のご記入ありがとうございました。チェックイン手続きが完了しました。当日のお越しをお待ちしております。',
    alreadyTitle: 'チェックイン手続き済みです',
    alreadyMsg: 'このご予約はすでにチェックイン手続きが完了しています。当日のお越しをお待ちしております。',
    cancelTitle: 'ご予約はキャンセルされています',
    cancelMsg: 'このご予約はキャンセル済みのため、チェックイン手続きを行うことができません。',
    invalidTitle: 'リンクが無効です',
    invalidMsg: 'このチェックインリンクは無効です。お手数ですが宿までお問い合わせください。',
    notFoundMsg: '該当する予約が見つかりません。このチェックインリンクは無効です。',
    checkinLabel: 'チェックイン', checkoutLabel: 'チェックアウト',
    guestsLabel: '人数', guestUnit: '名', reservedByLabel: 'ご予約者',
    langSwitchLink: 'English',
  },
  en: {
    docTitle: 'Guest Registration',
    lead: 'Please complete the guest registration form before your arrival. This is a legal requirement under the Japanese Inn Business Act (Ryokan Gyouhou).',
    labelName: 'Lead Guest Name (Full Name)', labelNameKana: 'Name (Romaji)',
    labelAddress: 'Home Address', placeholderAddress: 'Country, City, Street Address',
    labelPhone: 'Phone Number', labelOccupation: 'Occupation',
    labelNationality: 'Nationality', defaultNationality: '',
    hintPassport: 'Non-Japanese residents must provide their passport number.',
    labelPassportNumber: 'Passport Number',
    labelArrivalTime: 'Estimated Arrival Time',
    labelCompanions: 'Additional Guests',
    addCompanionBtn: '＋ Add Guest',
    companionLabel: 'Guest', companionName: 'Full Name', companionNationality: 'Nationality',
    companionPassportNumber: 'Passport Number', companionPassportRequired: 'Required',
    companionAddress: 'Home Address (leave blank if same as lead guest)', companionNote: 'Notes', companionDelete: 'Remove',
    labelPassportPhotos: 'Passport Photos',
    passportPhotoHint: (n) => `Please upload a clear photo of the passport photo page for each non-Japanese guest (${n} required). You can select multiple files at once.`,
    passportPhotoNotRequired: 'No passport photos required (all guests are Japanese nationals).',
    submitBtn: 'Submit',
    errName: 'Please enter the lead guest name.',
    errNameKana: 'Please enter the name in Romaji.',
    errAddress: 'Please enter your home address.',
    errOccupation: 'Please enter your occupation.',
    errPassportNumber: 'Non-Japanese residents must provide a passport number.',
    errPassportPhoto: (req, got) => `Passport photo required for ${req} non-Japanese guest(s). You have uploaded ${got}.`,
    doneTitle: 'Registration Complete',
    doneMsg: 'Thank you for completing the guest registration. We look forward to welcoming you.',
    alreadyTitle: 'Already Registered',
    alreadyMsg: 'This reservation has already been checked in. We look forward to your arrival.',
    cancelTitle: 'Reservation Cancelled',
    cancelMsg: 'This reservation has been cancelled. Please contact us if you have any questions.',
    invalidTitle: 'Invalid Link',
    invalidMsg: 'This check-in link is invalid. Please contact the inn for assistance.',
    notFoundMsg: 'No reservation found for this link.',
    checkinLabel: 'Check-in', checkoutLabel: 'Check-out',
    guestsLabel: 'Guests', guestUnit: 'pax', reservedByLabel: 'Reservation Name',
    langSwitchLink: '日本語',
  },
};

function page(title, body, lang = 'ja') {
  return `<!DOCTYPE html>
<html lang="${lang}">
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
  const n = (nationality || '').trim().toLowerCase();
  return n === '' || n === '日本' || n === '日本国' || n === 'japan' || n === 'japanese';
}

function countNonJapanese(nationality, companionsJson) {
  let n = isJapan(nationality) ? 0 : 1;
  try {
    const companions = JSON.parse(companionsJson || '[]');
    for (const c of companions) {
      if (c.nationality && !isJapan(c.nationality)) n++;
    }
  } catch {}
  return n;
}

function renderForm({ booking, error, values, lang = 'ja', checkinUrl }) {
  const v = values || {};
  const T = i18n[lang];
  const otherLang = lang === 'ja' ? 'en' : 'ja';
  const nationality = v.nationality ?? (lang === 'en' ? '' : '日本');
  const langSwitchUrl = checkinUrl
    ? (lang === 'ja' ? checkinUrl + '&lang=en' : checkinUrl.replace('&lang=en', '').replace('?lang=en&', '?').replace('?lang=en', ''))
    : '#';

  return `
    <div class="lang-switch">
      <a href="${html(langSwitchUrl)}">${html(T.langSwitchLink)}</a>
    </div>
    <p class="lead">${T.lead}</p>
    <div class="summary">
      <strong>${html(booking.roomName || '')}</strong><br>
      ${T.checkinLabel}: ${html(booking.checkin)} 〜 ${T.checkoutLabel}: ${html(booking.checkout)}<br>
      ${T.guestsLabel}: ${booking.guests || '-'}${T.guestUnit} ／ ${T.reservedByLabel}: ${html(booking.name)}
    </div>
    ${error ? `<div class="error">${html(error)}</div>` : ''}
    <form method="POST" enctype="multipart/form-data">
      <input type="hidden" name="id" value="${html(booking.id)}">
      <input type="hidden" name="token" value="${html(booking.checkinToken)}">
      <input type="hidden" name="lang" value="${html(lang)}">

      <label>${T.labelName} <span class="req">*</span></label>
      <input type="text" name="name" required value="${html(v.name ?? booking.name ?? '')}">

      <label>${T.labelNameKana} <span class="req">*</span></label>
      <input type="text" name="nameKana" required value="${html(v.nameKana ?? '')}">

      <label>${T.labelAddress} <span class="req">*</span></label>
      <input type="text" name="address" required placeholder="${T.placeholderAddress}" value="${html(v.address ?? '')}">

      <label>${T.labelPhone}</label>
      <input type="tel" name="phone" value="${html(v.phone ?? booking.phone ?? '')}">

      <label>${T.labelOccupation} <span class="req">*</span></label>
      <input type="text" name="occupation" required value="${html(v.occupation ?? '')}">

      <label>${T.labelNationality}</label>
      <input type="text" name="nationality" id="nationality-input" value="${html(nationality)}" placeholder="${T.defaultNationality || 'e.g. United States'}">
      <div class="hint">${T.hintPassport}</div>

      <div id="passport-field">
        <label>${T.labelPassportNumber} <span class="req">*</span></label>
        <input type="text" name="passportNumber" value="${html(v.passportNumber ?? '')}">
      </div>

      <label>${T.labelArrivalTime}</label>
      <input type="time" name="arrivalTime" value="${html(v.arrivalTime ?? '')}">

      <label>${T.labelCompanions}</label>
      <div id="companions-list" style="margin-bottom:8px"></div>
      <button type="button" onclick="addCompanion()"
        style="padding:8px 14px;border:1px dashed var(--border);border-radius:6px;background:#fff;font-size:13px;cursor:pointer;color:var(--muted);width:100%">
        ${T.addCompanionBtn}
      </button>
      <input type="hidden" name="companions_json" id="companions-json" value="${html(v.companions_json ?? '[]')}">

      <div id="passport-photos-section" class="photo-section" style="display:none">
        <label>${T.labelPassportPhotos} <span class="req">*</span></label>
        <p class="hint" id="passport-photos-hint"></p>
        <input type="file" name="passport_photos" multiple accept="image/*,image/heic" id="passport-photos-input">
        <div class="photo-preview" id="passport-photo-preview"></div>
      </div>
      <div id="passport-photos-none" class="photo-section" style="display:none">
        <p class="hint">${T.passportPhotoNotRequired}</p>
      </div>

      <button class="btn" type="submit">${T.submitBtn}</button>
    </form>
    <script>
    (function () {
      var lang = '${lang}';
      var i18n = ${JSON.stringify({ passportPhotoHint: null, companionLabel: T.companionLabel, companionName: T.companionName, companionNationality: T.companionNationality, companionPassportNumber: T.companionPassportNumber, companionPassportRequired: T.companionPassportRequired, companionAddress: T.companionAddress, companionNote: T.companionNote, companionDelete: T.companionDelete })};

      // Passport number toggle (main guest)
      var natInput = document.getElementById('nationality-input');
      var passField = document.getElementById('passport-field');

      function isJapan(v) {
        var n = (v||'').trim().toLowerCase();
        return n===''||n==='日本'||n==='日本国'||n==='japan'||n==='japanese';
      }

      function countNonJapanese() {
        var n = isJapan(natInput.value) ? 0 : 1;
        companions.forEach(function(c){ if(c.nationality && !isJapan(c.nationality)) n++; });
        return n;
      }

      function updatePhotoSection() {
        var n = countNonJapanese();
        var photoSection = document.getElementById('passport-photos-section');
        var noneSection = document.getElementById('passport-photos-none');
        var hintEl = document.getElementById('passport-photos-hint');
        if (n > 0) {
          photoSection.style.display = 'block';
          noneSection.style.display = 'none';
          var hintTemplates = {
            ja: '外国籍の方' + n + '名分のパスポート（顔写真ページ）の写真をアップロードしてください。複数枚選択可。',
            en: 'Please upload a clear photo of the passport photo page for each non-Japanese guest (' + n + ' required). You can select multiple files at once.'
          };
          hintEl.textContent = hintTemplates[lang] || hintTemplates.ja;
        } else {
          photoSection.style.display = 'none';
          noneSection.style.display = 'block';
        }
      }

      function syncPassport() {
        passField.style.display = isJapan(natInput.value) ? 'none' : 'block';
        updatePhotoSection();
      }
      natInput.addEventListener('input', syncPassport);
      syncPassport();

      // Photo preview
      var photosInput = document.getElementById('passport-photos-input');
      photosInput.addEventListener('change', function() {
        var preview = document.getElementById('passport-photo-preview');
        preview.innerHTML = '';
        Array.from(this.files).forEach(function(file) {
          var reader = new FileReader();
          reader.onload = function(e) {
            var img = document.createElement('img');
            img.src = e.target.result;
            preview.appendChild(img);
          };
          reader.readAsDataURL(file);
        });
      });

      // Companion management
      var companions = [];
      try { companions = JSON.parse(document.getElementById('companions-json').value || '[]'); } catch(e) {}

      function escHtml(s) {
        return String(s).replace(/[&<>"']/g, function(c) {
          return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
        });
      }

      function render() {
        var list = document.getElementById('companions-list');
        list.innerHTML = companions.map(function(c, i) {
          var showPassport = c.nationality && !isJapan(c.nationality);
          return '<div style="border:1px solid #DCD0B8;border-radius:6px;padding:12px 12px 8px;margin-bottom:8px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
              '<strong style="font-size:12px;color:var(--muted)">' + i18n.companionLabel + ' ' + (i+1) + '</strong>' +
              '<button type="button" onclick="removeCompanion(' + i + ')" style="background:none;border:none;color:#C14C32;cursor:pointer;font-size:12px;padding:0">' + i18n.companionDelete + '</button>' +
            '</div>' +
            '<label style="margin:0 0 4px">' + i18n.companionName + '</label>' +
            '<input type="text" value="' + escHtml(c.name||'') + '" oninput="updateCompanion(' + i + ',\'name\',this.value)">' +
            '<label style="margin:8px 0 4px">' + i18n.companionNationality + '</label>' +
            '<input type="text" value="' + escHtml(c.nationality||'') + '" oninput="updateCompanion(' + i + ',\'nationality\',this.value);render()">' +
            (showPassport ?
              '<label style="margin:8px 0 4px">' + i18n.companionPassportNumber + ' <span style="color:#C14C32">' + i18n.companionPassportRequired + '</span></label>' +
              '<input type="text" value="' + escHtml(c.passportNumber||'') + '" oninput="updateCompanion(' + i + ',\'passportNumber\',this.value)" placeholder="AB1234567">' : '') +
            '<label style="margin:8px 0 4px">' + i18n.companionAddress + '</label>' +
            '<input type="text" value="' + escHtml(c.address||'') + '" oninput="updateCompanion(' + i + ',\'address\',this.value)">' +
            '<label style="margin:8px 0 4px">' + i18n.companionNote + '</label>' +
            '<input type="text" value="' + escHtml(c.note||'') + '" oninput="updateCompanion(' + i + ',\'note\',this.value)">' +
          '</div>';
        }).join('');
        document.getElementById('companions-json').value = JSON.stringify(companions);
        updatePhotoSection();
      }

      window.addCompanion = function() { companions.push({name:'',nationality:'',address:'',note:'',passportNumber:''}); render(); };
      window.removeCompanion = function(i) { companions.splice(i,1); render(); };
      window.updateCompanion = function(i, key, val) { companions[i][key] = val; document.getElementById('companions-json').value = JSON.stringify(companions); };

      render();
    })();
    </script>
  `;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ja';
  const T = i18n[lang];

  const checkinUrl = `${url.origin}${url.pathname}?id=${encodeURIComponent(id || '')}&token=${encodeURIComponent(token || '')}`;

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];

  let formId = id;
  let formToken = token;
  let postedFields = null;
  let postedFiles = [];
  let postedLang = lang;

  if (req.method === 'POST') {
    const formData = await req.formData();
    formId = formData.get('id') || id;
    formToken = formData.get('token') || token;
    postedLang = formData.get('lang') === 'en' ? 'en' : 'ja';
    postedFields = {
      name: formData.get('name') || '',
      nameKana: formData.get('nameKana') || '',
      address: formData.get('address') || '',
      phone: formData.get('phone') || '',
      occupation: formData.get('occupation') || '',
      nationality: formData.get('nationality') || '',
      passportNumber: formData.get('passportNumber') || '',
      arrivalTime: formData.get('arrivalTime') || '',
      companions_json: formData.get('companions_json') || '[]',
    };
    postedFiles = formData.getAll('passport_photos').filter((f) => f && f.size > 0);
  }

  const effectiveLang = req.method === 'POST' ? postedLang : lang;
  const ET = i18n[effectiveLang];

  if (!formId || !formToken) {
    return new Response(page(ET.invalidTitle, `<p>${ET.invalidMsg}</p>`, effectiveLang), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const idx = bookings.findIndex((b) => b.id === formId && b.checkinToken === formToken);
  if (idx === -1) {
    return new Response(page(ET.invalidTitle, `<p>${ET.notFoundMsg}</p>`, effectiveLang), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const booking = bookings[idx];

  if (booking.status === 'cancelled') {
    return new Response(page(ET.cancelTitle, `<p>${ET.cancelMsg}</p>`, effectiveLang), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (req.method === 'GET') {
    if (booking.checkedIn) {
      return new Response(page(ET.alreadyTitle, `<div class="done-mark"><p>${ET.alreadyMsg}</p></div>`, effectiveLang), {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response(
      page(ET.docTitle, renderForm({ booking, values: { phone: booking.phone, name: booking.name }, lang: effectiveLang, checkinUrl }), effectiveLang),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // POST: validate and save
  const f = postedFields;
  const PL = i18n[effectiveLang];
  const errors = [];
  if (!f.name.trim()) errors.push(PL.errName);
  if (!f.nameKana.trim()) errors.push(PL.errNameKana);
  if (!f.address.trim()) errors.push(PL.errAddress);
  if (!f.occupation.trim()) errors.push(PL.errOccupation);
  if (!isJapan(f.nationality) && !f.passportNumber.trim()) errors.push(PL.errPassportNumber);

  const nonJapaneseCount = countNonJapanese(f.nationality, f.companions_json);
  if (nonJapaneseCount > 0 && postedFiles.length < nonJapaneseCount) {
    errors.push(PL.errPassportPhoto(nonJapaneseCount, postedFiles.length));
  }

  if (errors.length) {
    return new Response(
      page(ET.docTitle, renderForm({ booking, error: errors.join(' '), values: f, lang: effectiveLang, checkinUrl }), effectiveLang),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Store passport photos
  const passportPhotos = [];
  for (let i = 0; i < postedFiles.length; i++) {
    const file = postedFiles[i];
    const key = `passport-photos/${booking.id}/${i}`;
    const ab = await file.arrayBuffer();
    await store.set(key, new Uint8Array(ab), {
      metadata: { name: file.name, type: file.type || 'image/jpeg', size: file.size },
    });
    passportPhotos.push({ key, name: file.name, type: file.type || 'image/jpeg', size: file.size });
  }

  const now = new Date().toISOString();
  let companions = [];
  try {
    companions = JSON.parse(f.companions_json || '[]')
      .filter((c) => c?.name?.trim())
      .map((c) => ({
        name: c.name.trim(),
        nationality: (c.nationality || '').trim(),
        passportNumber: (c.passportNumber || '').trim(),
        address: (c.address || '').trim(),
        note: (c.note || '').trim(),
      }));
  } catch { companions = []; }

  booking.checkedIn = true;
  booking.checkedInAt = now;
  booking.ledger = {
    name: f.name.trim(),
    nameKana: f.nameKana.trim(),
    address: f.address.trim(),
    phone: f.phone.trim(),
    occupation: f.occupation.trim(),
    nationality: f.nationality.trim() || (effectiveLang === 'en' ? '' : '日本'),
    passportNumber: f.passportNumber.trim(),
    arrivalTime: f.arrivalTime.trim(),
    companions,
    passportPhotos,
    nonJapaneseCount,
  };
  booking.history = Array.isArray(booking.history) ? booking.history : [];
  booking.history.push({ event: 'checked-in', at: now, by: 'guest' });

  bookings[idx] = booking;
  await store.setJSON('bookings.json', bookings);

  return new Response(
    page(PL.doneTitle, `<div class="done-mark"><p>${PL.doneMsg}</p></div>`, effectiveLang),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
};

export const config = {
  path: '/.netlify/functions/checkin',
};
