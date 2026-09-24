import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  LEGACY_GAME_CHARACTERIZATION,
  legacyGameRegistry,
  startLegacyPassAndPlaySession,
  startLegacySoloSession,
  questionView,
  scoreboardView,
  LEGACY_MULTIPLE_CHOICE_SCORE_POLICY,
  answerMultipleChoice,
  advanceMultipleChoice,
  gameResult,
  startTurnRotation,
  awardCurrentPlayer,
} from '../../src/v6/games/index.ts';
import { createLeaderCenterService } from '../../src/app/leader-center.js';
import { createSessionTenantCoordinator } from '../../src/v6/kernel/session-tenant-coordinator.ts';
import { createTenantContextStore } from '../../src/v6/kernel/tenant-context.ts';

const read=(relative:string)=>fs.readFileSync(new URL('../../'+relative,import.meta.url),'utf8');

test('merged Games architecture satisfies the engine-level acceptance tranche', () => {
  const inventoryIds=LEGACY_GAME_CHARACTERIZATION.map(game=>game.id);
  const registryIds=legacyGameRegistry.list().map(game=>game.id);
  assert.deepEqual(inventoryIds,registryIds);
  assert.equal(new Set(inventoryIds).size,inventoryIds.length);

  const solo=startLegacySoloSession('quick-recall','cert-solo');
  const together=startLegacyPassAndPlaySession('cert-together',2);
  assert.deepEqual(
    solo.session.questions.map(question=>question.id),
    startLegacySoloSession('quick-recall','cert-replay').session.questions.map(question=>question.id),
  );
  assert.equal(together.turns.players.length,2);

  const first=answerMultipleChoice(solo.session,1,LEGACY_MULTIPLE_CHOICE_SCORE_POLICY);
  const duplicate=answerMultipleChoice(first.state,1,LEGACY_MULTIPLE_CHOICE_SCORE_POLICY);
  assert.equal(duplicate.applied,false);
  assert.equal(duplicate.duplicate,true);
  const result=gameResult(advanceMultipleChoice(first.state).state);
  assert.equal(result.sessionId,'cert-solo');

  const question=questionView(solo.session);
  assert.match(question.choices[0].accessibleLabel,/^Answer [A-Z]: /);
  assert.doesNotMatch(question.choices[0].accessibleLabel,/[⭐🏆🎮🪙]/u);

  let turns=startTurnRotation([{id:'a',name:'A'},{id:'b',name:'B'}]);
  turns=awardCurrentPlayer(turns,1);
  const board=scoreboardView(turns);
  assert.equal(board[0].score,1);
  assert.match(board[0].accessibleLabel,/A: 1 point/);

  const scoring=read('src/v6/games/scoring.ts');
  const session=read('src/v6/games/session.ts');
  const presentation=read('src/v6/games/presentation.ts');
  assert.match(scoring,/GameScorePolicy/);
  assert.doesNotMatch(session,/document\.|querySelector|HTMLElement/);
  assert.doesNotMatch(presentation,/document\.|querySelector|HTMLElement/);
});

test('push delivery acceptance uses server-only secrets, safe cleanup, idempotency and canonical categories', () => {
  const sender=read('supabase/functions/bq-push-delivery/index.ts');
  const cleanup=read('supabase/tests/v6-push-invalid-cleanup.test.sql');
  const retry=read('supabase/tests/v6-push-retry-rate-control.test.sql');
  const producers=read('supabase/tests/v6-notification-producer-categories.test.sql');

  assert.match(sender,/Deno\.env\.get\('SUPABASE_SERVICE_ROLE_KEY'\)/);
  assert.match(sender,/Deno\.env\.get\('VAPID_PRIVATE_KEY'\)/);
  assert.match(sender,/vault\.decrypted_secrets/);
  assert.match(sender,/bible_retire_push_subscription/);
  assert.match(sender,/bible_claim_push_delivery_v6_rate_limited/);
  assert.match(sender,/bible_record_push_retry_failure/);
  assert.match(sender,/bible_clear_push_retry_state/);
  assert.match(sender,/announcements/);
  assert.match(sender,/encouragement/);

  assert.match(cleanup,/stale failed-send key material cannot delete a refreshed subscription/);
  assert.match(cleanup,/exact permanently invalid subscription material is retired/);
  assert.match(retry,/immediate retry claim is rate-limited/);
  assert.match(retry,/cross-account pair cannot create retry throttle state/);
  assert.match(producers,/announcement producer emits canonical announcements category/);
  assert.match(producers,/ministry encouragement producer emits canonical encouragement category/);

  const notificationCenter=read('src/app/notification-center.js');
  const api=read('src/core/api.js');
  assert.match(notificationCenter,/api\.list/);
  assert.match(notificationCenter,/api\.setReadState/);
  assert.match(api,/bible_notifications/);
});

test('Leader Center remains explicit, role-gated, congregation-scoped and privacy-minimized', async () => {
  const state={
    status:'ready',
    userId:'leader-a',
    role:'leader',
    congregationId:'church-a',
    congregationName:'Church A',
    assignments:[{id:'a1',title:'Read John'}],
  };
  const assignments={
    async load(){return state;},
    snapshot(){return state;},
    async loadLifecycle(){return [{assignmentId:'a1',status:'published',recipientCount:2,completedCount:1}];},
    async loadPublishTargets(){return {
      publishTargets:{
        members:[{id:'m1',label:'Member One',role:'member',privateNote:'never expose'}],
        groups:[{id:'g1',label:'Group One',secret:'never expose'}],
        teams:[{id:'t1',label:'Team One',type:'study',private:'never expose'}],
      },
    };},
    open(){},
    async loadReview(id:string){return {activeId:id,activeReview:{status:'ready'}};},
  };
  const presence={async activeCount(){return {count:3,windowMinutes:30};}};
  const service=createLeaderCenterService({assignments,presence});
  const loaded=await service.load();
  assert.equal(loaded.authorized,true);
  assert.equal(loaded.congregationId,'church-a');
  assert.equal(loaded.activeInLast30Min,3);
  assert.equal(loaded.assignments.published.length,1);
  assert.equal(JSON.stringify(loaded.people).includes('privateNote'),false);
  assert.equal(JSON.stringify(loaded.groups).includes('secret'),false);
  assert.equal(JSON.stringify(loaded.teams).includes('private'),false);
  assert.equal((await service.openReview('a1')).activeReview.status,'ready');

  const denied=createLeaderCenterService({
    assignments:{...assignments,async load(){return {...state,role:'member'};},snapshot(){return {...state,role:'member'};}},
    presence,
  });
  assert.equal((await denied.load()).authorized,false);

  const bootstrap=read('src/app/bootstrap.js');
  assert.match(bootstrap,/'leader-center':\(\)=>leaderCenterPage/);
});

test('multi-congregation switching is explicit and invalidates stale tenant authority', () => {
  const tenant=createTenantContextStore();
  const coordinator=createSessionTenantCoordinator(tenant);
  const memberships=[
    {userId:'user-a',congregationId:'church-a',role:'member'},
    {userId:'user-a',congregationId:'church-b',role:'leader'},
  ];
  coordinator.applySession({status:'authenticated',identity:{userId:'user-a'},memberships,preferredCongregationId:'church-a'});
  const oldScope=tenant.scope();
  coordinator.applySession({status:'authenticated',identity:{userId:'user-a'},memberships,preferredCongregationId:'church-b'});
  assert.throws(()=>tenant.assertCurrent(oldScope),/active congregation changed/);

  const membership=read('src/app/congregation-membership.js');
  const page=read('src/features/congregation/index.js');
  assert.match(membership,/function setActive\(congregationId\)/);
  assert.match(membership,/api\.congregation\.join/);
  assert.match(page,/data-congregation-switch/);
  assert.match(page,/data-congregation-join/);
});

test('integrated telemetry and diagnostics stay privacy-safe and source maps stay controlled', () => {
  const telemetry=read('src/app/telemetry.js');
  const telemetryTest=read('tests/v6/telemetry.test.ts');
  const diagnostics=read('src/core/client-diagnostics.js');
  const diagnosticsTest=read('tests/v3-client-diagnostics-edge.mjs');
  const vite=read('vite.config.mjs');
  const buildEvidence=read('scripts/v6-build-evidence.mjs');

  assert.match(telemetry,/PROPERTY_KEYS=new Set/);
  assert.doesNotMatch(telemetry,/['"](?:email|token|password|note|reflection|scripture_text)['"]/);
  assert.match(telemetry,/client_error/);
  assert.match(telemetry,/error_name/);
  assert.match(telemetryTest,/drops arbitrary user-authored properties before transport/);

  assert.match(diagnostics,/CLIENT_DIAGNOSTIC_CODES/);
  assert.match(diagnosticsTest,/exclude arbitrary error data/);

  assert.match(vite,/sourcemap:\s*'hidden'/);
  assert.match(vite,/privateSourceMapDir/);
  assert.match(buildEvidence,/publicSourceMapFiles/);
  assert.match(buildEvidence,/sourcesEmbedded/);
});

test('Vite owns compatibility CSS/assets/images and inherited language/Japanese seams remain present', () => {
  const vite=read('vite.config.mjs');
  assert.match(vite,/publicDir:\s*false/);
  assert.match(vite,/compatibilityDirectories = new Set\(\['assets', 'data', 'kids-games'\]\)/);
  assert.match(vite,/cpSync\(source, target, \{ recursive: true, force: true \}\)/);
  assert.match(vite,/\.css/);
  assert.match(vite,/\.png/);
  assert.match(vite,/\.svg/);

  const localization=read('src/app/localization.js');
  const furigana=read('src/app/japanese-furigana.js');
  assert.match(localization,/tl/);
  assert.match(localization,/ceb/);
  assert.match(furigana,/furigana/i);
});
