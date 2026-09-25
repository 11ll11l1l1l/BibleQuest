import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { createCalendarService } from '../../src/app/calendar.js';
import { createLeaderCenterService } from '../../src/app/leader-center.js';
import { en } from '../../src/content/locales/en.js';
import { tl } from '../../src/content/locales/tl.js';
import { ceb } from '../../src/content/locales/ceb.js';

const fixedNow = () => new Date('2026-09-25T00:00:00.000Z');

test('Calendar shared agenda never loads or exposes personal Calendar data', async () => {
  let personalCalls = 0;
  const session = {
    getState: () => ({ authenticated: true, user: { id: 'leader-a' } }),
  };
  const privateStorage = {
    read: () => null,
    write: () => undefined,
  };
  const active = {
    congregationId: 'church-a',
    role: 'leader',
    congregation: { name: 'Church A' },
  };
  const congregation = {
    async load() { return [active]; },
    getActive() { return active; },
    can(id: string, capability: string) {
      return id === 'church-a' && capability === 'ministry';
    },
  };
  const assignments = {
    snapshot: () => ({
      assignments: [{
        id: 'assignment-a',
        title: 'Read Romans 8',
        dueAt: '2026-09-27T12:00:00.000Z',
        dueState: 'assigned',
      }],
    }),
  };
  const api = {
    calendar: {
      async list() {
        personalCalls += 1;
        throw new Error('Personal Calendar must not be loaded by the shared leader agenda.');
      },
      async listCongregation(id: string) {
        assert.equal(id, 'church-a');
        return [{
          id: 'event-a',
          user_id: 'leader-a',
          event_date: '2026-09-28T09:00:00.000Z',
          title: 'Church service',
          notes: 'private author note must not leave Calendar owner',
          all_day: true,
          recurrence_weeks: 0,
        }];
      },
    },
  };

  const calendar = createCalendarService({
    session,
    privateStorage,
    api,
    assignments,
    congregation,
    clock: fixedNow,
  });
  const result = await calendar.loadSharedAgenda({ startDate: fixedNow(), days: 30 });

  assert.equal(personalCalls, 0);
  assert.equal(result.status, 'ready');
  assert.equal(result.congregationId, 'church-a');
  const items = result.agenda.flatMap((day: any) => day.events);
  assert.deepEqual(items.map((item: any) => item.source), ['assignment', 'congregation']);
  assert.deepEqual(items.map((item: any) => item.title), ['Due: Read Romans 8', 'Church service']);
  assert.doesNotMatch(JSON.stringify(result), /private author note|notes|ownerId/i);
});

function leaderAssignments(role = 'leader') {
  let current: any = {
    status: 'ready',
    userId: 'leader-a',
    role,
    congregationId: 'church-a',
    congregationName: 'Church A',
    assignments: [],
  };
  return {
    owner: {
      async load() { return current; },
      snapshot() { return current; },
      async loadLifecycle() { return []; },
      async loadPublishTargets() {
        return { ...current, publishTargets: { members: [], groups: [], teams: [] } };
      },
    },
    switchToChurchB() {
      current = { ...current, congregationId: 'church-b', congregationName: 'Church B' };
    },
  };
}

test('Leader Center publishes only assignment/congregation upcoming items and never trusts a personal row', async () => {
  const assignments = leaderAssignments('leader');
  const calendar = {
    async loadSharedAgenda() {
      return {
        status: 'ready',
        congregationId: 'church-a',
        agenda: [{
          date: '2026-09-27',
          events: [
            { id: 'a1', source: 'assignment', date: '2026-09-27', title: 'Due: Romans 8', notes: 'never' },
            { id: 'c1', source: 'congregation', date: '2026-09-27', title: 'Prayer meeting', notes: 'never' },
            { id: 'p1', source: 'personal', date: '2026-09-27', title: 'Private appointment', notes: 'never' },
          ],
        }],
      };
    },
  };
  const presence = { async activeCount() { return { count: 2 }; } };
  const state = await createLeaderCenterService({ assignments: assignments.owner, presence, calendar }).load();

  assert.equal(state.status, 'ready');
  assert.equal(state.upcoming.status, 'ready');
  assert.deepEqual(state.upcoming.items, [
    { id: 'a1', source: 'assignment', date: '2026-09-27', title: 'Due: Romans 8' },
    { id: 'c1', source: 'congregation', date: '2026-09-27', title: 'Prayer meeting' },
  ]);
  assert.doesNotMatch(JSON.stringify(state.upcoming), /Private appointment|notes|never/);
  assert.equal(state.contentReviewEntryVisible, true);
});

test('Leader Center fails closed when active congregation changes during upcoming load', async () => {
  const assignments = leaderAssignments('leader');
  const calendar = {
    async loadSharedAgenda() {
      assignments.switchToChurchB();
      return { status: 'ready', congregationId: 'church-a', agenda: [] };
    },
  };
  const presence = { async activeCount() { return { count: 0 }; } };
  const state = await createLeaderCenterService({ assignments: assignments.owner, presence, calendar }).load();
  assert.deepEqual(state, { status: 'unauthorized', authorized: false });
});

test('Content Review navigation entry matches the existing congregation review role boundary', async () => {
  const presence = { async activeCount() { return { count: 0 }; } };
  const calendar = { async loadSharedAgenda() { return { status: 'ready', congregationId: 'church-a', agenda: [] }; } };

  for (const role of ['leader', 'pastor', 'admin']) {
    const assignments = leaderAssignments(role);
    const state = await createLeaderCenterService({ assignments: assignments.owner, presence, calendar }).load();
    assert.equal(state.contentReviewEntryVisible, true, `${role} should receive the Content Review navigation entry`);
  }

  const facilitator = leaderAssignments('facilitator');
  const facilitatorState = await createLeaderCenterService({ assignments: facilitator.owner, presence, calendar }).load();
  assert.equal(facilitatorState.contentReviewEntryVisible, false);
});

test('bootstrap wires Calendar before Leader Center and navigation remains delegation-only', () => {
  const source = fs.readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  const calendarIndex = source.indexOf('const calendar=createCalendarService');
  const leaderIndex = source.indexOf('const leaderCenter=createLeaderCenterService');
  assert.ok(calendarIndex >= 0 && leaderIndex > calendarIndex);
  assert.match(source, /createLeaderCenterService\(\{assignments,presence,calendar\}\)/);
  assert.match(source, /onCalendar:\(\)=>router\.navigate\('calendar'\)/);
  assert.match(source, /onContentReview:\(\)=>router\.navigate\('content-review'\)/);
});

test('Leader Center upcoming and moderation copy is present in EN, TL and Cebuano', () => {
  const keys = [
    'leaderCenter.upcoming.eyebrow',
    'leaderCenter.upcoming.heading',
    'leaderCenter.upcoming.privacy',
    'leaderCenter.upcoming.unavailable',
    'leaderCenter.upcoming.empty',
    'leaderCenter.upcoming.assignment',
    'leaderCenter.upcoming.congregation',
    'leaderCenter.upcoming.openCalendar',
    'leaderCenter.moderation.eyebrow',
    'leaderCenter.moderation.heading',
    'leaderCenter.moderation.description',
    'leaderCenter.moderation.open',
  ];
  for (const key of keys) {
    assert.ok(en[key], `English is missing ${key}`);
    assert.ok(tl[key], `Tagalog is missing ${key}`);
    assert.ok(ceb[key], `Cebuano is missing ${key}`);
  }
});
