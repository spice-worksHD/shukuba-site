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
  input[type="file"] { padding: 8px; background: #fafafa; font-size: 13px; }
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
  .passport-section { margin-top: 28px; border: 1px solid var(--susuki); border-radius: 8px; padding: 16px; background: #faf7f0; }
  .passport-section h3 { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: var(--dark); }
  .passport-slot { border: 1px dashed var(--border); border-radius: 6px; padding: 12px; margin-top: 10px; background: #fff; }
  .passport-slot label { margin: 0 0 6px; font-size: 12px; font-weight: 600; color: var(--dark); }
  .passport-slot .thumb { width: 96px; height: 70px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); margin-top: 6px; display: block; }
  .companion-card { border: 1px solid var(--border); border-radius: 6px; padding: 12px 12px 8px; margin-bottom: 8px; }
  .lang-switch { text-align: right; font-size: 11px; color: var(--muted); margin-bottom: 8px; }
  .lang-switch a { color: var(--susuki); text-decoration: none; }
  .section-divider { border: none; border-top: 1px solid var(--border); margin: 24px 0 0; }
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
    labelCompanions: '同行者',
    companionLabel: '同行者', companionName: '氏名', companionNationality: '国籍',
    companionPassportNumber: '旅券（パスポート）番号',
    companionAddress: '住所（代表者と同一の場合は空欄）', companionNote: '備考', companionDelete: '削除',
    passportSectionTitle: 'パスポート写真',
    passportSectionDesc: '外国籍のゲストは、旅券（パスポート）の顔写真ページの写真を1名につき1枚アップロードしてください。',
    passportSlotLabel: (name, role) => `${name}（${role}）`,
    passportNone: '全員日本国籍の場合、パスポート写真は不要です。',
    submitBtn: 'この内容で送信する',
    alertCompanionName: '全ての同行者の氏名を入力してください。',
    alertPassportPhoto: (req, got) => `外国籍の方${req}名分のパスポート写真が必要です（現在${got}枚）。`,
    errName: '代表者氏名を入力してください。',
    errNameKana: 'フリガナを入力してください。',
    errAddress: 'ご住所を入力してください。',
    errOccupation: 'ご職業を入力してください。',
    errPassportNumber: '日本国内に住所をお持ちでない場合は、旅券番号の入力が必要です。',
    errPassportPhoto: (req, got) => `外国籍の方${req}名分のパスポート写真が必要です（${got}枚アップロード済）。`,
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
    roleMain: '代表者',
    roleCompanion: (n) => `同行者${n}`,
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
    companionLabel: 'Guest', companionName: 'Full Name', companionNationality: 'Nationality',
    companionPassportNumber: 'Passport Number',
    companionAddress: 'Home Address (leave blank if same as lead guest)', companionNote: 'Notes', companionDelete: 'Remove',
    passportSectionTitle: 'Passport Photos',
    passportSectionDesc: 'Non-Japanese guests: please upload a clear photo of the passport photo page — one photo per person.',
    passportSlotLabel: (name, role) => `${name} (${role})`,
    passportNone: 'No passport photos required (all guests are Japanese nationals).',
    submitBtn: 'Submit',
    alertCompanionName: 'Please enter the name for all additional guests.',
    alertPassportPhoto: (req, got) => `Passport photos required for ${req} non-Japanese guest(s). You have uploaded ${got}.`,
    errName: 'Please enter the lead guest name.',
    errNameKana: 'Please enter the name in Romaji.',
    errAddress: 'Please enter your home address.',
    errOccupation: 'Please enter your occupation.',
    errPassportNumber: 'Non-Japanese residents must provide a passport number.',
    errPassportPhoto: (req, got) => `Passport photos required for ${req} non-Japanese guest(s). Uploaded: ${got}.`,
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
    roleMain: 'Lead Guest',
    roleCompanion: (n) => `Guest ${n}`,
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
  const guestCount = parseInt(booking.guests) || 1;
  const companionCount = Math.max(0, guestCount - 1);

  // Build lang switch URL
  const base = checkinUrl || '';
  const langSwitchUrl = lang === 'ja'
    ? base + '&lang=en'
    : base.replace(/&lang=en/, '');

  // Initial companions for JS (empty slots matching guest count)
  const initialCompanions = v.companions_json
    ? v.companions_json
    : JSON.stringify(Array.from({ length: companionCount }, () => ({ name: '', nationality: '', passportNumber: '', address: '', note: '' })));

  return `
    <div class="lang-switch"><a href="${html(langSwitchUrl)}">${html(T.langSwitchLink)}</a></div>
    <p class="lead">${T.lead}</p>
    <div class="summary">
      <strong>${html(booking.roomName || '')}</strong><br>
      ${T.checkinLabel}: ${html(booking.checkin)} 〜 ${T.checkoutLabel}: ${html(booking.checkout)}<br>
      ${T.guestsLabel}: ${booking.guests || '-'}${T.guestUnit} ／ ${T.reservedByLabel}: ${html(booking.name)}
    </div>
    ${error ? `<div class="error">${html(error)}</div>` : ''}
    <form method="POST" enctype="multipart/form-data" id="checkin-form" novalidate>
      <input type="hidden" name="id" value="${html(booking.id)}">
      <input type="hidden" name="token" value="${html(booking.checkinToken)}">
      <input type="hidden" name="lang" value="${html(lang)}">

      <label>${T.labelName} <span class="req">*</span></label>
      <input type="text" name="name" id="main-name" required value="${html(v.name ?? booking.name ?? '')}">

      <label>${T.labelNameKana} <span class="req">*</span></label>
      <input type="text" name="nameKana" required value="${html(v.nameKana ?? '')}">

      <label>${T.labelAddress} <span class="req">*</span></label>
      <input type="text" name="address" required placeholder="${T.placeholderAddress}" value="${html(v.address ?? '')}">

      <label>${T.labelPhone}</label>
      <input type="tel" name="phone" value="${html(v.phone ?? booking.phone ?? '')}">

      <label>${T.labelOccupation} <span class="req">*</span></label>
      <input type="text" name="occupation" required value="${html(v.occupation ?? '')}">

      <label>${T.labelNationality}</label>
      <input type="text" name="nationality" id="nationality-input"
        value="${html(v.nationality ?? T.defaultNationality)}"
        placeholder="${lang === 'en' ? 'e.g. United States' : '例: アメリカ合衆国'}">
      <div class="hint">${T.hintPassport}</div>

      <div id="passport-field">
        <label>${T.labelPassportNumber} <span class="req">*</span></label>
        <input type="text" name="passportNumber" value="${html(v.passportNumber ?? '')}">
      </div>

      <label>${T.labelArrivalTime}</label>
      <input type="time" name="arrivalTime" value="${html(v.arrivalTime ?? '')}">

      <hr class="section-divider">
      <label style="font-size:13px;font-weight:600;color:var(--dark);margin-top:20px">${T.labelCompanions}</label>
      <div id="companions-list"></div>
      <input type="hidden" name="companions_json" id="companions-json" value="${html(initialCompanions)}">

      <hr class="section-divider">
      <div class="passport-section">
        <h3>📷 ${T.passportSectionTitle}</h3>
        <p class="hint" style="margin:0 0 4px">${T.passportSectionDesc}</p>
        <div id="passport-slots"></div>
        <div id="passport-none" style="display:none;font-size:12px;color:var(--muted);padding:8px 0">${T.passportNone}</div>
      </div>

      <button class="btn" type="submit">${T.submitBtn}</button>
    </form>
    <script>
    (function () {
      var lang = '${lang}';
      var T = ${JSON.stringify({
        companionLabel: T.companionLabel, companionName: T.companionName,
        companionNationality: T.companionNationality, companionPassportNumber: T.companionPassportNumber,
        companionAddress: T.companionAddress, companionNote: T.companionNote, companionDelete: T.companionDelete,
        passportSlotLabel: null,
        alertCompanionName: T.alertCompanionName,
        alertPassportPhoto: null,
        roleMain: T.roleMain, roleCompanion: null,
      })};
      var alertPassportPhoto = ${JSON.stringify(T.alertPassportPhoto.toString())};
      var passportSlotLabel = ${JSON.stringify(T.passportSlotLabel.toString())};
      var roleCompanion = ${JSON.stringify(T.roleCompanion.toString())};

      var natInput = document.getElementById('nationality-input');
      var passField = document.getElementById('passport-field');
      var mainNameInput = document.getElementById('main-name');

      function isJapan(v) {
        var n = (v||'').trim().toLowerCase();
        return n===''||n==='日本'||n==='日本国'||n==='japan'||n==='japanese';
      }

      function escHtml(s) {
        return String(s).replace(/[&<>"']/g, function(c) {
          return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
        });
      }

      // Passport number field toggle (main guest)
      function syncPassportField() {
        passField.style.display = isJapan(natInput.value) ? 'none' : 'block';
      }
      natInput.addEventListener('input', function() { syncPassportField(); updatePassportSlots(); });
      syncPassportField();

      // Companions
      var companions = [];
      try { companions = JSON.parse(document.getElementById('companions-json').value || '[]'); } catch(e) {}

      function renderCompanions() {
        var list = document.getElementById('companions-list');
        if (companions.length === 0) {
          list.innerHTML = '<div style="font-size:12px;color:var(--muted);padding:8px 0">—</div>';
          document.getElementById('companions-json').value = '[]';
          updatePassportSlots();
          return;
        }
        list.innerHTML = companions.map(function(c, i) {
          var showPp = c.nationality && !isJapan(c.nationality);
          return '<div class="companion-card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
              '<strong style="font-size:12px;color:var(--muted)">' + T.companionLabel + ' ' + (i+1) + '</strong>' +
              '<button type="button" onclick="removeCompanion(' + i + ')" style="background:none;border:none;color:#C14C32;cursor:pointer;font-size:12px;padding:0">' + T.companionDelete + '</button>' +
            '</div>' +
            '<label style="margin:0 0 4px">' + T.companionName + ' <span class="req">*</span></label>' +
            '<input type="text" value="' + escHtml(c.name||'') + '" oninput="updateCompanion(' + i + ',\'name\',this.value);updatePassportSlots()">' +
            '<label style="margin:8px 0 4px">' + T.companionNationality + '</label>' +
            '<input type="text" value="' + escHtml(c.nationality||'') + '" oninput="updateCompanion(' + i + ',\'nationality\',this.value);renderCompanions()">' +
            (showPp ?
              '<label style="margin:8px 0 4px">' + T.companionPassportNumber + ' <span class="req">*</span></label>' +
              '<input type="text" value="' + escHtml(c.passportNumber||'') + '" oninput="updateCompanion(' + i + ',\'passportNumber\',this.value)" placeholder="AB1234567">' : '') +
            '<label style="margin:8px 0 4px">' + T.companionAddress + '</label>' +
            '<input type="text" value="' + escHtml(c.address||'') + '" oninput="updateCompanion(' + i + ',\'address\',this.value)">' +
            '<label style="margin:8px 0 4px">' + T.companionNote + '</label>' +
            '<input type="text" value="' + escHtml(c.note||'') + '" oninput="updateCompanion(' + i + ',\'note\',this.value)">' +
          '</div>';
        }).join('');
        document.getElementById('companions-json').value = JSON.stringify(companions);
        updatePassportSlots();
      }

      window.removeCompanion = function(i) { companions.splice(i,1); renderCompanions(); };
      window.updateCompanion = function(i, key, val) {
        companions[i][key] = val;
        document.getElementById('companions-json').value = JSON.stringify(companions);
      };
      window.updatePassportSlots = updatePassportSlots;

      // Passport photo slots
      function buildSlots() {
        var slots = [];
        var mainName = (mainNameInput.value||'').trim() || T.roleMain;
        if (!isJapan(natInput.value)) {
          slots.push({ idx: 0, label: mainName, role: T.roleMain });
        }
        var ppIdx = 1;
        companions.forEach(function(c, i) {
          if (c.nationality && !isJapan(c.nationality)) {
            var cName = (c.name||'').trim() || eval(roleCompanion)(i+1);
            slots.push({ idx: ppIdx++, label: cName, role: eval(roleCompanion)(i+1) });
          }
        });
        return slots;
      }

      function updatePassportSlots() {
        var slots = buildSlots();
        var container = document.getElementById('passport-slots');
        var noneEl = document.getElementById('passport-none');

        if (slots.length === 0) {
          container.innerHTML = '';
          noneEl.style.display = 'block';
          return;
        }
        noneEl.style.display = 'none';

        // Rebuild slots (preserve existing file inputs if slot count same)
        var existing = container.querySelectorAll('.passport-slot');
        if (existing.length !== slots.length) {
          container.innerHTML = slots.map(function(slot) {
            return '<div class="passport-slot" id="pp-slot-' + slot.idx + '">' +
              '<label>' + escHtml(eval(passportSlotLabel)(slot.label, slot.role)) + ' <span class="req">*</span></label>' +
              '<input type="file" name="passport_photo_' + slot.idx + '" accept="image/*,image/heic" ' +
                'onchange="previewPassport(this,' + slot.idx + ')">' +
              '<div id="pp-preview-' + slot.idx + '"></div>' +
            '</div>';
          }).join('');
        } else {
          // Update labels only, preserve files
          slots.forEach(function(slot, i) {
            var el = existing[i];
            if (el) el.querySelector('label').textContent = eval(passportSlotLabel)(slot.label, slot.role) + ' *';
          });
        }
      }

      window.previewPassport = function(input, idx) {
        var preview = document.getElementById('pp-preview-' + idx);
        if (!preview || !input.files || !input.files[0]) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          preview.innerHTML = '<img class="thumb" src="' + e.target.result + '">';
        };
        reader.readAsDataURL(input.files[0]);
      };

      // Form submit validation
      document.getElementById('checkin-form').addEventListener('submit', function(e) {
        // Validate companion names
        for (var i = 0; i < companions.length; i++) {
          if (!companions[i].name.trim()) {
            e.preventDefault();
            alert(T.alertCompanionName);
            return;
          }
        }
        // Validate passport photos
        var slots = buildSlots();
        if (slots.length > 0) {
          var filled = 0;
          slots.forEach(function(slot) {
            var inp = document.querySelector('[name="passport_photo_' + slot.idx + '"]');
            if (inp && inp.files && inp.files.length > 0) filled++;
          });
          if (filled < slots.length) {
            e.preventDefault();
            alert(eval(alertPassportPhoto)(slots.length, filled));
            return;
          }
        }
      });

      // Main name change → update passport slot labels
      mainNameInput.addEventListener('input', updatePassportSlots);

      // Initialize
      renderCompanions();
    })();
    </script>
  `;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ja';

  const checkinUrl = `${url.origin}${url.pathname}?id=${encodeURIComponent(id || '')}&token=${encodeURIComponent(token || '')}`;

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];

  let formId = id;
  let formToken = token;
  let postedFields = null;
  let passportFiles = [];
  let effectiveLang = lang;

  if (req.method === 'POST') {
    const formData = await req.formData();
    formId = formData.get('id') || id;
    formToken = formData.get('token') || token;
    effectiveLang = formData.get('lang') === 'en' ? 'en' : 'ja';
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
    // Collect named photo slots: passport_photo_0, passport_photo_1, ...
    for (let i = 0; i < 20; i++) {
      const file = formData.get(`passport_photo_${i}`);
      if (!file || file.size === 0) continue;
      passportFiles.push(file);
    }
  }

  const T = i18n[effectiveLang];

  if (!formId || !formToken) {
    return new Response(page(T.invalidTitle, `<p>${T.invalidMsg}</p>`, effectiveLang), {
      status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const idx = bookings.findIndex((b) => b.id === formId && b.checkinToken === formToken);
  if (idx === -1) {
    return new Response(page(T.invalidTitle, `<p>${T.notFoundMsg}</p>`, effectiveLang), {
      status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const booking = bookings[idx];

  if (booking.status === 'cancelled') {
    return new Response(page(T.cancelTitle, `<p>${T.cancelMsg}</p>`, effectiveLang), {
      status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (req.method === 'GET') {
    if (booking.checkedIn) {
      return new Response(page(T.alreadyTitle, `<div class="done-mark"><p>${T.alreadyMsg}</p></div>`, effectiveLang), {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    return new Response(
      page(T.docTitle, renderForm({ booking, values: { phone: booking.phone, name: booking.name }, lang: effectiveLang, checkinUrl }), effectiveLang),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // POST validation
  const f = postedFields;
  const errors = [];
  if (!f.name.trim()) errors.push(T.errName);
  if (!f.nameKana.trim()) errors.push(T.errNameKana);
  if (!f.address.trim()) errors.push(T.errAddress);
  if (!f.occupation.trim()) errors.push(T.errOccupation);
  if (!isJapan(f.nationality) && !f.passportNumber.trim()) errors.push(T.errPassportNumber);

  const nonJapaneseCount = countNonJapanese(f.nationality, f.companions_json);
  if (nonJapaneseCount > 0 && passportFiles.length < nonJapaneseCount) {
    errors.push(T.errPassportPhoto(nonJapaneseCount, passportFiles.length));
  }

  if (errors.length) {
    return new Response(
      page(T.docTitle, renderForm({ booking, error: errors.join(' '), values: f, lang: effectiveLang, checkinUrl }), effectiveLang),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Store passport photos
  const passportPhotos = [];
  for (let i = 0; i < passportFiles.length; i++) {
    const file = passportFiles[i];
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
        name: c.name.trim(), nationality: (c.nationality || '').trim(),
        passportNumber: (c.passportNumber || '').trim(),
        address: (c.address || '').trim(), note: (c.note || '').trim(),
      }));
  } catch { companions = []; }

  booking.checkedIn = true;
  booking.checkedInAt = now;
  booking.ledger = {
    name: f.name.trim(), nameKana: f.nameKana.trim(), address: f.address.trim(),
    phone: f.phone.trim(), occupation: f.occupation.trim(),
    nationality: f.nationality.trim() || (effectiveLang === 'en' ? '' : '日本'),
    passportNumber: f.passportNumber.trim(), arrivalTime: f.arrivalTime.trim(),
    companions, passportPhotos, nonJapaneseCount,
  };
  booking.history = Array.isArray(booking.history) ? booking.history : [];
  booking.history.push({ event: 'checked-in', at: now, by: 'guest' });

  bookings[idx] = booking;
  await store.setJSON('bookings.json', bookings);

  return new Response(
    page(T.doneTitle, `<div class="done-mark"><p>${T.doneMsg}</p></div>`, effectiveLang),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
};

export const config = {
  path: '/.netlify/functions/checkin',
};
