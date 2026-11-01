import {deny} from './policy.mjs';

// Server-only refresh. OAuth tokens are neither persisted in metadata nor returned by the API.
export function createDriveTokenOwner({clientId, clientSecret, refreshToken, fetchImpl = fetch}) {
  if (![clientId, clientSecret, refreshToken].every(value => typeof value === 'string' && value)) deny('MEDIA_PROVIDER_CONFIG');
  let cached = null;
  let pending = null;
  async function refresh() {
    let response;
    try {
      response = await fetchImpl('https://oauth2.googleapis.com/token', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token'}),
      });
    } catch { deny('MEDIA_PROVIDER_UNAVAILABLE'); }
    if (!response.ok) deny('MEDIA_PROVIDER_AUTH');
    const result = await response.json();
    if (typeof result.access_token !== 'string' || !Number.isFinite(result.expires_in) || result.expires_in <= 60) deny('MEDIA_PROVIDER_AUTH');
    cached = {token: result.access_token, expires: Date.now() + Math.min(result.expires_in - 60, 3500) * 1000};
    return cached.token;
  }
  return async () => {
    if (cached && cached.expires > Date.now()) return cached.token;
    if (!pending) pending = refresh().finally(() => { pending = null; });
    return pending;
  };
}
