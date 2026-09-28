import { createClient } from 'npm:@supabase/supabase-js@2.112.4';

const BATCH_SIZE = 10;

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

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const key = serviceSecret();
  const url = Deno.env.get('SUPABASE_URL') || '';
  if (!key || !url) return json({ error: 'Supabase service configuration is incomplete' }, 503);

  const authorization = (request.headers.get('Authorization') || '').trim();
  const apiKey = (request.headers.get('apikey') || '').trim();
  if (authorization !== `Bearer ${key}` && apiKey !== key) return json({ error: 'Service authorization required' }, 401);

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
