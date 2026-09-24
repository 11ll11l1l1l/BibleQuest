import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { createLeaderCenterService } from '../../src/app/leader-center.js';

const read=(relative:string)=>fs.readFileSync(new URL('../../'+relative,import.meta.url),'utf8');

test('Recall content remains demand-loaded by manifest/book rather than eagerly bundled into the game engine', () => {
  const recall=read('src/core/recall-packs.js');
  const registry=read('src/v6/games/legacy-registry.ts');
  assert.match(recall,/const MANIFEST_PATH='data\/packs\/manifest\.json'/);
  assert.match(recall,/async function loadBook\(code\)/);
  assert.match(recall,/fetcher\(book\.path\)/);
  assert.match(recall,/data\/packs\/questions\/\$\{code\}\.json/);
  assert.match(registry,/lazyContent:\s*mode\.id === 'per-book-recall'/);
});

test('media curation, presence, groups/teams/rooms and notifications retain executable tenant boundaries', () => {
  const community=read('supabase/tests/v6-community-tenant-rls.test.sql');
  const rooms=read('supabase/tests/v6-live-room-tenant-rls.test.sql');
  const media=read('supabase/tests/v6-media-notification-tenant-rls.test.sql');

  assert.match(community,/Member A presence-count RPC fails closed for foreign congregation/);
  assert.match(community,/ordinary Member A cannot read raw per-member presence rows/);
  assert.match(community,/Member A reads only its joined journey group/);
  assert.match(community,/Member A reads only congregation A teams/);
  assert.match(community,/Leader A cannot directly create a team in congregation B/);
  assert.match(rooms,/Leader A reads only congregation A Live Room sessions/);
  assert.match(rooms,/Leader A cannot join a congregation B Live Room/);
  assert.match(rooms,/former congregation member cannot retain Live Room visibility/);

  assert.match(media,/ordinary Member A cannot curate media even in its own congregation/);
  assert.match(media,/Leader A can curate media inside congregation A/);
  assert.match(media,/Leader A cannot curate media inside congregation B/);
  assert.match(media,/media producer creates no cross-congregation notification rows/);
  assert.match(media,/Member A cannot read another account notification row/);
});

test('Leader Center suppresses a stale congregation result after active tenant changes', async () => {
  let current:any={
    status:'ready',userId:'leader-a',role:'leader',congregationId:'church-a',
    congregationName:'Church A',assignments:[{id:'a1',title:'A'}],
  };
  const assignments:any={
    async load(){return current;},
    snapshot(){return current;},
    async loadLifecycle(){
      current={...current,congregationId:'church-b',congregationName:'Church B',assignments:[]};
      return [{assignmentId:'a1',status:'published',recipientCount:1,completedCount:0}];
    },
    async loadPublishTargets(){throw new Error('must not reach stale directory');},
  };
  const presence={async activeCount(){throw new Error('must not read stale tenant presence');}};
  const state=await createLeaderCenterService({assignments,presence}).load();
  assert.deepEqual(state,{status:'unauthorized',authorized:false});
});

test('Leader Center exposes Journey Group and Team Center management entry points', () => {
  const page=read('src/features/leader-center/index.js');
  const bootstrap=read('src/app/bootstrap.js');
  assert.match(page,/data-leader-open-groups/);
  assert.match(page,/data-leader-open-teams/);
  assert.match(bootstrap,/onJourneyGroups:\(\)=>router\.navigate\('journey-groups'\)/);
  assert.match(bootstrap,/onTeamCenter:\(\)=>router\.navigate\('team-center'\)/);
});

test('Scripture source/licensing metadata is owned by Bible data, separate from UI localization', () => {
  const bible=read('src/core/bible.js');
  const localization=read('src/app/localization.js');
  assert.match(bible,/source:\s*'Berean Standard Bible'/);
  assert.match(bible,/license:\s*'CC BY-SA 4\.0'/);
  assert.match(bible,/attribution:/);
  assert.match(bible,/mode:\s*'licensed-link'/);
  assert.doesNotMatch(localization,/const TRANSLATIONS|externalVersion|licensed-link|Berean Standard Bible/);
});

test('release checklist never represents WAIVED as PASS', () => {
  const checklist=read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  for(const line of checklist.split(/\r?\n/)){
    if(/^- \[[xX]\]/.test(line)) assert.doesNotMatch(line,/\bWAIVED\b/i);
  }
  assert.match(checklist,/A waiver is not a PASS/);
});
