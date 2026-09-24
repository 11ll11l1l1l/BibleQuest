import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const source = readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');

describe('live bootstrap account-resume cutover', () => {
  it('binds the legacy session store to the typed V6 account-resume runtime', () => {
    assert.match(source, /bindLegacyAccountResumeRuntime\(\s*store,\s*createProductAccountResumeOwners\(/);
    for (const key of ['general','bible-quest','weekly-journey','personal-challenges','explorer','leaderboard-delivery']) {
      assert.ok(source.includes(key + ':') || source.includes("'" + key + "':"), `missing account resume owner ${key}`);
    }
    assert.ok(source.includes('()=>router.navigate(router.current())'));
    assert.ok(source.includes('Account progress resume unavailable for ${owner}; using local progress'));
  });

  it('removes duplicate legacy orchestration and disposes the V6 runtime on pagehide', () => {
    assert.doesNotMatch(source, /accountProgressSyncOwners|syncAccountProgress|unsubscribeBibleQuestAccount|accountProgressSessionKey/);
    assert.match(source, /accountResumeRuntime\.dispose\(\)/);
  });
});
