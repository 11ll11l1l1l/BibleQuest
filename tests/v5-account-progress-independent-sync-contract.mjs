import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap = await readFile(new URL('../src/app/bootstrap.js', import.meta.url), 'utf8');

assert.match(
  bootstrap,
  /const accountProgressSyncOwners=\[[\s\S]*progressCloudSync[\s\S]*bibleQuestCloudSync[\s\S]*weeklyJourneyCloudSync[\s\S]*personalChallengesCloudSync[\s\S]*explorerCloudSync[\s\S]*\];/,
  'all account progress owners must be included in the independent resume set'
);
assert.match(
  bootstrap,
  /Promise\.allSettled\(accountProgressSyncOwners\.map/,
  'one rejected progress owner must not prevent the remaining owners from resuming'
);
assert.doesNotMatch(
  bootstrap,
  /progressCloudSync\.syncNow\(\)\s*\.then\(\(\)=>bibleQuestCloudSync\.syncNow\(\)\)/,
  'account progress owners must not be restored as a failure-coupled chain'
);

console.log('PASS V5 independent account progress resume contract');
