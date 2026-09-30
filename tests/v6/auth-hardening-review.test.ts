import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

test('privileged auth review is explicit about current enforcement gaps', () => {
  const review = read('docs/v6/V6_AUTH_HARDENING_REVIEW.md');
  const api = read('src/core/api.js');
  const adminOps = read('supabase/functions/bq-admin-ops/index.ts');

  assert.match(api, /@supabase\/supabase-js@2\.112\.4/);
  assert.match(adminOps, /auth\.getUser\(jwt\)/);
  assert.match(adminOps, /bible_app_access/);
  assert.doesNotMatch(api, /getAuthenticatorAssuranceLevel|auth\.reauthenticate|auth\.passkey/);
  assert.doesNotMatch(adminOps, /auth\.jwt\(\).*aal|\['aal'\]|\.aal\b|\bamr\b/);

  assert.match(review, /does \*\*not\*\* currently require or inspect a fresh-authentication timestamp, `aal2`, or an `amr`/);
  assert.match(review, /does not claim fresh-auth, MFA, or passkeys are deployed/i);
});

test('review covers the highest-impact existing Admin actions with server-side step-up requirements', () => {
  const review = read('docs/v6/V6_AUTH_HARDENING_REVIEW.md');
  const contracts = read('src/v6/admin/contracts.ts');

  for (const action of [
    'set_role',
    'set_congregation_role',
    'set_group_owner',
    'remove_congregation',
    'delete_user',
    'suspend_account',
    'force_sign_out',
    'set_temp_password',
    'change_email',
  ]) {
    assert.match(contracts, new RegExp("transportAction: '" + action + "'"));
    assert.match(review, new RegExp('`' + action + '`'));
  }

  assert.match(review, /server\/Edge Function must verify the assurance evidence/i);
  assert.match(review, /10-minute maximum age/i);
  assert.match(review, /must not assume that a front-end call alone proves generic Admin step-up/i);
});

test('MFA and passkey evaluation records rollout and recovery boundaries without claiming deployment', () => {
  const review = read('docs/v6/V6_AUTH_HARDENING_REVIEW.md');

  assert.match(review, /TOTP is the preferred first privileged-role MFA factor/i);
  assert.match(review, /not make passkeys mandatory in V6/i);
  assert.match(review, /passkey support as \*\*experimental\*\*/i);
  assert.match(review, /RP ID must remain stable/i);
  assert.match(review, /existing application recovery code is a password-reset mechanism/i);
  assert.match(review, /MFA factor and must not be treated as proof of AAL2/i);
  assert.match(review, /break-glass Owner recovery/i);
  assert.match(review, /does \*\*not\*\* mean reauthentication, MFA, AAL2 enforcement, passkeys/i);
});
