import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import postgres from 'npm:postgres@3.4.7';

const BATCH_SIZE = 10;
const SCHEDULER_HEADER = 'X-BQ-Assignment-Reminder-Secret';

function serviceSecret() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) {
    try {
      const parsed = JSON.parse(modern);
      if (parsed?.default) return String(parsed.default);
      const first = Object.values(parsed || {})[0];
      if (first) return String(first);
    } catch {
      // Fall through to the legacy service-role environment variable.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function schedulerSecretMatches(candidate: string) {
  if (!candidate) return false;
  const connectionString = Deno.env.get('SUPABASE_DB_URL') || '';
  if (!connectionString) return false;

  const sql = postgres(connectionString, { prepare: false, max: 1 });
  try {
    const rows = await sql`
      select exists (
        select 1
        from vault.decrypted_secrets
        where name = 'bq_assignment_reminder_scheduler_secret'
          and nullif(trim(decrypted_secret), '') is not null
          and decrypted_secret = ${candidate}
      ) as matched
    `;
    return rows?.[0]?.matched === true;
  } catch {
    console.error('assignment reminder scheduler Vault verification failed');
    return false;
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
}

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const key = serviceSecret();
  const url = Deno.env.get('SUPABASE_URL') || '';
  if (!key || !url) return json({ error: 'Supabase service configuration is incomplete' }, 503);

  const schedulerSecret = (request.headers.get(SCHEDULER_HEADER) || '').trim();
  if (!await schedulerSecretMatches(schedulerSecret)) {
    return json({ error: 'Scheduler authorization required' }, 401);
  }

  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const queued = await admin.rpc('bible_enqueue_assignment_due_notifications_v6');
  if (queued.error) {
    console.error('assignment due reminder enqueue failed');
    return json({ error: 'Assignment reminder enqueue failed' }, 500);
  }

  const notificationIds = [...new Set((Array.isArray(queued.data) ? queued.data : [])
    .map((row: { notification_id?: unknown }) => String(row?.notification_id || '').trim())
    .filter((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))];
  let failed = 0;
  for (let offset = 0; offset < notificationIds.length; offset += BATCH_SIZE) {
    const batch = notificationIds.slice(offset, offset + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(async (notificationId) => {
      const result = await admin.functions.invoke('bq-push-delivery', { body: { notificationId } });
      if (result.error || result.data?.error || result.data?.ok !== true) throw new Error('Push dispatch failed');
    }));
    failed += results.filter(result => result.status === 'rejected').length;
  }

  if (failed) console.error('assignment due reminder push dispatch incomplete', { queued: notificationIds.length, failed });
  return json({ ok: failed === 0, queued: notificationIds.length, failed });
});
