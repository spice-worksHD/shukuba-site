// 公式LINEのリッチメニューを管理画面から登録・更新・解除するAPI。
// LINE Messaging API の Rich Menu を使い、2×2の各マスをティザーLPのURLにリンクさせる。
const ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const SITE = process.env.SITE_URL || 'https://shukuba-shiga.com';

// メニュー画像は 2500×1686。半分ずつ 1250×843 の4マスに分割し、各LPへリンク。
const AREAS = [
  { label: '施設案内', uri: `${SITE}/lp/facility/`, bounds: { x: 0, y: 0, width: 1250, height: 843 } },
  { label: 'エリア観光', uri: `${SITE}/lp/area/`, bounds: { x: 1250, y: 0, width: 1250, height: 843 } },
  { label: '見どころ', uri: `${SITE}/lp/spots/`, bounds: { x: 0, y: 843, width: 1250, height: 843 } },
  { label: 'ご滞在案内', uri: `${SITE}/lp/stay/`, bounds: { x: 1250, y: 843, width: 1250, height: 843 } },
];

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

function checkAuth(req) {
  const key = req.headers.get('x-admin-key');
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

const authHeader = { Authorization: `Bearer ${ACCESS_TOKEN}` };

async function lineList() {
  const res = await fetch('https://api.line.me/v2/bot/richmenu/list', { headers: authHeader });
  if (!res.ok) return [];
  const j = await res.json();
  return (j.richmenus || []).map((m) => ({ id: m.richMenuId, name: m.name }));
}

async function currentDefault() {
  const res = await fetch('https://api.line.me/v2/bot/user/all/richmenu', { headers: authHeader });
  if (!res.ok) return null; // 404 = 未設定
  const j = await res.json();
  return j.richMenuId || null;
}

async function deleteMenu(id) {
  await fetch(`https://api.line.me/v2/bot/richmenu/${id}`, { method: 'DELETE', headers: authHeader });
}

const areaSummary = () => AREAS.map((a) => ({ label: a.label, uri: a.uri }));

export default async (req) => {
  if (!checkAuth(req)) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!ACCESS_TOKEN) return json({ ok: false, error: 'no_access_token' }, 500);

  let data = {};
  if (req.method === 'POST') { try { data = await req.json(); } catch {} }
  const action = data.action || 'status';

  // 現在の設定状況
  if (action === 'status') {
    const [defaultId, menus] = await Promise.all([currentDefault(), lineList()]);
    return json({ ok: true, defaultId, count: menus.length, areas: areaSummary(), imageUrl: `${SITE}/richmenu.jpg` });
  }

  // 登録／更新（作成→画像アップ→デフォルト設定→古いメニュー掃除）
  if (action === 'set') {
    // 1. リッチメニュー作成
    const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        size: { width: 2500, height: 1686 },
        selected: true,
        name: `shukuba-${Date.now()}`,
        chatBarText: 'メニュー',
        areas: AREAS.map((a) => ({ bounds: a.bounds, action: { type: 'uri', uri: a.uri } })),
      }),
    });
    if (!createRes.ok) return json({ ok: false, error: `作成失敗: ${await createRes.text()}` }, 500);
    const { richMenuId } = await createRes.json();

    // 2. メニュー画像を自サイトから取得してアップロード
    const imgRes = await fetch(`${SITE}/richmenu.jpg`);
    if (!imgRes.ok) {
      await deleteMenu(richMenuId);
      return json({ ok: false, error: `画像取得失敗(${imgRes.status}): ${SITE}/richmenu.jpg` }, 500);
    }
    const imgBuf = await imgRes.arrayBuffer();
    const upRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg', ...authHeader },
      body: imgBuf,
    });
    if (!upRes.ok) {
      await deleteMenu(richMenuId);
      return json({ ok: false, error: `画像アップ失敗: ${await upRes.text()}` }, 500);
    }

    // 3. 全友だちのデフォルトに設定
    const defRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
      method: 'POST', headers: authHeader,
    });
    if (!defRes.ok) return json({ ok: false, error: `表示設定失敗: ${await defRes.text()}` }, 500);

    // 4. 新メニュー以外を掃除（重複防止）
    const menus = await lineList();
    for (const m of menus) if (m.id !== richMenuId) await deleteMenu(m.id);

    return json({ ok: true, richMenuId, areas: areaSummary() });
  }

  // 解除（デフォルト解除＋全削除）
  if (action === 'clear') {
    await fetch('https://api.line.me/v2/bot/user/all/richmenu', { method: 'DELETE', headers: authHeader });
    const menus = await lineList();
    for (const m of menus) await deleteMenu(m.id);
    return json({ ok: true });
  }

  return json({ ok: false, error: 'unknown_action' }, 400);
};

export const config = {
  path: '/.netlify/functions/richmenu',
};
