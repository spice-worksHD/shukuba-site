import { getStore } from '@netlify/blobs';

const THEME = `
  :root {
    --ink: #2B2118; --paper: #F4EEE2; --reed: #3D5A52; --susuki: #8A6E4B;
    --bengara: #C14C32; --dark: #211A14; --muted: #6B7770; --border: #DCD0B8;
  }
  * { box-sizing: border-box; }
  body { font-family: 'Zen Kaku Gothic New','Hiragino Sans','Yu Gothic',sans-serif; background:var(--paper); color:var(--ink); margin:0; padding:0 0 40px; }
  .brand-bar { background:var(--dark); padding:22px 16px; text-align:center; }
  .brand-bar .brand { font-family:'Shippori Mincho','Hiragino Mincho ProN',serif; font-size:20px; letter-spacing:5px; color:var(--paper); }
  .wrap { max-width:520px; margin:-20px auto 0; background:#fff; border:1px solid var(--border); border-radius:10px; padding:32px 28px; box-shadow:0 8px 28px rgba(43,33,24,.10); }
  h1 { font-family:'Shippori Mincho','Hiragino Mincho ProN',serif; font-size:19px; letter-spacing:1px; margin:0 0 8px; font-weight:600; color:var(--dark); }
  .lead { font-size:13px; color:var(--muted); margin-bottom:24px; line-height:1.8; }
  .summary { background:var(--paper); border-radius:8px; padding:14px 16px; font-size:13px; line-height:1.9; margin-bottom:24px; border-left:3px solid var(--susuki); }
  .summary strong { color:var(--dark); }
  label { display:block; font-size:12px; color:var(--muted); margin:16px 0 5px; }
  input, textarea { width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:6px; font-size:14px; font-family:inherit; color:var(--ink); background:#fff; }
  input:focus, textarea:focus { outline:none; border-color:var(--susuki); box-shadow:0 0 0 3px rgba(138,110,75,.15); }
  .req { color:var(--bengara); }
  .hint { font-size:11px; color:var(--muted); margin-top:4px; line-height:1.6; }
  .btn { display:block; width:100%; padding:14px; background:var(--reed); color:#fff; border:none; border-radius:6px; font-size:15px; letter-spacing:2px; cursor:pointer; margin-top:28px; }
  .btn:hover { background:var(--dark); }
  .error { background:#fbe9e7; color:#b8584f; font-size:12px; padding:10px 12px; border-radius:6px; margin-bottom:16px; }
  .done-mark p { font-size:14px; line-height:1.9; color:var(--muted); text-align:center; }
  .companion-card { border:1px solid var(--border); border-radius:8px; padding:14px; margin-top:10px; background:#fafafa; }
  .companion-card h4 { margin:0 0 6px; font-size:13px; color:var(--dark); }
  .divider { border:none; border-top:1px solid var(--border); margin:24px 0; }
  .pp-section { margin-top:6px; }
  .pp-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:100%; padding:18px 14px; background:#f0f7f4; border:2px dashed var(--susuki); border-radius:8px; color:var(--reed); font-size:14px; font-weight:600; cursor:pointer; margin-top:8px; }
  .pp-btn:hover { background:#e2f0ec; }
  .pp-btn svg { flex-shrink:0; }
  .pp-thumb { width:100%; max-height:180px; object-fit:contain; border-radius:6px; border:1px solid var(--border); margin-top:8px; display:none; }
  .pp-slot { margin-top:14px; }
  .pp-slot label { font-size:12px; font-weight:600; color:var(--dark); margin:0 0 4px; }
  .pp-none { font-size:12px; color:var(--muted); padding:10px 0; }
  .lang-sw { text-align:right; font-size:11px; margin-bottom:8px; }
  .lang-sw a { color:var(--susuki); text-decoration:none; }
  #main-pp-wrap, #companion-pp-wrap { display:none; }
`;

const L = {
  ja: {
    title:'チェックイン手続き', lead:'ご来訪前に宿泊者名簿のご記入をお願いいたします（旅館業法に基づく必須事項です）。',
    cin:'チェックイン', cout:'チェックアウト', guests:'人数', guestU:'名', rsvBy:'ご予約者',
    name:'代表者氏名', kana:'フリガナ', addr:'ご住所', addrP:'都道府県・市区町村・番地まで',
    phone:'電話番号', job:'ご職業', nat:'国籍', natP:'例: アメリカ合衆国',
    ppHint:'日本国内に住所をお持ちでない場合は旅券番号が必要です。',
    ppNum:'旅券（パスポート）番号',
    arrival:'到着予定時刻',
    companions:'同行者',
    compName:'氏名', compNat:'国籍', compNatP:'例: アメリカ合衆国', compPP:'旅券番号', compAddr:'住所（代表者と同一なら空欄）', compNote:'備考',
    ppSection:'パスポート写真（外国籍の方）',
    ppDesc:'外国籍のゲストは1名につき1枚、旅券の顔写真ページを撮影してアップロードしてください。',
    ppBtn:'📷  写真を撮影 / ライブラリから選ぶ',
    ppOf:(n)=>`${n}人目`,
    ppNone:'全員日本国籍の場合、パスポート写真は不要です。',
    submit:'この内容で送信する',
    langLink:'English',
    errName:'代表者氏名を入力してください。', errKana:'フリガナを入力してください。',
    errAddr:'住所を入力してください。', errJob:'ご職業を入力してください。',
    errPPNum:'外国籍の方は旅券番号の入力が必要です。',
    errPPPhoto:(r,g)=>`外国籍の方${r}名分のパスポート写真が必要です（現在${g}枚）。`,
    errCompName:(i)=>`同行者${i+1}の氏名を入力してください。`,
    doneTitle:'チェックイン手続きが完了しました', doneMsg:'宿泊者名簿のご記入ありがとうございました。当日のお越しをお待ちしております。',
    alreadyTitle:'チェックイン手続き済みです', alreadyMsg:'すでにチェックイン手続きが完了しています。当日のお越しをお待ちしております。',
    cancelTitle:'ご予約はキャンセルされています', cancelMsg:'このご予約はキャンセル済みです。',
    invalidTitle:'リンクが無効です', invalidMsg:'このリンクは無効です。宿までお問い合わせください。',
    notFound:'該当する予約が見つかりません。',
    roleMain:'代表者', roleComp:(i)=>`同行者${i+1}`,
  },
  en: {
    title:'Guest Registration', lead:'Please complete the guest registration form before your arrival. This is required by Japanese inn law (Ryokan Gyouhou).',
    cin:'Check-in', cout:'Check-out', guests:'Guests', guestU:' pax', rsvBy:'Reservation Name',
    name:'Lead Guest Name', kana:'Name (Romaji)', addr:'Home Address', addrP:'Country, City, Street Address',
    phone:'Phone Number', job:'Occupation', nat:'Nationality', natP:'e.g. United States',
    ppHint:'Non-Japanese residents must provide their passport number.',
    ppNum:'Passport Number',
    arrival:'Estimated Arrival Time',
    companions:'Additional Guests',
    compName:'Full Name', compNat:'Nationality', compNatP:'e.g. United States', compPP:'Passport Number', compAddr:'Home Address (leave blank if same as lead guest)', compNote:'Notes',
    ppSection:'Passport Photos (non-Japanese guests)',
    ppDesc:'Upload one clear photo of the passport photo page for each non-Japanese guest.',
    ppBtn:'📷  Take Photo / Choose from Library',
    ppOf:(n)=>`Guest ${n}`,
    ppNone:'No passport photos required (all Japanese nationals).',
    submit:'Submit',
    langLink:'日本語',
    errName:'Please enter the lead guest name.', errKana:'Please enter name in Romaji.',
    errAddr:'Please enter your home address.', errJob:'Please enter your occupation.',
    errPPNum:'Non-Japanese residents must enter a passport number.',
    errPPPhoto:(r,g)=>`Passport photos required for ${r} non-Japanese guest(s). Uploaded: ${g}.`,
    errCompName:(i)=>`Please enter the name for Guest ${i+1}.`,
    doneTitle:'Registration Complete', doneMsg:'Thank you. We look forward to welcoming you.',
    alreadyTitle:'Already Registered', alreadyMsg:'This reservation has already been checked in.',
    cancelTitle:'Reservation Cancelled', cancelMsg:'This reservation has been cancelled.',
    invalidTitle:'Invalid Link', invalidMsg:'This check-in link is invalid. Please contact the inn.',
    notFound:'No reservation found for this link.',
    roleMain:'Lead Guest', roleComp:(i)=>`Guest ${i+1}`,
  },
};

function esc(s) {
  return String(s).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function isJapan(n) {
  const v=(n||'').trim().toLowerCase();
  return v===''||v==='日本'||v==='日本国'||v==='japan'||v==='japanese';
}

function page(title, body, lang) {
  return `<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<title>${title} | SHUKUBA</title><style>${THEME}</style></head>
<body><div class="brand-bar"><span class="brand">SHUKUBA</span></div>
<div class="wrap"><h1>${title}</h1>${body}</div></body></html>`;
}

function renderForm({ booking, error, values: v = {}, lang, checkinUrl }) {
  const T = L[lang];
  const altLang = lang === 'ja' ? 'en' : 'ja';
  const altUrl = lang === 'ja' ? checkinUrl + '&lang=en' : checkinUrl.replace(/&lang=en/, '');
  const guestCount = parseInt(booking.guests) || 1;
  const companionCount = Math.max(0, guestCount - 1);
  const mainNat = v.nationality ?? (lang === 'ja' ? '日本' : '');
  const mainIsJp = isJapan(mainNat);

  // Companion cards (server-rendered, real input fields)
  let companionHtml = '';
  for (let i = 0; i < companionCount; i++) {
    const cv = (v.companions || [])[i] || {};
    const cNat = cv.nationality || '';
    const cIsJp = isJapan(cNat);
    companionHtml += `
    <div class="companion-card" id="c-card-${i}">
      <h4>${T.compName.startsWith('Full') ? `Guest ${i+1}` : `同行者 ${i+1}`}</h4>
      <label>${esc(T.compName)} <span class="req">*</span></label>
      <input type="text" name="c_name_${i}" value="${esc(cv.name||'')}">
      <label>${esc(T.compNat)}</label>
      <input type="text" name="c_nationality_${i}" value="${esc(cNat)}" placeholder="${esc(T.compNatP)}"
        oninput="onCNat(${i},this.value)">
      <div id="c-ppfield-${i}" style="display:${cIsJp?'none':'block'}">
        <label>${esc(T.compPP)} <span class="req">*</span></label>
        <input type="text" name="c_passport_${i}" value="${esc(cv.passportNumber||'')}" placeholder="AB1234567">
      </div>
      <label>${esc(T.compAddr)}</label>
      <input type="text" name="c_address_${i}" value="${esc(cv.address||'')}">
      <label>${esc(T.compNote)}</label>
      <input type="text" name="c_note_${i}" value="${esc(cv.note||'')}">
    </div>`;
  }

  // Passport photo slots (server-rendered initial state)
  let ppSlotsHtml = '';
  let ppSlotIdx = 0;
  if (!mainIsJp) {
    ppSlotsHtml += ppSlot(ppSlotIdx++, `${esc(v.name||booking.name||T.roleMain)} (${esc(T.roleMain)})`, T);
  }
  for (let i = 0; i < companionCount; i++) {
    const cv = (v.companions || [])[i] || {};
    const cNat = cv.nationality || '';
    if (!isJapan(cNat)) {
      const label = `${esc(cv.name||T.roleComp(i+1))} (${esc(T.roleComp(i+1))})`;
      ppSlotsHtml += ppSlot(ppSlotIdx++, label, T);
    }
  }
  const ppNoneStyle = ppSlotIdx === 0 ? 'block' : 'none';

  return `
  <div class="lang-sw"><a href="${esc(altUrl)}">${esc(T.langLink)}</a></div>
  <p class="lead">${T.lead}</p>
  <div class="summary">
    <strong>${esc(booking.roomName||'')}</strong><br>
    ${T.cin}: ${esc(booking.checkin)} 〜 ${T.cout}: ${esc(booking.checkout)}<br>
    ${T.guests}: ${esc(String(booking.guests||'-'))}${T.guestU} ／ ${T.rsvBy}: ${esc(booking.name)}
  </div>
  ${error ? `<div class="error">${esc(error)}</div>` : ''}
  <form method="POST" enctype="multipart/form-data" id="checkin-form" novalidate>
    <input type="hidden" name="id" value="${esc(booking.id)}">
    <input type="hidden" name="token" value="${esc(booking.checkinToken)}">
    <input type="hidden" name="lang" value="${esc(lang)}">
    <input type="hidden" name="companion_count" value="${companionCount}">

    <label>${esc(T.name)} <span class="req">*</span></label>
    <input type="text" name="name" id="main-name" value="${esc(v.name??booking.name??'')}">

    <label>${esc(T.kana)} <span class="req">*</span></label>
    <input type="text" name="nameKana" value="${esc(v.nameKana??'')}">

    <label>${esc(T.addr)} <span class="req">*</span></label>
    <input type="text" name="address" placeholder="${esc(T.addrP)}" value="${esc(v.address??'')}">

    <label>${esc(T.phone)}</label>
    <input type="tel" name="phone" value="${esc(v.phone??booking.phone??'')}">

    <label>${esc(T.job)} <span class="req">*</span></label>
    <input type="text" name="occupation" value="${esc(v.occupation??'')}">

    <label>${esc(T.nat)}</label>
    <input type="text" name="nationality" id="main-nat" value="${esc(mainNat)}" placeholder="${esc(T.natP)}"
      oninput="onMainNat(this.value)">
    <div class="hint">${T.ppHint}</div>
    <div id="main-ppfield" style="display:${mainIsJp?'none':'block'}">
      <label>${esc(T.ppNum)} <span class="req">*</span></label>
      <input type="text" name="passportNumber" value="${esc(v.passportNumber??'')}" placeholder="AB1234567">
    </div>

    <label>${esc(T.arrival)}</label>
    <input type="time" name="arrivalTime" value="${esc(v.arrivalTime??'')}">

    ${companionCount > 0 ? `<hr class="divider"><p style="font-size:13px;font-weight:600;color:var(--dark);margin:0 0 4px">${esc(T.companions)}</p>${companionHtml}` : ''}

    <hr class="divider">
    <p style="font-size:13px;font-weight:600;color:var(--dark);margin:0 0 4px">📷 ${esc(T.ppSection)}</p>
    <p class="hint" style="margin:0 0 2px">${T.ppDesc}</p>
    <div class="pp-section" id="pp-slots">${ppSlotsHtml}</div>
    <p class="pp-none" id="pp-none" style="display:${ppNoneStyle}">${T.ppNone}</p>

    <button class="btn" type="submit">${esc(T.submit)}</button>
  </form>
  <script>
  (function(){
    var lang = '${lang}';
    var companionCount = ${companionCount};
    var T = {
      roleMain: ${JSON.stringify(T.roleMain)},
      roleComp: ${JSON.stringify(Array.from({length:companionCount},(_,i)=>T.roleComp(i+1)))},
      ppBtn: ${JSON.stringify(T.ppBtn)},
      errCompName: ${JSON.stringify(Array.from({length:companionCount},(_,i)=>T.errCompName(i)))},
      errPPPhoto: ${JSON.stringify([1,2,3,4,5,6,7,8].map(r=>T.errPPPhoto(r,0)))},
      alertPP: function(r,g){ return ${JSON.stringify(T.errPPPhoto(99,0))}.replace('99',r).replace('0',g); }
    };

    function isJapan(v){ var n=(v||'').trim().toLowerCase(); return n===''||n==='日本'||n==='日本国'||n==='japan'||n==='japanese'; }

    // Tracks which passport slots are active: [{idx, personIndex}]
    var ppState = {}; // personKey -> slot index (0-based)
    var mainPpIdx = null; // current slot index for main guest

    function rebuildPPSlots(){
      var slots = [];
      var mainNat = document.getElementById('main-nat').value;
      var mainName = (document.getElementById('main-name').value||'').trim() || T.roleMain;
      if (!isJapan(mainNat)) slots.push({ key:'main', label: mainName + ' (' + T.roleMain + ')' });
      for (var i = 0; i < companionCount; i++){
        var inp = document.querySelector('[name="c_nationality_'+i+'"]');
        var cNat = inp ? inp.value : '';
        var cNameInp = document.querySelector('[name="c_name_'+i+'"]');
        var cName = (cNameInp ? cNameInp.value : '') || T.roleComp[i] || ('Guest '+(i+1));
        if (!isJapan(cNat)) slots.push({ key:'c'+i, label: cName + ' (' + (T.roleComp[i]||'Guest '+(i+1)) + ')' });
      }

      var container = document.getElementById('pp-slots');
      var noneEl = document.getElementById('pp-none');
      if (slots.length === 0){ container.innerHTML = ''; noneEl.style.display='block'; return; }
      noneEl.style.display = 'none';

      // Preserve existing slots by key; add/remove as needed
      var existing = {};
      container.querySelectorAll('[data-ppkey]').forEach(function(el){ existing[el.dataset.ppkey] = el; });

      var newHtml = '';
      slots.forEach(function(slot, idx){
        if (existing[slot.key]){
          // Update label only
          var lbl = existing[slot.key].querySelector('label');
          if (lbl) lbl.firstChild.textContent = slot.label + ' ';
        } else {
          newHtml += buildPPSlotHtml(slot.key, idx, slot.label);
        }
      });
      // Remove slots no longer needed
      Object.keys(existing).forEach(function(key){
        if (!slots.find(function(s){ return s.key===key; })){
          existing[key].remove();
        }
      });
      if (newHtml) container.insertAdjacentHTML('beforeend', newHtml);
      // Reorder DOM to match slots order
      slots.forEach(function(slot){
        var el = container.querySelector('[data-ppkey="'+slot.key+'"]');
        if (el) container.appendChild(el);
      });
    }

    function buildPPSlotHtml(key, idx, label){
      return '<div class="pp-slot" data-ppkey="'+key+'" id="ppslot-'+key+'">' +
        '<label><span>'+label+'</span> <span class="req">*</span></label>' +
        '<label class="pp-btn" for="pp-file-'+key+'">'+T.ppBtn+'</label>' +
        '<input type="file" name="passport_photo_'+key+'" id="pp-file-'+key+'" accept="image/*" style="position:absolute;opacity:0;width:1px;height:1px" onchange="onPPFile(this,\''+key+'\')">' +
        '<img class="pp-thumb" id="pp-thumb-'+key+'">' +
      '</div>';
    }

    window.onPPFile = function(input, key){
      var img = document.getElementById('pp-thumb-'+key);
      if (!img || !input.files || !input.files[0]) return;
      var r = new FileReader();
      r.onload = function(e){ img.src = e.target.result; img.style.display='block'; };
      r.readAsDataURL(input.files[0]);
    };

    window.onMainNat = function(val){
      document.getElementById('main-ppfield').style.display = isJapan(val)?'none':'block';
      rebuildPPSlots();
    };
    window.onCNat = function(i, val){
      var ppf = document.getElementById('c-ppfield-'+i);
      if (ppf) ppf.style.display = isJapan(val)?'none':'block';
      rebuildPPSlots();
    };

    // Update passport slot labels when names are typed
    document.getElementById('main-name').addEventListener('input', rebuildPPSlots);
    for (var ci = 0; ci < companionCount; ci++){
      var cni = document.querySelector('[name="c_name_'+ci+'"]');
      if (cni) cni.addEventListener('input', rebuildPPSlots);
    }

    // Form submit validation
    document.getElementById('checkin-form').addEventListener('submit', function(e){
      var mainName = (document.getElementById('main-name').value||'').trim();
      if (!mainName){ e.preventDefault(); alert(lang==='en'?'Please enter the lead guest name.':'代表者氏名を入力してください。'); return; }
      // Companion names
      for (var i = 0; i < companionCount; i++){
        var inp = document.querySelector('[name="c_name_'+i+'"]');
        if (!inp || !(inp.value||'').trim()){
          e.preventDefault();
          alert(T.errCompName[i] || ('同行者'+(i+1)+'の氏名を入力してください。'));
          return;
        }
      }
      // Passport photos
      var slots = document.querySelectorAll('#pp-slots [data-ppkey]');
      var needed = slots.length;
      if (needed > 0){
        var filled = 0;
        slots.forEach(function(slot){
          var key = slot.dataset.ppkey;
          var inp = document.getElementById('pp-file-'+key);
          if (inp && inp.files && inp.files.length > 0) filled++;
        });
        if (filled < needed){
          e.preventDefault();
          var msg = lang==='en'
            ? 'Passport photos required for '+needed+' guest(s). Uploaded: '+filled+'.'
            : '外国籍の方'+needed+'名分のパスポート写真が必要です（現在'+filled+'枚）。';
          alert(msg);
          return;
        }
      }
    });
  })();
  </script>`;
}

function ppSlot(idx, label, T) {
  const key = `slot${idx}`;
  return `<div class="pp-slot" data-ppkey="${key}" id="ppslot-${key}">
    <label><span>${label}</span> <span class="req">*</span></label>
    <label class="pp-btn" for="pp-file-${key}">${esc(T.ppBtn)}</label>
    <input type="file" name="passport_photo_${key}" id="pp-file-${key}" accept="image/*"
      style="position:absolute;opacity:0;width:1px;height:1px" onchange="onPPFile(this,'${key}')">
    <img class="pp-thumb" id="pp-thumb-${key}">
  </div>`;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'ja';
  const checkinUrl = `${url.origin}${url.pathname}?id=${encodeURIComponent(id||'')}&token=${encodeURIComponent(token||'')}`;

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json', { type: 'json' })) || [];

  let formId = id, formToken = token, fields = null, passportFiles = [], postLang = lang, companionCount = 0;

  if (req.method === 'POST') {
    const fd = await req.formData();
    formId = fd.get('id') || id;
    formToken = fd.get('token') || token;
    postLang = fd.get('lang') === 'en' ? 'en' : 'ja';
    companionCount = parseInt(fd.get('companion_count') || '0') || 0;
    fields = {
      name: fd.get('name') || '', nameKana: fd.get('nameKana') || '',
      address: fd.get('address') || '', phone: fd.get('phone') || '',
      occupation: fd.get('occupation') || '', nationality: fd.get('nationality') || '',
      passportNumber: fd.get('passportNumber') || '', arrivalTime: fd.get('arrivalTime') || '',
      companions: Array.from({ length: companionCount }, (_, i) => ({
        name: (fd.get(`c_name_${i}`) || '').trim(),
        nationality: (fd.get(`c_nationality_${i}`) || '').trim(),
        passportNumber: (fd.get(`c_passport_${i}`) || '').trim(),
        address: (fd.get(`c_address_${i}`) || '').trim(),
        note: (fd.get(`c_note_${i}`) || '').trim(),
      })),
    };
    // Collect named photo slots
    for (const [key, val] of fd.entries()) {
      if (key.startsWith('passport_photo_') && val && val.size > 0) {
        passportFiles.push(val);
      }
    }
  }

  const effectiveLang = req.method === 'POST' ? postLang : lang;
  const T = L[effectiveLang];

  if (!formId || !formToken) {
    return new Response(page(T.invalidTitle, `<p>${T.invalidMsg}</p>`, effectiveLang), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  const idx = bookings.findIndex(b => b.id === formId && b.checkinToken === formToken);
  if (idx === -1) {
    return new Response(page(T.invalidTitle, `<p>${T.notFound}</p>`, effectiveLang), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  const booking = bookings[idx];
  if (booking.status === 'cancelled') {
    return new Response(page(T.cancelTitle, `<p>${T.cancelMsg}</p>`, effectiveLang), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  if (req.method === 'GET') {
    if (booking.checkedIn) {
      return new Response(page(T.alreadyTitle, `<div class="done-mark"><p>${T.alreadyMsg}</p></div>`, effectiveLang), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response(
      page(T.title, renderForm({ booking, values: { phone: booking.phone, name: booking.name }, lang: effectiveLang, checkinUrl }), effectiveLang),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // POST: validate
  const f = fields;
  const errors = [];
  if (!f.name.trim()) errors.push(T.errName);
  if (!f.nameKana.trim()) errors.push(T.errKana);
  if (!f.address.trim()) errors.push(T.errAddr);
  if (!f.occupation.trim()) errors.push(T.errJob);
  if (!isJapan(f.nationality) && !f.passportNumber.trim()) errors.push(T.errPPNum);
  f.companions.forEach((c, i) => { if (!c.name) errors.push(T.errCompName(i)); });

  let nonJpCount = isJapan(f.nationality) ? 0 : 1;
  f.companions.forEach(c => { if (!isJapan(c.nationality)) nonJpCount++; });
  if (nonJpCount > 0 && passportFiles.length < nonJpCount) errors.push(T.errPPPhoto(nonJpCount, passportFiles.length));

  if (errors.length) {
    return new Response(
      page(T.title, renderForm({ booking, error: errors.join(' '), values: f, lang: effectiveLang, checkinUrl }), effectiveLang),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Store photos
  const passportPhotos = [];
  for (let i = 0; i < passportFiles.length; i++) {
    const file = passportFiles[i];
    const key = `passport-photos/${booking.id}/${i}`;
    const ab = await file.arrayBuffer();
    await store.set(key, new Uint8Array(ab), { metadata: { name: file.name, type: file.type || 'image/jpeg', size: file.size } });
    passportPhotos.push({ key, name: file.name, type: file.type || 'image/jpeg', size: file.size });
  }

  const now = new Date().toISOString();
  booking.checkedIn = true;
  booking.checkedInAt = now;
  booking.ledger = {
    name: f.name.trim(), nameKana: f.nameKana.trim(), address: f.address.trim(),
    phone: f.phone.trim(), occupation: f.occupation.trim(),
    nationality: f.nationality.trim() || (effectiveLang === 'en' ? '' : '日本'),
    passportNumber: f.passportNumber.trim(), arrivalTime: f.arrivalTime.trim(),
    companions: f.companions.filter(c => c.name),
    passportPhotos, nonJapaneseCount: nonJpCount,
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

export const config = { path: '/.netlify/functions/checkin' };
