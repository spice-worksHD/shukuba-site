import { getStore } from '@netlify/blobs';

const THEME = `
  :root { --ink:#2B2118;--paper:#F4EEE2;--reed:#3D5A52;--susuki:#8A6E4B;--bengara:#C14C32;--dark:#211A14;--muted:#6B7770;--border:#DCD0B8; }
  *{box-sizing:border-box;}
  body{font-family:'Zen Kaku Gothic New','Hiragino Sans','Yu Gothic',sans-serif;background:var(--paper);color:var(--ink);margin:0;padding:0 0 40px;}
  .brand-bar{background:var(--dark);padding:22px 16px;text-align:center;}
  .brand-bar .brand{font-family:'Shippori Mincho','Hiragino Mincho ProN',serif;font-size:20px;letter-spacing:5px;color:var(--paper);}
  .wrap{max-width:520px;margin:-20px auto 0;background:#fff;border:1px solid var(--border);border-radius:10px;padding:28px 22px;box-shadow:0 8px 28px rgba(43,33,24,.10);}
  h1{font-family:'Shippori Mincho','Hiragino Mincho ProN',serif;font-size:18px;letter-spacing:1px;margin:0 0 8px;font-weight:600;color:var(--dark);}
  .lead{font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.8;}
  .summary{background:var(--paper);border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.9;margin-bottom:20px;border-left:3px solid var(--susuki);}
  label{display:block;font-size:12px;color:var(--muted);margin:14px 0 5px;}
  label.field-label{font-weight:600;color:var(--dark);font-size:13px;}
  input,textarea{width:100%;padding:11px 12px;border:1px solid var(--border);border-radius:6px;font-size:15px;font-family:inherit;color:var(--ink);background:#fff;-webkit-appearance:none;}
  input:focus,textarea:focus{outline:none;border-color:var(--susuki);box-shadow:0 0 0 3px rgba(61,90,82,.12);}
  input[type=file]{padding:0;border:none;background:none;font-size:14px;}
  .req{color:var(--bengara);}
  .hint{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.6;}
  .btn{display:block;width:100%;padding:15px;background:var(--reed);color:#fff;border:none;border-radius:8px;font-size:15px;letter-spacing:2px;cursor:pointer;margin-top:28px;-webkit-appearance:none;}
  .btn:active{background:var(--dark);}
  .error{background:#fbe9e7;color:#b8584f;font-size:13px;padding:12px 14px;border-radius:6px;margin-bottom:16px;}
  .field-error{color:#b8584f;font-size:12px;margin-top:4px;display:none;}
  .field-err input,.field-err textarea{border-color:#b8584f;}
  .done-mark p{font-size:14px;line-height:1.9;color:var(--muted);text-align:center;}
  .card{border:1px solid var(--border);border-radius:8px;padding:14px;margin-top:10px;background:#fafafa;}
  .card h4{margin:0 0 8px;font-size:13px;font-weight:700;color:var(--dark);}
  .section-title{font-size:13px;font-weight:700;color:var(--dark);margin:20px 0 4px;}
  .divider{border:none;border-top:1px solid var(--border);margin:22px 0;}
  .pp-card{border:2px solid var(--susuki);border-radius:8px;padding:14px;margin-top:10px;background:#f5faf8;}
  .pp-card h4{margin:0 0 6px;font-size:13px;font-weight:700;color:var(--reed);}
  .pp-pick{position:relative;display:block;width:100%;padding:15px 14px;background:#eef6f3;border:2px dashed var(--susuki);border-radius:8px;font-size:14px;font-weight:600;color:var(--reed);text-align:center;cursor:pointer;margin-top:8px;-webkit-tap-highlight-color:transparent;}
  .pp-pick input[type=file]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;}
  .pp-thumb{display:block;width:100%;max-height:160px;object-fit:contain;border-radius:6px;border:1px solid var(--border);margin-top:8px;display:none;}
  .pp-none{font-size:12px;color:var(--muted);padding:10px 0;}
  .lang-sw{text-align:right;font-size:12px;margin-bottom:10px;}
  .lang-sw a{color:var(--susuki);}
`;

const L = {
  ja: {
    title:'チェックイン手続き',
    lead:'ご来訪前に宿泊者名簿のご記入をお願いいたします（旅館業法必須）。',
    cin:'チェックイン', cout:'チェックアウト', guests:'人数', gu:'名', rsvBy:'ご予約者',
    fName:'代表者氏名', fKana:'フリガナ', fAddr:'ご住所', fAddrP:'都道府県・市区町村・番地',
    fPhone:'電話番号', fJob:'ご職業', fNat:'国籍', fNatP:'例: アメリカ合衆国',
    fPPHint:'日本国外にお住まいの方は旅券番号が必要です。',
    fPPNum:'旅券（パスポート）番号', fPPNumP:'例: AB1234567',
    fArrival:'到着予定時刻',
    secComp:'同行者',
    cName:'氏名', cNat:'国籍', cNatP:'例: アメリカ合衆国',
    cPPNum:'旅券（パスポート）番号', cAddr:'住所（代表者と同一なら空欄）', cNote:'備考',
    secPP:'パスポート写真（外国籍の方）',
    ppDesc:'外国籍のゲスト1名につき、旅券の顔写真ページを1枚アップロードしてください。',
    ppBtnHint:'📷 タップして撮影またはライブラリから選択',
    ppOf:'のパスポート写真',
    ppNone:'全員日本国籍のためパスポート写真は不要です。',
    submit:'この内容で送信する',
    langLink:'English',
    roleMain:'代表者', roleComp:(i)=>`同行者${i+1}`,
    errName:'代表者氏名を入力してください。',
    errKana:'フリガナを入力してください。',
    errAddr:'住所を入力してください。',
    errJob:'ご職業を入力してください。',
    errPPNum:'日本国外にお住まいの方は旅券番号が必要です。',
    errCName:(i)=>`同行者${i+1}の氏名を入力してください。`,
    errPhoto:(r,g)=>`外国籍${r}名分のパスポート写真が必要です（現在${g}枚）。`,
    doneTitle:'手続きが完了しました',
    doneMsg:'宿泊者名簿のご記入ありがとうございました。当日のお越しをお待ちしております。',
    alreadyTitle:'手続き済みです', alreadyMsg:'すでにチェックイン手続きが完了しています。',
    cancelTitle:'キャンセル済', cancelMsg:'このご予約はキャンセル済みです。',
    invalidTitle:'リンクが無効です', invalidMsg:'このリンクは無効です。宿までお問い合わせください。',
    notFound:'予約が見つかりません。',
  },
  en: {
    title:'Guest Registration',
    lead:'Please complete the guest registration form before your arrival. Required by Japanese inn law.',
    cin:'Check-in', cout:'Check-out', guests:'Guests', gu:' pax', rsvBy:'Reservation Name',
    fName:'Lead Guest Name', fKana:'Name (Romaji)', fAddr:'Home Address', fAddrP:'Country, City, Street',
    fPhone:'Phone Number', fJob:'Occupation', fNat:'Nationality', fNatP:'e.g. United States',
    fPPHint:'Non-Japanese residents must provide a passport number.',
    fPPNum:'Passport Number', fPPNumP:'e.g. AB1234567',
    fArrival:'Estimated Arrival Time',
    secComp:'Additional Guests',
    cName:'Full Name', cNat:'Nationality', cNatP:'e.g. United States',
    cPPNum:'Passport Number', cAddr:'Home Address (blank if same as lead guest)', cNote:'Notes',
    secPP:'Passport Photos (non-Japanese guests)',
    ppDesc:'Upload one clear photo of the passport photo page for each non-Japanese guest.',
    ppBtnHint:'📷 Tap to take photo or choose from library',
    ppOf:"'s passport photo",
    ppNone:'No passport photos required (all Japanese nationals).',
    submit:'Submit',
    langLink:'日本語',
    roleMain:'Lead Guest', roleComp:(i)=>`Guest ${i+1}`,
    errName:'Please enter the lead guest name.',
    errKana:'Please enter name in Romaji.',
    errAddr:'Please enter your home address.',
    errJob:'Please enter your occupation.',
    errPPNum:'Non-Japanese residents must provide a passport number.',
    errCName:(i)=>`Please enter the name for Guest ${i+1}.`,
    errPhoto:(r,g)=>`Passport photos required for ${r} non-Japanese guest(s). Uploaded: ${g}.`,
    doneTitle:'Registration Complete',
    doneMsg:'Thank you. We look forward to welcoming you.',
    alreadyTitle:'Already Registered', alreadyMsg:'This reservation has already been checked in.',
    cancelTitle:'Reservation Cancelled', cancelMsg:'This reservation has been cancelled.',
    invalidTitle:'Invalid Link', invalidMsg:'This check-in link is invalid. Please contact the inn.',
    notFound:'No reservation found.',
  },
};

function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function isJP(n){ const v=(n||'').trim().toLowerCase(); return v===''||v==='日本'||v==='日本国'||v==='japan'||v==='japanese'; }

function page(title,body,lang){
  return `<!DOCTYPE html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<title>${title} | SHUKUBA</title><style>${THEME}</style></head>
<body><div class="brand-bar"><span class="brand">SHUKUBA</span></div>
<div class="wrap"><h1>${title}</h1>${body}</div></body></html>`;
}

function renderForm({ booking, error, values:v={}, lang, checkinUrl }) {
  const T = L[lang];
  const altLang = lang==='ja'?'en':'ja';
  const altUrl = lang==='ja' ? checkinUrl+'&lang=en' : checkinUrl.replace(/&lang=en/,'');
  const gc = parseInt(booking.guests)||1;
  const cc = Math.max(0, gc-1);

  const mainNat = v.nationality ?? (lang==='ja'?'日本':'');
  const mainIsJP = isJP(mainNat);

  // Companion cards — server-rendered real inputs
  let compHtml = '';
  for(let i=0;i<cc;i++){
    const cv = (v.companions||[])[i]||{};
    const cNat = cv.nationality||'';
    const cIsJP = isJP(cNat);
    compHtml += `<div class="card" id="c-card-${i}">
      <h4>${T.roleComp(i)}</h4>
      <label class="field-label">${esc(T.cName)}<span class="req"> ※必須</span></label>
      <input type="text" name="c_name_${i}" id="c-name-${i}" value="${esc(cv.name||'')}" autocomplete="name" oninput="onCName(${i},this.value)">
      <div class="field-error" id="c-name-err-${i}"></div>
      <label class="field-label">${esc(T.cNat)}<span class="req"> ※必須</span></label>
      <input type="text" name="c_nationality_${i}" id="c-nat-${i}" value="${esc(cNat)}" placeholder="${esc(T.cNatP)}"
        autocomplete="country-name" oninput="onCNat(${i},this.value)">
      <div class="field-error" id="c-nat-err-${i}"></div>
      <div id="c-pp-${i}" style="display:${cIsJP?'none':'block'}">
        <label>${esc(T.cPPNum)}<span class="req"> ※必須</span></label>
        <input type="text" name="c_passport_${i}" value="${esc(cv.passportNumber||'')}" placeholder="${esc(T.fPPNumP)}" autocomplete="off">
      </div>
      <label>${esc(T.cAddr)}</label>
      <input type="text" name="c_address_${i}" value="${esc(cv.address||'')}" autocomplete="street-address">
    </div>`;
  }

  // Passport photo slots — pre-rendered for all possible people, shown/hidden by JS
  // Slot 0: main guest, slots 1..cc: companions
  function ppSlot(slotId, defaultLabel, defaultDisplay, defaultName) {
    return `<div class="pp-card" id="pp-slot-${slotId}" style="display:${defaultDisplay}">
      <h4 id="pp-label-${slotId}">${defaultLabel}${esc(T.ppOf)}</h4>
      <label class="pp-pick">
        📷 ${esc(T.ppBtnHint)}
        <input type="file" name="${defaultName}" id="pp-file-${slotId}"
          accept="image/*"
          onchange="onPPFile(this,'${slotId}')">
      </label>
      <img class="pp-thumb" id="pp-thumb-${slotId}">
    </div>`;
  }

  let ppHtml = ppSlot('main', esc(T.roleMain), mainIsJP?'none':'block', 'passport_photo_main');
  for(let i=0;i<cc;i++){
    const cv=(v.companions||[])[i]||{};
    const cNat=cv.nationality||'';
    const display=isJP(cNat)?'none':'block';
    const label=esc((cv.name||'').trim()||T.roleComp(i));
    ppHtml += ppSlot(`c${i}`, label, display, `passport_photo_c${i}`);
  }
  const anyNonJP = !mainIsJP || (v.companions||[]).some(c=>!isJP(c.nationality||''));

  // Inline JS — only show/hide logic, no DOM creation
  const jsRoleMain = JSON.stringify(T.roleMain);
  const jsRoleComp = JSON.stringify(Array.from({length:cc},(_,i)=>T.roleComp(i)));
  const jsPPOf = JSON.stringify(T.ppOf);
  const jsErrCName = JSON.stringify(Array.from({length:cc},(_,i)=>T.errCName(i)));
  const jsAlertPhoto = JSON.stringify(T.errPhoto(99,0));

  return `
  <div class="lang-sw"><a href="${esc(altUrl)}">${esc(T.langLink)}</a></div>
  <p class="lead">${T.lead}</p>
  <div class="summary">
    <strong>${esc(booking.roomName||'')}</strong><br>
    ${T.cin}: ${esc(booking.checkin)} 〜 ${T.cout}: ${esc(booking.checkout)}<br>
    ${T.guests}: ${esc(String(booking.guests||'-'))}${T.gu} ／ ${T.rsvBy}: ${esc(booking.name)}
  </div>
  ${error?`<div class="error">${esc(error)}</div>`:''}
  <form method="POST" enctype="multipart/form-data" id="checkin-form" novalidate>
    <input type="hidden" name="id" value="${esc(booking.id)}">
    <input type="hidden" name="token" value="${esc(booking.checkinToken)}">
    <input type="hidden" name="lang" value="${esc(lang)}">
    <input type="hidden" name="cc" value="${cc}">

    <label class="field-label">${esc(T.fName)}<span class="req"> ※必須</span></label>
    <input type="text" name="name" id="main-name" value="${esc(v.name??booking.name??'')}" autocomplete="name" oninput="onMainName(this.value)">
    <div class="field-error" id="err-name"></div>

    ${lang==='ja'?`<label class="field-label">${esc(T.fKana)}<span class="req"> ※必須</span></label>
    <input type="text" name="nameKana" id="main-kana" value="${esc(v.nameKana??'')}" autocomplete="off">
    <div class="field-error" id="err-kana"></div>`:'<input type="hidden" name="nameKana" value="">'}

    <label class="field-label">${esc(T.fAddr)}<span class="req"> ※必須</span></label>
    <input type="text" name="address" id="main-addr" placeholder="${esc(T.fAddrP)}" value="${esc(v.address??'')}" autocomplete="street-address">
    <div class="field-error" id="err-addr"></div>

    <label>${esc(T.fPhone)}</label>
    <input type="tel" name="phone" value="${esc(v.phone??booking.phone??'')}" autocomplete="tel">

    <label class="field-label">${esc(T.fJob)}<span class="req"> ※必須</span></label>
    <input type="text" name="occupation" id="main-job" value="${esc(v.occupation??'')}" autocomplete="organization-title">
    <div class="field-error" id="err-job"></div>

    <label class="field-label">${esc(T.fNat)}<span class="req"> ※必須</span></label>
    <input type="text" name="nationality" id="main-nat" value="${esc(mainNat)}" placeholder="${esc(T.fNatP)}"
      autocomplete="country-name" oninput="onMainNat(this.value)">
    <div class="field-error" id="err-nat"></div>
    <div class="hint">${T.fPPHint}</div>
    <div id="main-pp-field" style="display:${mainIsJP?'none':'block'}">
      <label>${esc(T.fPPNum)}<span class="req"> ※必須</span></label>
      <input type="text" name="passportNumber" value="${esc(v.passportNumber??'')}" placeholder="${esc(T.fPPNumP)}" autocomplete="off">
    </div>

    <label>${esc(T.fArrival)}</label>
    <input type="time" name="arrivalTime" value="${esc(v.arrivalTime??'')}">
    <div class="field-error" id="err-form" style="display:none;background:#fbe9e7;padding:10px 12px;border-radius:6px;margin-top:16px;font-size:13px;color:#b8584f;"></div>

    ${cc>0?`<hr class="divider"><p class="section-title">${esc(T.secComp)}</p>${compHtml}`:''}

    <hr class="divider">
    <p class="section-title">📷 ${esc(T.secPP)}</p>
    <p class="hint" style="margin:0 0 4px">${T.ppDesc}</p>
    <div id="pp-slots">${ppHtml}</div>
    <p class="pp-none" id="pp-none" style="display:${anyNonJP?'none':'block'}">${T.ppNone}</p>

    <button class="btn" type="submit">${esc(T.submit)}</button>
  </form>
  <script>
  var ROLE_MAIN=${jsRoleMain};
  var ROLE_COMP=${jsRoleComp};
  var PP_OF=${jsPPOf};
  var ERR_CNAME=${jsErrCName};
  var ALERT_PHOTO=${jsAlertPhoto};
  var CC=${cc};

  function isJP(v){var n=(v||'').trim().toLowerCase();return n===''||n==='日本'||n==='日本国'||n==='japan'||n==='japanese';}

  function showSlot(id,show){
    var el=document.getElementById('pp-slot-'+id);
    if(el) el.style.display=show?'block':'none';
  }
  function setLabel(id,name){
    var el=document.getElementById('pp-label-'+id);
    if(el) el.textContent=(name||ROLE_MAIN)+PP_OF;
  }
  function updateNone(){
    var any=false;
    var slots=document.querySelectorAll('[id^="pp-slot-"]');
    for(var i=0;i<slots.length;i++){if(slots[i].style.display!=='none') any=true;}
    document.getElementById('pp-none').style.display=any?'none':'block';
  }

  function showFieldError(id,msg){
    var el=document.getElementById(id);
    if(!el) return;
    if(msg){el.textContent=msg;el.style.display='block';}
    else{el.textContent='';el.style.display='none';}
  }

  function onMainName(val){setLabel('main',(val||'').trim()||ROLE_MAIN);}
  function onMainNat(val){
    document.getElementById('main-pp-field').style.display=isJP(val)?'none':'block';
    showSlot('main',!isJP(val));
    // 同行者の国籍を代表者と同じ値に自動入力
    for(var j=0;j<CC;j++){
      var cNatInp=document.getElementById('c-nat-'+j);
      if(cNatInp&&(cNatInp.value||'').trim()===''){
        cNatInp.value=val;
        onCNat(j,val);
      }
    }
    updateNone();
  }
  function onCNat(i,val){
    document.getElementById('c-pp-'+i).style.display=isJP(val)?'none':'block';
    var nameInp=document.getElementById('c-name-'+i);
    var name=nameInp?(nameInp.value||'').trim():'';
    setLabel('c'+i, name||(ROLE_COMP[i]||('Guest '+(i+1))));
    showSlot('c'+i,!isJP(val));
    updateNone();
  }
  function onCName(i,val){
    var natInp=document.getElementById('c-nat-'+i);
    if(natInp&&!isJP(natInp.value)){
      setLabel('c'+i,(val||'').trim()||(ROLE_COMP[i]||('Guest '+(i+1))));
    }
    showFieldError('c-name-err-'+i,'');
  }
  function onPPFile(input,slotId){
    var thumb=document.getElementById('pp-thumb-'+slotId);
    if(!thumb||!input.files||!input.files[0]) return;
    var r=new FileReader();
    r.onload=function(e){thumb.src=e.target.result;thumb.style.display='block';};
    r.readAsDataURL(input.files[0]);
  }

  // ページ読み込み時に代表者国籍を同行者へ初期コピー
  (function(){
    var mainNat=document.getElementById('main-nat');
    if(mainNat&&mainNat.value){
      for(var j=0;j<CC;j++){
        var cNatInp=document.getElementById('c-nat-'+j);
        if(cNatInp&&(cNatInp.value||'').trim()===''){
          cNatInp.value=mainNat.value;
          onCNat(j,mainNat.value);
        }
      }
    }
  })();

  document.getElementById('checkin-form').addEventListener('submit',function(e){
    e.preventDefault();
    var form=this;
    var lang2=form.querySelector('[name="lang"]').value||'ja';
    var isEn=lang2==='en';
    var hasErr=false;

    // 代表者バリデーション
    var nameVal=(document.getElementById('main-name').value||'').trim();
    if(!nameVal){showFieldError('err-name',isEn?'Please enter the lead guest name.':'代表者氏名を入力してください。');hasErr=true;}
    else{showFieldError('err-name','');}

    var kanaInp=document.getElementById('main-kana');
    if(kanaInp&&!(kanaInp.value||'').trim()){showFieldError('err-kana','フリガナを入力してください。');hasErr=true;}
    else{showFieldError('err-kana','');}

    var addrVal=(document.getElementById('main-addr').value||'').trim();
    if(!addrVal){showFieldError('err-addr',isEn?'Please enter your home address.':'住所を入力してください。');hasErr=true;}
    else{showFieldError('err-addr','');}

    var jobVal=(document.getElementById('main-job').value||'').trim();
    if(!jobVal){showFieldError('err-job',isEn?'Please enter your occupation.':'ご職業を入力してください。');hasErr=true;}
    else{showFieldError('err-job','');}

    var natVal=(document.getElementById('main-nat').value||'').trim();
    if(!natVal){showFieldError('err-nat',isEn?'Please enter your nationality.':'国籍を入力してください。');hasErr=true;}
    else{showFieldError('err-nat','');}

    // 同行者バリデーション
    for(var i=0;i<CC;i++){
      var inp=document.getElementById('c-name-'+i);
      if(!inp||(inp.value||'').trim()===''){
        showFieldError('c-name-err-'+i, ERR_CNAME[i]||((i+1)+'番目の同行者の氏名を入力してください。'));
        if(!hasErr&&inp) inp.focus();
        hasErr=true;
      } else {
        showFieldError('c-name-err-'+i,'');
      }
      var cNatInp2=document.getElementById('c-nat-'+i);
      if(!cNatInp2||(cNatInp2.value||'').trim()===''){
        showFieldError('c-nat-err-'+i,isEn?'Please enter nationality.':'国籍を入力してください。');
        hasErr=true;
      } else {
        showFieldError('c-nat-err-'+i,'');
      }
    }

    // パスポート写真
    var needed=0,filled=0;
    document.querySelectorAll('[id^="pp-slot-"]').forEach(function(slot){
      if(slot.style.display==='none') return;
      needed++;
      var key=slot.id.replace('pp-slot-','');
      var f=document.getElementById('pp-file-'+key);
      if(f&&f.files&&f.files.length>0) filled++;
    });
    if(needed>0&&filled<needed){
      var msg2=isEn
        ?'Passport photos required for '+needed+' non-Japanese guest(s). Uploaded: '+filled+'.'
        :'外国籍'+needed+'名分のパスポート写真が必要です（現在'+filled+'枚）。';
      showFieldError('err-form',msg2);
      document.getElementById('err-form').style.display='block';
      hasErr=true;
    } else {
      showFieldError('err-form','');
    }

    if(hasErr){
      var firstErr=form.querySelector('.field-error[style*="block"]');
      if(firstErr) firstErr.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    var btn=form.querySelector('[type="submit"]');
    if(btn){btn.disabled=true;btn.textContent=isEn?'Sending...':'送信中...';}
    function compressPhoto(file){
      return new Promise(function(resolve){
        var img=new Image(),url=URL.createObjectURL(file);
        img.onload=function(){
          var MAX=1200,w=img.width,h=img.height;
          if(w>MAX||h>MAX){if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;}}
          var cv=document.createElement('canvas');cv.width=w;cv.height=h;
          cv.getContext('2d').drawImage(img,0,0,w,h);
          URL.revokeObjectURL(url);
          cv.toBlob(function(blob){
            resolve(new File([blob],file.name.replace(/.[^.]+$/,'.jpg'),{type:'image/jpeg'}));
          },'image/jpeg',0.75);
        };
        img.onerror=function(){URL.revokeObjectURL(url);resolve(file);};
        img.src=url;
      });
    }
    var fd=new FormData(form),photoKeys=[];
    fd.forEach(function(v,k){if(k.startsWith('passport_photo_')&&v&&v.size>0)photoKeys.push(k);});
    Promise.all(photoKeys.map(function(k){return compressPhoto(fd.get(k)).then(function(compressed){return{k:k,c:compressed};});}))
    .then(function(results){
      results.forEach(function(r){fd.set(r.k,r.c,r.c.name);});
      return fetch(window.location.href,{method:'POST',body:fd});
    })
    .then(function(res){return res.text();})
    .then(function(html){document.open();document.write(html);document.close();})
    .catch(function(){
      if(btn){btn.disabled=false;btn.textContent=lang==='en'?'Submit':'送信する';}
      alert(lang==='en'?'An error occurred.':'エラーが発生しました。再度お試しください。');
    });
  });
  </script>`;
}

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  const lang = url.searchParams.get('lang')==='en'?'en':'ja';
  const checkinUrl = `${url.origin}${url.pathname}?id=${encodeURIComponent(id||'')}&token=${encodeURIComponent(token||'')}`;

  const store = getStore('shukuba-bookings');
  const bookings = (await store.get('bookings.json',{type:'json'}))||[];

  let formId=id, formToken=token, fields=null, photoFiles=[], postLang=lang, cc=0;

  if(req.method==='POST'){
    const fd = await req.formData();
    formId=fd.get('id')||id; formToken=fd.get('token')||token;
    postLang=fd.get('lang')==='en'?'en':'ja';
    cc=parseInt(fd.get('cc')||'0')||0;
    const companions=[];
    for(let i=0;i<cc;i++){
      companions.push({
        name:(fd.get(`c_name_${i}`)||'').trim(),
        nationality:(fd.get(`c_nationality_${i}`)||'').trim(),
        passportNumber:(fd.get(`c_passport_${i}`)||'').trim(),
        address:(fd.get(`c_address_${i}`)||'').trim(),
      });
    }
    fields={
      name:fd.get('name')||'', nameKana:fd.get('nameKana')||'',
      address:fd.get('address')||'', phone:fd.get('phone')||'',
      occupation:fd.get('occupation')||'', nationality:fd.get('nationality')||'',
      passportNumber:fd.get('passportNumber')||'', arrivalTime:fd.get('arrivalTime')||'',
      companions,
    };
    for(const [k,v] of fd.entries()){
      if(k.startsWith('passport_photo_')&&v&&v.size>0) photoFiles.push({key:k,file:v});
    }
  }

  const eLang = req.method==='POST'?postLang:lang;
  const T = L[eLang];

  if(!formId||!formToken){
    return new Response(page(T.invalidTitle,`<p>${T.invalidMsg}</p>`,eLang),{status:400,headers:{'Content-Type':'text/html;charset=utf-8'}});
  }
  const idx=bookings.findIndex(b=>b.id===formId&&b.checkinToken===formToken);
  if(idx===-1){
    return new Response(page(T.invalidTitle,`<p>${T.notFound}</p>`,eLang),{status:404,headers:{'Content-Type':'text/html;charset=utf-8'}});
  }
  const booking=bookings[idx];
  if(booking.status==='cancelled'){
    return new Response(page(T.cancelTitle,`<p>${T.cancelMsg}</p>`,eLang),{status:200,headers:{'Content-Type':'text/html;charset=utf-8'}});
  }

  if(req.method==='GET'){
    if(booking.checkedIn){
      return new Response(page(T.alreadyTitle,`<div class="done-mark"><p>${T.alreadyMsg}</p></div>`,eLang),{status:200,headers:{'Content-Type':'text/html;charset=utf-8'}});
    }
    return new Response(
      page(T.title,renderForm({booking,values:{phone:booking.phone,name:booking.name},lang:eLang,checkinUrl}),eLang),
      {status:200,headers:{'Content-Type':'text/html;charset=utf-8'}}
    );
  }

  // POST: validate
  const f=fields;
  const errors=[];
  if(!f.name.trim()) errors.push(T.errName);
  if(eLang==='ja'&&!f.nameKana.trim()) errors.push(T.errKana);
  if(!f.address.trim()) errors.push(T.errAddr);
  if(!f.occupation.trim()) errors.push(T.errJob);
  if(!f.nationality.trim()) errors.push(eLang==='ja'?'国籍を入力してください。':'Please enter your nationality.');
  if(!isJP(f.nationality)&&!f.passportNumber.trim()) errors.push(T.errPPNum);
  f.companions.forEach((c,i)=>{
    if(!c.name) errors.push(T.errCName(i));
    if(!c.nationality) errors.push(eLang==='ja'?`同行者${i+1}の国籍を入力してください。`:`Please enter nationality for Guest ${i+1}.`);
  });

  let nonJP=isJP(f.nationality)?0:1;
  f.companions.forEach(c=>{if(!isJP(c.nationality)) nonJP++;});
  if(nonJP>0&&photoFiles.length<nonJP) errors.push(T.errPhoto(nonJP,photoFiles.length));

  if(errors.length){
    return new Response(
      page(T.title,renderForm({booking,error:errors.join(' '),values:f,lang:eLang,checkinUrl}),eLang),
      {status:400,headers:{'Content-Type':'text/html;charset=utf-8'}}
    );
  }

  // Store photos
  const passportPhotos=[];
  for(let i=0;i<photoFiles.length;i++){
    const {key,file}=photoFiles[i];
    const bkey=`passport-photos/${booking.id}/${i}`;
    const ab=await file.arrayBuffer();
    await store.set(bkey,new Uint8Array(ab),{metadata:{name:file.name,type:file.type||'image/jpeg',size:file.size}});
    passportPhotos.push({key:bkey,name:file.name,type:file.type||'image/jpeg',size:file.size});
  }

  const now=new Date().toISOString();
  booking.checkedIn=true; booking.checkedInAt=now;
  booking.ledger={
    name:f.name.trim(), nameKana:f.nameKana.trim(), address:f.address.trim(),
    phone:f.phone.trim(), occupation:f.occupation.trim(),
    nationality:f.nationality.trim()||(eLang==='en'?'':'日本'),
    passportNumber:f.passportNumber.trim(), arrivalTime:f.arrivalTime.trim(),
    companions:f.companions.filter(c=>c.name), passportPhotos, nonJapaneseCount:nonJP,
  };
  booking.history=Array.isArray(booking.history)?booking.history:[];
  booking.history.push({event:'checked-in',at:now,by:'guest'});
  bookings[idx]=booking;
  await store.setJSON('bookings.json',bookings);

  return new Response(
    page(T.doneTitle,`<div class="done-mark"><p>${T.doneMsg}</p></div>`,eLang),
    {status:200,headers:{'Content-Type':'text/html;charset=utf-8'}}
  );
};

export const config={path:'/.netlify/functions/checkin'};
