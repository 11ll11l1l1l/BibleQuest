import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const protectedPresentation = [
  ['src/features/admin-console/index.js', /admin\.|accountDeletion\./],
  ['src/features/admin-operations/index.js', /operations\./],
  ['src/features/assignments/index.js', /assignments\./],
  ['src/features/congregation/index.js', /membership\./],
  ['src/features/content-review/index.js', /review\./],
  ['src/features/journey-groups/index.js', /journeyGroups\./],
  ['src/features/leader-center/index.js', /leaderCenter\./],
  ['src/features/live-rooms/index.js', /liveRooms\./],
  ['src/features/ministry-announcements/index.js', /announcements\./],
  ['src/features/team-center/index.js', /teamCenter\./],
  ['src/features/recordings/index.js', /recordings\./],
] as const;

test('protected feature presentation modules delegate mutations instead of becoming backend authority', () => {
  for (const [path, ownerCall] of protectedPresentation) {
    const source = read(path);
    assert.match(source, ownerCall, `${path} must delegate protected work to its injected domain owner`);
    assert.doesNotMatch(source, /createClient\s*\(|supabase\s*\.|\.functions\.invoke\s*\(|\.rpc\s*\(/,
      `${path} must not bypass the domain/server authority boundary`);
  }
});

test('domain owners re-check identity, tenant or role before protected mutations', () => {
  const admin = read('src/app/admin-console.js');
  assert.match(admin, /ensureReady=.*PLATFORM_ROLES/);
  assert.match(admin, /mutate\('set_role'.*api\.setRole/);
  assert.match(admin, /mutate\('set_congregation_role'.*api\.setCongregationRole/);

  const assignments = read('src/app/assignments.js');
  assert.match(assignments, /MINISTRY_ROLES/);
  assert.match(assignments, /congregation\.assert/);
  assert.match(assignments, /api\.create\(cid,payload\)/);

  const contentReview = read('src/app/content-review.js');
  assert.match(contentReview, /REVIEW_ROLES=new Set\(\['leader','pastor','admin'\]\)/);
  assert.match(contentReview, /api\.platformAccess/);
  assert.match(contentReview, /api\.saveDecision/);

  const liveRooms = read('src/app/live-rooms.js');
  assert.match(liveRooms, /congregation\.assert\(id,'ministry'\)/);
  assert.match(liveRooms, /api\.create\(\{congregation_id:id/);
  assert.match(liveRooms, /api\.endRoom\(roomId,userId,tenantId\)/);

  const announcements = read('src/app/ministry-announcements.js');
  assert.match(announcements, /MINISTRY_ROLES/);
  assert.match(announcements, /congregation\.can\(congregationId,'ministry'\)/);
  assert.match(announcements, /api\.publish\(scope\.userId,scope\.congregationId/);

  const teams = read('src/app/team-center.js');
  assert.match(teams, /requireManage=/);
  assert.match(teams, /congregation\.assert\(.*'ministry'\)/);
  assert.match(teams, /api\.create\(id,title\)/);
  assert.match(teams, /api\.archive\(tenantId,team\.id\)/);

  const recordings = read('src/app/recordings.js');
  assert.match(recordings, /active\.userId!==sessionState\.user\.id/);
  assert.match(recordings, /!congregation\.can\(id,'ministry'\)/);
  assert.match(recordings, /media\.createVideo\(\{congregation_id:id/);
});

test('protected presentation checks remain backed by executable server-authority evidence', () => {
  const leaderMatrix = read('supabase/tests/v6-leader-center-role-matrix.test.sql');
  assert.match(leaderMatrix, /Facilitator|Leader|Pastor|Admin/i);
  assert.match(leaderMatrix, /foreign|cross-congregation|congregation B/i);

  const liveRoomRls = read('supabase/tests/v6-live-room-tenant-rls.test.sql');
  assert.match(liveRoomRls, /Leader A cannot join a congregation B Live Room/);
  assert.match(liveRoomRls, /Member A cannot submit a response in congregation B/);

  const calendarMinistryRls = read('supabase/tests/v6-calendar-ministry-tenant-writes.test.sql');
  assert.match(calendarMinistryRls, /ordinary Member A cannot publish ministry content/);
  assert.match(calendarMinistryRls, /Leader A cannot publish ministry content in congregation B/);

  const contentAuthority = read('supabase/tests/v6-content-report-authority.test.sql');
  assert.match(contentAuthority, /ordinary Member A cannot change report review state/);
  assert.match(contentAuthority, /congregation-only Admin B cannot review a congregation A report/);

  const assignmentRls = read('supabase/tests/v6-assignment-response-presence-tenant-rls.test.sql');
  assert.match(assignmentRls, /cannot read congregation B/);
  assert.match(assignmentRls, /cannot forge a congregation A presence row/);

  const adminBridge = read('tests/v6/admin-api-contract-bridge.test.ts');
  assert.match(adminBridge, /routes every typed mutation through it/);

  const teamEdge = read('tests/v3-team-center-edge.mjs');
  assert.match(teamEdge, /Ordinary member management must fail closed/);
  assert.match(teamEdge, /Creating a team outside the loaded active congregation must fail closed/);

  const recordingsTenant = read('tests/v6/recordings-tenant-create.test.ts');
  assert.match(recordingsTenant, /rejects stale or unauthorized scopes/);
});

test('feature visibility remains presentation-only: hiding or showing controls is never treated as authorization evidence', () => {
  const leader = read('src/features/leader-center/index.js');
  assert.match(leader, /\['leader','pastor','admin'\]\.includes\(state\.role\)/);
  const reviewOwner = read('src/app/content-review.js');
  assert.match(reviewOwner, /REVIEW_ROLES/);
  assert.match(reviewOwner, /api\.loadQueue/);
  assert.match(reviewOwner, /api\.saveDecision/);

  const team = read('src/features/team-center/index.js');
  assert.match(team, /team\.canManage/);
  const teamOwner = read('src/app/team-center.js');
  assert.match(teamOwner, /if\(!team\.canManage\)throw teamError/);

  const live = read('src/features/live-rooms/index.js');
  assert.match(live, /state\.isHost/);
  const liveOwner = read('src/app/live-rooms.js');
  assert.match(liveOwner, /room\.createdBy!==userId/);
  assert.match(liveOwner, /api\.endRoom/);
});
