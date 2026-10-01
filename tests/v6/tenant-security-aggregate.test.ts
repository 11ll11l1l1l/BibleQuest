import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read=(path:string)=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');

const repositoryInventory=read('tests/v6/explicit-tenant-api-contract.test.ts');
const inventoryStart=repositoryInventory.indexOf('const inventory = {');
const inventoryEnd=repositoryInventory.indexOf('} as const;',inventoryStart);
assert.notEqual(inventoryStart,-1,'Missing systemic sensitive repository inventory.');
assert.notEqual(inventoryEnd,-1,'Missing systemic sensitive repository inventory terminator.');
const inventoryBlock=repositoryInventory.slice(inventoryStart,inventoryEnd);
const inventoryOwners=[...inventoryBlock.matchAll(/^\s{4}([A-Za-z0-9_]+):\s*\[/gm)].map(match=>match[1]);

const evidence={
  congregation:{
    path:'tests/v6/congregation-settings.test.ts',
    tokens:[
      'members cannot edit settings and server endpoint rechecks role before service writes',
      'member administration rejects cross-congregation list and mutation responses',
    ],
  },
  presence:{
    path:'supabase/tests/v6-community-tenant-rls.test.sql',
    tokens:['Member A cannot create presence in congregation B'],
  },
  teamCenter:{
    path:'supabase/tests/v6-community-tenant-rls.test.sql',
    tokens:['Leader A cannot directly create a team in congregation B'],
  },
  scoreEvents:{
    path:'supabase/tests/v6-score-badge-tenant-rls.test.sql',
    tokens:['browser-authenticated callers cannot forge immutable score events'],
  },
  leaderboards:{
    path:'supabase/tests/v6-score-badge-tenant-rls.test.sql',
    tokens:[
      'leaderboard RPC remains authenticated-only and SECURITY INVOKER',
      'Member A cannot force-read congregation B leaderboard RPC',
      'Member B cannot force-read congregation A leaderboard RPC',
    ],
  },
  avatarVault:{
    path:'supabase/tests/v6-avatar-vault-tenant-rls.test.sql',
    tokens:['Member A cannot update a congregation B avatar'],
  },
  congregationRecognition:{
    path:'supabase/tests/v6-recognition-tenant-rls.test.sql',
    tokens:['Leader A cannot recognize a congregation B member inside congregation A'],
  },
  assignments:{
    path:'supabase/tests/v6-assignment-progress-tenant-rls.test.sql',
    tokens:['Member B cannot read congregation A assignment progress'],
  },
  ministryAnnouncements:{
    path:'supabase/tests/v6-calendar-ministry-tenant-writes.test.sql',
    tokens:['Leader A cannot publish ministry content in congregation B'],
  },
  journeyGroups:{
    path:'supabase/tests/v6-community-tenant-rls.test.sql',
    tokens:['Member A group helper allows own group and denies foreign group'],
  },
  liveRooms:{
    path:'supabase/tests/v6-live-room-tenant-rls.test.sql',
    tokens:['Member A cannot submit a response in congregation B'],
  },
  encouragements:{
    path:'supabase/tests/v6-encouragement-tenant-rls.test.sql',
    tokens:['Member A cannot send an encouragement into congregation B'],
  },
  contentDecisions:{
    path:'supabase/tests/v6-content-decision-tenant-rls.test.sql',
    tokens:['congregation-only Admin B cannot create a congregation A content decision'],
  },
  contentReports:{
    path:'supabase/tests/v6-content-report-authority.test.sql',
    tokens:['Member A cannot submit a report in congregation B'],
  },
  contentReview:{
    path:'supabase/tests/v6-content-decision-tenant-rls.test.sql',
    tokens:['congregation-only Admin B cannot read congregation A decision state'],
  },
  media:{
    path:'supabase/tests/v6-media-notification-tenant-rls.test.sql',
    tokens:['Leader A cannot curate media inside congregation B'],
  },
  calendar:{
    path:'supabase/tests/v6-calendar-ministry-tenant-writes.test.sql',
    tokens:['Leader A cannot create a congregation B event'],
  },
} as const;

const escapeRegex=(value:string)=>value.replace(/[.*+?^$()|[\]\\]/g,'\\$&');

test('every sensitive tenant repository owner is pinned to executable denial evidence',()=>{
  assert.deepEqual(
    [...inventoryOwners].sort(),
    Object.keys(evidence).sort(),
    'Sensitive repository inventory changed without corresponding aggregate tenant-security evidence.',
  );
  for(const [owner,entry] of Object.entries(evidence)){
    const source=read(entry.path);
    for(const token of entry.tokens){
      assert.match(source,new RegExp(escapeRegex(token)),
        `${owner} is missing required tenant/security evidence in ${entry.path}: ${token}`);
    }
  }
});

test('aggregate server-authority guard includes role, tenant and write-only telemetry boundaries',()=>{
  const authority=read('tests/v6/protected-feature-authority.test.ts');
  assert.match(authority,/delegate mutations instead of becoming backend authority/);
  assert.match(authority,/server-authority evidence/);
  assert.match(authority,/presentation-only/);

  const telemetry=read('supabase/tests/v6-telemetry.test.sql');
  assert.match(telemetry,/no direct telemetry table read or write privileges/);
  assert.match(telemetry,/bounded away from sensitive application domains/);

  const score=read('supabase/functions/bq-score/index.ts');
  assert.match(score,/activeMembership\(admin,congregationId,user\.id\)/);
  assert.match(score,/target_not_in_congregation/);
  assert.match(score,/delegated_scoring_not_allowed/);
});
