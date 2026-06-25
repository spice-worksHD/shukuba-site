import { runCheckinReminders } from './lib/checkin-reminders-core.js';

function checkAuth(req) {
  const key = req.headers.get('x-admin-key');
  return Boolean(process.env.ADMIN_KEY) && key === process.env.ADMIN_KEY;
}

export default async (req) => {
  if (req.method !== 'POST' || !checkAuth(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let forceAll = false;
  try {
    const body = await req.json();
    forceAll = !!body.forceAll;
  } catch {
    // no body sent — default forceAll=false
  }

  const result = await runCheckinReminders({ forceAll });
  return new Response(JSON.stringify({ ok: true, ...result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = {
  path: '/.netlify/functions/send-checkin-reminders-now',
};
