import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PRODUCT_ACCOUNT_RESUME_KEYS,
  createProductAccountResumeOwners,
} from '../../src/v6/kernel/index.ts';

const service = () => ({
  syncNow: async () => undefined,
  switchToGuest: () => undefined,
});

describe('product account resume owners', () => {
  it('preserves the complete stable product owner order', () => {
    const owners = createProductAccountResumeOwners({
      general: service(),
      'bible-quest': service(),
      'weekly-journey': service(),
      'personal-challenges': service(),
      explorer: service(),
      'leaderboard-delivery': service(),
    });

    assert.deepEqual(owners.map(({ key }) => key), PRODUCT_ACCOUNT_RESUME_KEYS);
  });

  it('fails closed when a required product owner is absent', () => {
    const incomplete = {
      general: service(),
      'bible-quest': service(),
      'weekly-journey': service(),
      'personal-challenges': service(),
      explorer: service(),
    };

    assert.throws(
      () => createProductAccountResumeOwners(incomplete as never),
      /Missing account resume service: leaderboard-delivery/,
    );
  });

  it('keeps service methods bound to their original owner', async () => {
    const state = { calls: 0 };
    const bound = {
      ...service(),
      async syncNow() { this.calls += 1; },
      calls: 0,
    };
    const owners = createProductAccountResumeOwners({
      general: bound,
      'bible-quest': service(),
      'weekly-journey': service(),
      'personal-challenges': service(),
      explorer: service(),
      'leaderboard-delivery': service(),
    });

    await owners[0].syncNow();
    state.calls = bound.calls;
    assert.equal(state.calls, 1);
  });
});
