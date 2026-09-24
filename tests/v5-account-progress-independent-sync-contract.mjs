import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap = await readFile(new URL('../src/app/bootstrap.js', import.meta.url), 'utf8');
const ownerRegistry = await readFile(new URL('../src/v6/kernel/product-account-resume-owners.ts', import.meta.url), 'utf8');
const coordinator = await readFile(new URL('../src/v6/kernel/account-resume-coordinator.ts', import.meta.url), 'utf8');

assert.match(
  bootstrap,
  /bindLegacyAccountResumeRuntime\(\s*store,\s*createProductAccountResumeOwners\(/,
  'bootstrap must bind account progress owners through the typed V6 resume runtime'
);

for (const token of [
  'general:progressCloudSync',
  "'bible-quest':bibleQuestCloudSync",
  "'weekly-journey':weeklyJourneyCloudSync",
  "'personal-challenges':personalChallengesCloudSync",
  'explorer:explorerCloudSync',
  "'leaderboard-delivery':progressLeaderboardBridge",
]) {
  assert.ok(bootstrap.includes(token), 'typed account progress owner mapping missing: ' + token);
}

for (const key of [
  "'general'",
  "'bible-quest'",
  "'weekly-journey'",
  "'personal-challenges'",
  "'explorer'",
  "'leaderboard-delivery'",
]) {
  assert.ok(ownerRegistry.includes(key), 'typed account resume registry missing stable owner key: ' + key);
}

assert.ok(
  coordinator.includes('Promise.allSettled(owners.map((owner) => owner.syncNow()))'),
  'one rejected progress owner must not prevent the remaining owners from resuming'
);

assert.doesNotMatch(
  bootstrap,
  /progressCloudSync\.syncNow\(\)\s*\.then\(\(\)=>bibleQuestCloudSync\.syncNow\(\)\)/,
  'account progress owners must not be restored as a failure-coupled chain'
);

assert.doesNotMatch(
  bootstrap,
  /accountProgressSyncOwners|syncAccountProgress/,
  'legacy duplicate account progress orchestration must remain removed after the V6 cutover'
);

console.log('PASS V5 independent account progress resume contract');
