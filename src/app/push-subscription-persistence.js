const clean = value => String(value ?? '').trim();

const persistenceError = (message, code) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

function requireAccount(session) {
  const state = session?.getState?.() || {};
  if (!state.authenticated || !state.user?.id) {
    throw persistenceError('Sign in before changing push delivery.', 'BQ_PUSH_AUTH_REQUIRED');
  }
  if (state.remoteAvailable === false) {
    throw persistenceError('Push delivery is unavailable in local preview.', 'BQ_PUSH_REMOTE_DISABLED');
  }
  return clean(state.user.id);
}

function normalizeSubscription(subscription) {
  const json = typeof subscription?.toJSON === 'function' ? subscription.toJSON() : subscription;
  const endpoint = clean(json?.endpoint);
  const p256dh = clean(json?.keys?.p256dh);
  const auth = clean(json?.keys?.auth);
  if (!endpoint || !p256dh || !auth) {
    throw persistenceError('Push subscription is incomplete.', 'BQ_PUSH_SUBSCRIPTION_INVALID');
  }
  return Object.freeze({ endpoint, p256dh, auth });
}

function verifyOwner(row, userId, endpoint) {
  if (!row || clean(row.user_id) !== userId || clean(row.endpoint) !== endpoint) {
    throw persistenceError('Push subscription response was outside the current account.', 'BQ_PUSH_SCOPE');
  }
  return row;
}

export function createPushSubscriptionPersistence({ api, session } = {}) {
  if (!api?.upsert || !api?.remove || !session) {
    throw new Error('Push subscription persistence requires shared API and session owners.');
  }

  async function save(subscription, categories = []) {
    const userId = requireAccount(session);
    const normalized = normalizeSubscription(subscription);
    const enabledCategories = [...new Set((Array.isArray(categories) ? categories : [])
      .map(value => clean(value).toLowerCase())
      .filter(Boolean))];
    const saved = await api.upsert({
      user_id: userId,
      endpoint: normalized.endpoint,
      p256dh: normalized.p256dh,
      auth: normalized.auth,
      categories: enabledCategories,
    });
    return verifyOwner(saved, userId, normalized.endpoint);
  }

  async function remove(subscriptionOrEndpoint) {
    const userId = requireAccount(session);
    const endpoint = clean(
      typeof subscriptionOrEndpoint === 'string'
        ? subscriptionOrEndpoint
        : subscriptionOrEndpoint?.endpoint || subscriptionOrEndpoint?.toJSON?.()?.endpoint,
    );
    if (!endpoint) throw persistenceError('Push endpoint is required for cleanup.', 'BQ_PUSH_ENDPOINT_REQUIRED');
    await api.remove(userId, endpoint);
    return Object.freeze({ userId, endpoint });
  }

  return Object.freeze({ save, remove });
}
