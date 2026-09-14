import { createClient } from 'npm:@supabase/supabase-js@2.112.4';
import webpush from 'npm:web-push@3.6.7';

type Db = ReturnType<typeof db>;
type PushCategory = 'assignment' | 'ministry' | 'recognition' | 'calendar' | 'media';

const MAX_SUBSCRIPTIONS_PER_USER = 20;

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

function db() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = serviceSecret();
  if (!url || !key) throw new Error('Supabase environment incomplete');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function requireAdmin(req: Request, adminDb: Db) {
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!jwt) throw response({ error: 'Authentication required' }, 401);

  const auth = await adminDb.auth.getUser(jwt);
  if (auth.error || !auth.data.user) throw response({ error: 'Authentication required' }, 401);

  const access = await adminDb
    .from('bible_app_access')
    .select('role,active')
    .eq('user_id', auth.data.user.id)
    .maybeSingle();
  if (access.error) throw access.error;
  if (!access.data?.active || !['owner', 'admin'].includes(String(access.data.role))) {
    throw response({ error: 'Admin access required' }, 403);
  }
  return auth.data.user.id;
}

function categoryFor(notificationType: string, actionKind: string): PushCategory {
  const type = notificationType.toLowerCase();
  const action = actionKind.toLowerCase();
  if (type.includes('assignment') || type === 'feedback' || action === 'assignment') return 'assignment';
  if (type.includes('award') || type.includes('recognition') || action === 'recognition') return 'recognition';
  if (type.includes('calendar') || type.includes('event') || action === 'calendar') return 'calendar';
  if (type.includes('media') || type.includes('recording') || action === 'media') return 'media';
  return 'ministry';
}

function routeFor(category: PushCategory) {
  if (category === 'assignment') return '/assignments';
  if (category === 'calendar') return '/calendar';
  if (category === 'media') return '/media';
  return '/notifications';
}

function vapid() {
  const subject = (Deno.env.get('VAPID_SUBJECT') || '').trim();
  const publicKey = (Deno.env.get('VAPID_PUBLIC_KEY') || '').trim();
  const privateKey = (Deno.env.get('VAPID_PRIVATE_KEY') || '').trim();
  if (!subject || !publicKey || !privateKey) throw new Error('Web Push environment incomplete');
  if (!/^mailto:|^https:\/\//i.test(subject)) throw new Error('VAPID_SUBJECT must be mailto: or https:');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return response({ error: 'POST required' }, 405);

  try {
    const adminDb = db();
    await requireAdmin(req, adminDb);

    const input = await req.json().catch(() => ({}));
    const notificationId = String(input?.notificationId || '').trim();
    if (!isUuid(notificationId)) return response({ error: 'Valid notificationId required' }, 400);

    const notificationResult = await adminDb
      .from('bible_notifications')
      .select('id,user_id,notification_type,title,body,action_kind')
      .eq('id', notificationId)
      .maybeSingle();
    if (notificationResult.error) throw notificationResult.error;
    if (!notificationResult.data) return response({ error: 'Notification not found' }, 404);

    const notification = notificationResult.data;
    const category = categoryFor(String(notification.notification_type || ''), String(notification.action_kind || ''));
    const subscriptions = await adminDb
      .from('bible_push_subscriptions')
      .select('id,user_id,endpoint,p256dh,auth,enabled_categories')
      .eq('user_id', notification.user_id)
      .contains('enabled_categories', [category])
      .limit(MAX_SUBSCRIPTIONS_PER_USER);
    if (subscriptions.error) throw subscriptions.error;

    const rows = subscriptions.data || [];
    if (!rows.length) return response({ ok: true, category, attempted: 0, delivered: 0, removed: 0, failed: 0 });

    vapid();
    const payload = JSON.stringify({
      title: String(notification.title || 'BibleQuest').slice(0, 120),
      body: String(notification.body || '').slice(0, 240),
      path: routeFor(category),
      notificationId: notification.id,
      category,
    });

    let delivered = 0;
    let removed = 0;
    let failed = 0;

    for (const subscription of rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 300 },
        );
        delivered += 1;
      } catch (error) {
        const statusCode = Number((error as { statusCode?: number })?.statusCode || 0);
        if (statusCode === 404 || statusCode === 410) {
          const cleanup = await adminDb
            .from('bible_push_subscriptions')
            .delete()
            .eq('id', subscription.id)
            .eq('user_id', notification.user_id);
          if (cleanup.error) {
            failed += 1;
            console.error('push cleanup failed', { statusCode });
          } else {
            removed += 1;
          }
        } else {
          failed += 1;
          console.error('push delivery failed', { statusCode: statusCode || 'unknown' });
        }
      }
    }

    return response({ ok: failed === 0, category, attempted: rows.length, delivered, removed, failed });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('push delivery request failed');
    return response({ error: 'Push delivery failed' }, 500);
  }
});
