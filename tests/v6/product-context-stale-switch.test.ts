import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCongregationMembershipService } from '../../src/app/congregation-membership.js';
import { createAssignmentsService } from '../../src/app/assignments.js';
import { createCalendarService } from '../../src/app/calendar.js';
import { createJourneyGroupsService } from '../../src/app/journey-groups.js';
import { createEncouragementsService } from '../../src/app/encouragements.js';
import { createPresenceService } from '../../src/app/presence.js';
import { createLeaderCenterService } from '../../src/app/leader-center.js';
import { createCloudNotesService } from '../../src/app/cloud-notes.js';
import { createWorkspaceService } from '../../src/app/workspace.js';
import { createLeaderboardsService } from '../../src/app/leaderboards.js';
import { createCongregationRecognitionService } from '../../src/app/congregation-recognition.js';
import { createTeamCenterService } from '../../src/app/team-center.js';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function mutableSession(initial = 'user-a') {
  let userId = initial;
  return {
    getState() {
      return userId
        ? { authenticated: true, remoteAvailable: true, user: { id: userId } }
        : { authenticated: false, remoteAvailable: true, user: null };
    },
    setUser(next: string) { userId = next; },
  };
}

function membershipRow(userId: string, congregationId: string, role = 'member') {
  return {
    congregation_id: congregationId,
    user_id: userId,
    role,
    display_name: userId,
    active: true,
    joined_at: '2026-09-24T00:00:00.000Z',
    congregation: {
      id: congregationId,
      name: `Church ${congregationId}`,
      timezone: 'Asia/Tokyo',
      owner_id: 'owner',
    },
  };
}

function membershipApi(session: ReturnType<typeof mutableSession>) {
  return {
    congregation: {
      async listMemberships(userId: string) {
        const role = userId === 'user-a' ? 'leader' : 'member';
        return [membershipRow(userId, userId === 'user-a' ? 'cong-a' : 'cong-b', role)];
      },
      async join() { return {}; },
    },
  };
}

function assignmentRow(id: string, congregationId: string) {
  return {
    id,
    congregation_id: congregationId,
    created_by: 'leader',
    title: `Assignment ${id}`,
    instructions: '',
    assignment_type: 'reading',
    scripture_refs: [],
    target_scope: 'all',
    target_id: null,
    due_at: null,
    points: 5,
    active: true,
    created_at: '2026-09-24T00:00:00.000Z',
    updated_at: '2026-09-24T00:00:00.000Z',
  };
}

function memoryPrivateStorage() {
  const map = new Map<string, unknown>();
  return {
    read(key: string, fallback: unknown = null) {
      return map.has(key) ? structuredClone(map.get(key)) : structuredClone(fallback);
    },
    write(key: string, value: unknown) {
      map.set(key, structuredClone(value));
      return value;
    },
  };
}

describe('product account and tenant stale-response isolation', () => {
  it('membership capabilities disappear immediately on account switch and late A membership cannot replace B', async () => {
    const session = mutableSession();
    const first = createCongregationMembershipService({ api: membershipApi(session), session });
    await first.load();
    assert.equal(first.can('cong-a', 'ministry'), true);

    session.setUser('user-b');
    assert.deepEqual(first.list(), []);
    assert.equal(first.getActive(), null);
    assert.equal(first.can('cong-a', 'ministry'), false);
    await first.load();
    assert.equal(first.list()[0]?.congregationId, 'cong-b');
    assert.equal(first.can('cong-b', 'ministry'), false);

    const raceSession = mutableSession();
    const aStarted = deferred();
    const releaseA = deferred();
    const api = {
      congregation: {
        async listMemberships(userId: string) {
          if (userId === 'user-a') {
            aStarted.resolve();
            await releaseA.promise;
            return [membershipRow('user-a', 'cong-a', 'leader')];
          }
          return [membershipRow('user-b', 'cong-b', 'member')];
        },
        async join() { return {}; },
      },
    };
    const membership = createCongregationMembershipService({ api, session: raceSession });
    const stale = membership.load();
    await aStarted.promise;
    raceSession.setUser('user-b');
    await membership.load();
    releaseA.resolve();
    await stale;

    assert.deepEqual(membership.list().map((row: any) => row.congregationId), ['cong-b']);
    assert.equal(membership.can('cong-a', 'ministry'), false);
    assert.equal(membership.can('cong-b', 'read'), true);
  });

  it('Assignments keeps the newer account context when an older list finishes late', async () => {
    const session = mutableSession();
    const congregation = createCongregationMembershipService({ api: membershipApi(session), session });
    const aStarted = deferred();
    const releaseA = deferred();
    const api = {
      async load(congregationId: string, userId: string) {
        if (userId === 'user-a') {
          aStarted.resolve();
          await releaseA.promise;
          return { assignments: [assignmentRow('a-task', congregationId)], progress: [] };
        }
        return { assignments: [assignmentRow('b-task', congregationId)], progress: [] };
      },
      async start() { return {}; },
      async complete() { return {}; },
      async subscribe() { return () => undefined; },
    };
    const assignments = createAssignmentsService({ api, session, congregation });

    const stale = assignments.load();
    await aStarted.promise;
    session.setUser('user-b');
    const fresh = await assignments.load();
    assert.equal(fresh.userId, 'user-b');
    assert.equal(fresh.congregationId, 'cong-b');
    assert.deepEqual(fresh.assignments.map((row: any) => row.id), ['b-task']);

    releaseA.resolve();
    await stale;
    const final = assignments.snapshot();
    assert.equal(final.userId, 'user-b');
    assert.deepEqual(final.assignments.map((row: any) => row.id), ['b-task']);

    session.setUser('user-a');
    assert.deepEqual(assignments.snapshot().assignments, []);
    assert.throws(() => assignments.open('b-task'), (error: any) => error?.code === 'BQ_ASSIGNMENT_CONTEXT_STALE');
  });

  it('Calendar never exposes a late congregation-A response under account B', async () => {
    const session = mutableSession();
    const congregation = createCongregationMembershipService({ api: membershipApi(session), session });
    const aStarted = deferred();
    const releaseA = deferred();
    const calendarApi = {
      calendar: {
        async list() { return []; },
        async create(_userId: string, event: any) {
          return { id: event.id, user_id: session.getState().user?.id, title: event.title, notes: event.notes, event_date: event.date, all_day: event.allDay };
        },
        async remove() { return true; },
        async listCongregation(congregationId: string) {
          if (congregationId === 'cong-a') {
            aStarted.resolve();
            await releaseA.promise;
            return [{ id: 'event-a', congregation_id: 'cong-a', user_id: 'user-a', title: 'A only', notes: '', event_date: '2026-09-25', all_day: true, recurrence_weeks: 0 }];
          }
          return [{ id: 'event-b', congregation_id: 'cong-b', user_id: 'user-b', title: 'B only', notes: '', event_date: '2026-09-26', all_day: true, recurrence_weeks: 0 }];
        },
      },
    };
    const calendar = createCalendarService({
      session,
      privateStorage: memoryPrivateStorage(),
      api: calendarApi,
      assignments: { snapshot: () => ({ assignments: [] }) },
      congregation,
      clock: () => new Date('2026-09-24T00:00:00.000Z'),
    });

    const stale = calendar.load();
    await aStarted.promise;
    session.setUser('user-b');
    const fresh = await calendar.load();
    assert.equal(fresh.congregationId, 'cong-b');
    assert.ok(fresh.agenda.flatMap((day: any) => day.events).some((event: any) => event.id === 'event-b'));

    releaseA.resolve();
    await stale;
    const final = calendar.getState();
    assert.equal(final.congregationId, 'cong-b');
    assert.equal(final.agenda.flatMap((day: any) => day.events).some((event: any) => event.id === 'event-a'), false);

    session.setUser('user-a');
    assert.equal(calendar.getState().congregationId, '');
    assert.equal(calendar.getState().canShareWithCongregation, false);
  });

  it('Journey Groups and Encouragements keep late Account A results out of Account B community state', async () => {
    const session = mutableSession();
    const congregation = createCongregationMembershipService({ api: membershipApi(session), session });
    const groupAStarted = deferred();
    const releaseGroupA = deferred();
    const groupApi = {
      async list(userId: string) {
        if (userId === 'user-a') {
          groupAStarted.resolve();
          await releaseGroupA.promise;
        }
        const groupId = userId === 'user-a' ? 'group-a' : 'group-b';
        const congregationId = userId === 'user-a' ? 'cong-a' : 'cong-b';
        return {
          groups: [{ id: groupId, owner_id: userId, congregation_id: congregationId, name: groupId, description: '', schedule_text: '', max_members: 6, active: true }],
          members: [{ group_id: groupId, user_id: userId, role: 'leader', joined_at: '2026-09-24T00:00:00.000Z' }],
        };
      },
      async create() { return {}; },
      async join() { return {}; },
      async rotateCode() { return { invite_code: 'ABCDEFGH' }; },
      async leave() { return {}; },
    };
    const journeyGroups = createJourneyGroupsService({ api: groupApi, session, congregation });

    const staleGroup = journeyGroups.load();
    await groupAStarted.promise;
    session.setUser('user-b');
    const freshGroup = await journeyGroups.load();
    assert.deepEqual(freshGroup.groups.map((row: any) => row.id), ['group-b']);
    releaseGroupA.resolve();
    await staleGroup;
    assert.deepEqual(journeyGroups.snapshot().groups.map((row: any) => row.id), ['group-b']);

    session.setUser('user-a');
    assert.deepEqual(journeyGroups.snapshot().groups, []);
    session.setUser('user-b');

    const encouragementAStarted = deferred();
    const releaseEncouragementA = deferred();
    const fakeJourneyGroups = {
      async load() {
        const userId = session.getState().user?.id || '';
        const groupId = userId === 'user-a' ? 'group-a' : 'group-b';
        return {
          groups: [{
            id: groupId,
            members: [{ userId, role: 'leader' }],
          }],
        };
      },
    };
    const encouragementApi = {
      async list(groupIds: string[]) {
        if (groupIds.includes('group-a')) {
          encouragementAStarted.resolve();
          await releaseEncouragementA.promise;
          return [{ id: 'enc-a', group_id: 'group-a', sender_id: 'user-a', recipient_id: null, kind: 'cheer', created_at: '2026-09-24T01:00:00.000Z' }];
        }
        return [{ id: 'enc-b', group_id: 'group-b', sender_id: 'user-b', recipient_id: null, kind: 'cheer', created_at: '2026-09-24T02:00:00.000Z' }];
      },
      async send() { return {}; },
    };
    const encouragements = createEncouragementsService({ api: encouragementApi, session, journeyGroups: fakeJourneyGroups });

    session.setUser('user-a');
    const staleEncouragement = encouragements.load();
    await encouragementAStarted.promise;
    session.setUser('user-b');
    const freshEncouragement = await encouragements.load();
    assert.deepEqual(freshEncouragement.items.map((row: any) => row.id), ['enc-b']);
    releaseEncouragementA.resolve();
    await staleEncouragement;
    assert.deepEqual(encouragements.snapshot().items.map((row: any) => row.id), ['enc-b']);

    session.setUser('user-a');
    assert.deepEqual(encouragements.snapshot().items, []);
  });
  it('Presence and Leader Center suppress a congregation-A aggregate that resolves after account switch', async () => {
    const session = mutableSession();
    let active = { congregationId: 'cong-a', userId: 'user-a' };
    const countStarted = deferred();
    const releaseCount = deferred();
    const congregation = {
      async load() { return [active]; },
      getActive() { return active; },
      can(id: string, capability: string) {
        return capability === 'read' && id === active.congregationId && active.userId === session.getState().user?.id;
      },
    };
    const store = {
      setState() { return {}; },
      subscribe() { return () => undefined; },
    };
    const presence = createPresenceService({
      api: {
        async touch() { return {}; },
        async list() { return []; },
        async leave() { return {}; },
        async activeCount() {
          countStarted.resolve();
          await releaseCount.promise;
          return 7;
        },
      },
      session,
      congregation,
      store,
      setIntervalFn: () => 1,
      clearIntervalFn: () => undefined,
    });

    const staleCount = presence.activeCount('cong-a', 30);
    await countStarted.promise;
    session.setUser('user-b');
    active = { congregationId: 'cong-b', userId: 'user-b' };
    releaseCount.resolve();
    assert.equal(await staleCount, null);

    session.setUser('user-a');
    active = { congregationId: 'cong-a', userId: 'user-a' };
    let assignmentSnapshot: any = {
      status: 'ready',
      userId: 'user-a',
      role: 'leader',
      congregationId: 'cong-a',
      congregationName: 'Church A',
      assignments: [],
    };
    const leaderCountStarted = deferred();
    const releaseLeaderCount = deferred();
    const assignments = {
      async load() { return assignmentSnapshot; },
      snapshot() { return assignmentSnapshot; },
      async loadLifecycle() { return []; },
      async loadPublishTargets() { return { ...assignmentSnapshot, publishTargets: { members: [], groups: [], teams: [] } }; },
    };
    const leaderCenter = createLeaderCenterService({
      assignments,
      presence: {
        async activeCount() {
          leaderCountStarted.resolve();
          await releaseLeaderCount.promise;
          return { count: 4, windowMinutes: 30 };
        },
      },
    });

    const staleLeader = leaderCenter.load();
    await leaderCountStarted.promise;
    assignmentSnapshot = {
      status: 'ready',
      userId: 'user-b',
      role: 'member',
      congregationId: 'cong-b',
      congregationName: 'Church B',
      assignments: [],
    };
    releaseLeaderCount.resolve();
    const result = await staleLeader;
    assert.equal(result.authorized, false);
    assert.equal(result.status, 'unauthorized');
    assert.equal((result as any).congregationId, undefined);
  });


  it('Cloud Notes and Workspace keep Account A private notes out of Account B after a late response', async () => {
    const session = mutableSession();
    const aStarted = deferred();
    const releaseA = deferred();
    const noteRow = (userId: string) => ({
      id: `note-${userId}`,
      user_id: userId,
      book: 'JHN',
      chapter: 3,
      verse_start: 16,
      verse_end: null,
      title: `Title ${userId}`,
      content: `Private ${userId}`,
      tags: [],
      note_type: 'study',
      is_pinned: false,
      created_at: '2026-09-24T00:00:00.000Z',
      updated_at: '2026-09-24T00:00:00.000Z',
    });
    const noteApi = {
      async list(userId: string) {
        if (userId === 'user-a') {
          aStarted.resolve();
          await releaseA.promise;
        }
        return [noteRow(userId)];
      },
      async create() { throw new Error('unused'); },
      async update() { throw new Error('unused'); },
      async remove() { throw new Error('unused'); },
    };
    const cloudNotes = createCloudNotesService({ api: noteApi, session });
    const stale = cloudNotes.load();
    await aStarted.promise;
    session.setUser('user-b');
    await cloudNotes.load();
    releaseA.resolve();
    await stale;
    assert.deepEqual(cloudNotes.list().map((row: any) => row.userId), ['user-b']);

    session.setUser('user-a');
    assert.deepEqual(cloudNotes.list(), []);
    session.setUser('user-b');

    const congregation = createCongregationMembershipService({ api: membershipApi(session), session });
    const reader = { getState: () => ({ translation: 'bsb', book: 'JHN', chapter: 1 }), setBook() {} };
    const storage = { read: (_key: string, fallback: unknown) => fallback, write: (_key: string, value: unknown) => value };
    const workspace = createWorkspaceService({ session, cloudNotes, congregation, reader, storage });
    const ready = await workspace.load();
    assert.equal(ready.status, 'ready');
    assert.deepEqual(ready.notes.map((row: any) => row.id), ['note-user-b']);

    session.setUser('user-a');
    assert.deepEqual(workspace.snapshot().notes, []);
    assert.deepEqual(workspace.search('Private'), []);
  });

  it('Leaderboard and Recognition read models cannot commit Account A congregation data after B becomes current', async () => {
    const session = mutableSession();
    const congregation = createCongregationMembershipService({ api: membershipApi(session), session });

    const boardStarted = deferred();
    const releaseBoard = deferred();
    const boardApi = {
      async load(congregationId: string) {
        if (congregationId === 'cong-a') {
          boardStarted.resolve();
          await releaseBoard.promise;
        }
        const userId = congregationId === 'cong-a' ? 'user-a' : 'user-b';
        return {
          directory: [{ congregation_id: congregationId, user_id: userId, display_name: userId, active: true }],
          scores: [{ user_id: userId, category: 'reading', points: congregationId === 'cong-a' ? 99 : 3 }],
        };
      },
    };
    const board = createLeaderboardsService({ api: boardApi, session, congregation, clock: () => new Date('2026-09-24T00:00:00.000Z') });
    const staleBoard = board.load();
    await boardStarted.promise;
    session.setUser('user-b');
    const freshBoard = await board.load();
    assert.equal(freshBoard.congregationId, 'cong-b');
    assert.deepEqual(freshBoard.rows.map((row: any) => row.userId), ['user-b']);
    releaseBoard.resolve();
    await staleBoard;
    assert.deepEqual(board.snapshot().rows.map((row: any) => row.userId), ['user-b']);

    const recognitionStarted = deferred();
    const releaseRecognition = deferred();
    const recognitionApi = {
      async load(congregationId: string) {
        if (congregationId === 'cong-a') {
          recognitionStarted.resolve();
          await releaseRecognition.promise;
        }
        const userId = congregationId === 'cong-a' ? 'user-a' : 'user-b';
        return {
          directory: [{ congregation_id: congregationId, user_id: userId, display_name: userId, role: congregationId === 'cong-a' ? 'leader' : 'member', active: true, joined_at: '2026-09-24T00:00:00.000Z' }],
          catalog: [],
          badges: [],
          recognitions: [],
        };
      },
      async award() { throw new Error('unused'); },
    };
    session.setUser('user-a');
    const recognition = createCongregationRecognitionService({ api: recognitionApi, session, congregation });
    const staleRecognition = recognition.load();
    await recognitionStarted.promise;
    session.setUser('user-b');
    const freshRecognition = await recognition.load();
    assert.equal(freshRecognition.congregationId, 'cong-b');
    assert.deepEqual(freshRecognition.members.map((row: any) => row.userId), ['user-b']);
    releaseRecognition.resolve();
    await staleRecognition;
    assert.deepEqual(recognition.snapshot().members.map((row: any) => row.userId), ['user-b']);

    session.setUser('user-a');
    assert.deepEqual(recognition.snapshot().members, []);
    assert.deepEqual(board.snapshot().rows, []);
  });

  it('Team Center keeps the newer account team and directory after a stale A list resolves', async () => {
    const session = mutableSession();
    const congregation = createCongregationMembershipService({ api: membershipApi(session), session });
    const aStarted = deferred();
    const releaseA = deferred();
    const api = {
      async list(ids: string[]) {
        const congregationId = ids[0];
        if (congregationId === 'cong-a') {
          aStarted.resolve();
          await releaseA.promise;
        }
        const userId = congregationId === 'cong-a' ? 'user-a' : 'user-b';
        const teamId = congregationId === 'cong-a' ? 'team-a' : 'team-b';
        return {
          teams: [{ id: teamId, congregation_id: congregationId, created_by: userId, team_type: 'game_team', name: teamId, active: true, created_at: '2026-09-24T00:00:00.000Z' }],
          members: [{ team_id: teamId, user_id: userId, joined_at: '2026-09-24T00:00:00.000Z' }],
          directory: [{ congregation_id: congregationId, user_id: userId, display_name: userId, role: congregationId === 'cong-a' ? 'leader' : 'member', active: true, joined_at: '2026-09-24T00:00:00.000Z' }],
        };
      },
      async create() { return {}; },
      async add() { return {}; },
      async remove() { return {}; },
      async rename() { return {}; },
      async archive() { return {}; },
    };
    const teamCenter = createTeamCenterService({ api, session, congregation });
    const stale = teamCenter.load();
    await aStarted.promise;
    session.setUser('user-b');
    const fresh = await teamCenter.load();
    assert.deepEqual(fresh.teams.map((row: any) => row.id), ['team-b']);
    releaseA.resolve();
    await stale;
    assert.deepEqual(teamCenter.snapshot().teams.map((row: any) => row.id), ['team-b']);

    session.setUser('user-a');
    assert.deepEqual(teamCenter.snapshot().teams, []);
  });


});
