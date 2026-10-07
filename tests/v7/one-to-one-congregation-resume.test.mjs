import test from 'node:test';
import assert from 'node:assert/strict';
import { createCongregationMembershipService } from '../../src/app/congregation-membership.js';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

function row(id, userId = USER) {
  return {
    congregation_id: id,
    user_id: userId,
    role: 'member',
    display_name: 'Lane C',
    active: true,
    joined_at: '2026-10-07T00:00:00Z',
    congregation: { id, name: id, timezone: 'Asia/Tokyo', owner_id: OTHER, active: true },
  };
}

function privateStore() {
  const values = new Map();
  return {
    values,
    read(key, fallback = null) { return values.has(key) ? values.get(key) : fallback; },
    write(key, value) { values.set(key, value); return value; },
    remove(key) { values.delete(key); },
  };
}

test('active congregation survives reload only after fresh membership validation', async () => {
  let memberships = [row('church-a'), row('church-b')];
  const state = { authenticated: true, user: { id: USER } };
  const session = { getState: () => state };
  const api = { congregation: { async listMemberships(userId) {
    assert.equal(userId, state.user.id);
    return memberships;
  } } };
  const selectionStorage = privateStore();

  const first = createCongregationMembershipService({ api, session, selectionStorage });
  await first.load();
  assert.equal(first.getActive(), null);
  first.setActive('church-b');
  assert.equal(first.getActive()?.congregationId, 'church-b');

  const afterReload = createCongregationMembershipService({ api, session, selectionStorage });
  await afterReload.load();
  assert.equal(afterReload.getActive()?.congregationId, 'church-b');

  memberships = [row('church-a')];
  const revoked = createCongregationMembershipService({ api, session, selectionStorage });
  await revoked.load();
  assert.equal(revoked.getActive(), null);
  assert.equal(selectionStorage.values.has(`active-congregation.${USER}`), false);
});

test('remembered congregation is scoped to the authenticated user', async () => {
  const selectionStorage = privateStore();
  selectionStorage.write(`active-congregation.${USER}`, 'church-a');
  const state = { authenticated: true, user: { id: OTHER } };
  const api = { congregation: { async listMemberships() { return [row('church-a', OTHER)]; } } };
  const service = createCongregationMembershipService({
    api,
    session: { getState: () => state },
    selectionStorage,
  });
  await service.load();
  assert.equal(service.getActive(), null);
});
