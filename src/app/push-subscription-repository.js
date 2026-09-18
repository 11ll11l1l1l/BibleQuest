const TABLE = 'bible_push_subscriptions';
const FIELDS = 'id,user_id,endpoint,p256dh,auth,enabled_categories,created_at,updated_at';

function cleanEndpoint(value) {
  const endpoint = String(value || '').trim();
  if (!endpoint || endpoint.length > 4096) throw new Error('Push subscription endpoint is invalid.');
  return endpoint;
}

function cleanUserId(value) {
  const userId = String(value || '').trim();
  if (!userId) throw new Error('Push subscription account is required.');
  return userId;
}

export function createPushSubscriptionRepository({ from } = {}) {
  if (typeof from !== 'function') throw new Error('Push subscription repository requires a table client.');

  return Object.freeze({
    async upsert(row) {
      const userId = cleanUserId(row?.user_id);
      const endpoint = cleanEndpoint(row?.endpoint);
      const payload = {
        user_id: userId,
        endpoint,
        p256dh: String(row?.p256dh || '').trim(),
        auth: String(row?.auth || '').trim(),
        enabled_categories: Array.isArray(row?.enabled_categories) ? [...row.enabled_categories] : []
      };
      if (!payload.p256dh || !payload.auth) throw new Error('Push subscription key material is incomplete.');

      // Endpoint ownership is globally unique in the schema. RLS prevents a signed-in
      // account from reading/updating another account's endpoint, so an account switch
      // must remove the old endpoint before this write can succeed.
      const { data, error } = await from(TABLE)
        .upsert(payload, { onConflict: 'endpoint' })
        .select(FIELDS)
        .single();
      if (error) throw error;
      if (!data || String(data.user_id) !== userId || String(data.endpoint) !== endpoint) {
        throw new Error('Push subscription persistence returned an unexpected owner.');
      }
      return data;
    },

    async removeByEndpoint(endpointValue) {
      const endpoint = cleanEndpoint(endpointValue);
      const { error } = await from(TABLE).delete().eq('endpoint', endpoint);
      if (error) throw error;
      return true;
    }
  });
}
