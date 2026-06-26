import { getStore } from '@netlify/blobs';

function checkAuth(req) {
  const key = req.headers.get('x-admin-key');
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

export default async (req) => {
  if (!checkAuth(req)) {
    return new Response('unauthorized', { status: 401 });
  }
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!key || !key.startsWith('passport-photos/')) {
    return new Response('invalid key', { status: 400 });
  }
  const store = getStore('shukuba-bookings');
  const entry = await store.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!entry || !entry.data) {
    return new Response('not found', { status: 404 });
  }
  const contentType = entry.metadata?.type || 'image/jpeg';
  return new Response(entry.data, {
    status: 200,
    headers: { 'Content-Type': contentType, 'Cache-Control': 'no-store' },
  });
};

export const config = {
  path: '/.netlify/functions/passport-photo',
};
