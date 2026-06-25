import { runCheckinReminders } from './lib/checkin-reminders-core.js';

export default async () => {
  await runCheckinReminders();
  return new Response('ok', { status: 200 });
};

export const config = {
  schedule: '0 9 * * *',
};
