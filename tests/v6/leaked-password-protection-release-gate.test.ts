import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertLeakedPasswordProtection,
  fetchAuthConfig,
} from '../../scripts/v6-auth-production-security.mjs';

test('production Auth gate requires leaked-password protection to be explicitly enabled', () => {
  assert.deepEqual(assertLeakedPasswordProtection({ password_hibp_enabled: true }), {
    passwordHibpEnabled: true,
  });

  for (const config of [
    { password_hibp_enabled: false },
    { password_hibp_enabled: null },
    {},
  ]) {
    assert.throws(
      () => assertLeakedPasswordProtection(config),
      /password_hibp_enabled|Leaked-password protection is not enabled/,
    );
  }
});

test('production Auth gate reads the hosted project config without mutating it', async () => {
  let request = null;
  const config = await fetchAuthConfig({
    projectRef: 'zkfmgezvzugchcwppreq',
    accessToken: 'test-management-token',
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return new Response(JSON.stringify({ password_hibp_enabled: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  assert.equal(config.password_hibp_enabled, true);
  assert.equal(request?.url, 'https://api.supabase.com/v1/projects/zkfmgezvzugchcwppreq/config/auth');
  assert.equal(request?.init?.method, 'GET');
  assert.equal(request?.init?.headers?.authorization, 'Bearer test-management-token');
});

test('production Auth gate fails closed on missing credentials and management API errors', async () => {
  await assert.rejects(
    () => fetchAuthConfig({ projectRef: 'zkfmgezvzugchcwppreq', accessToken: '' }),
    /SUPABASE_ACCESS_TOKEN/,
  );

  await assert.rejects(
    () =>
      fetchAuthConfig({
        projectRef: 'zkfmgezvzugchcwppreq',
        accessToken: 'test-management-token',
        fetchImpl: async () =>
          new Response(JSON.stringify({ secret: 'must-not-be-echoed' }), {
            status: 403,
            headers: { 'content-type': 'application/json' },
          }),
      }),
    error =>
      error instanceof Error &&
      /HTTP 403/.test(error.message) &&
      !error.message.includes('must-not-be-echoed'),
  );
});
