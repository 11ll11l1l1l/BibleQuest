import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const suite=fs.readFileSync('innovation-suite.js','utf8');
execFileSync(process.execPath,['--check','innovation-suite.js'],{stdio:'pipe'});

for(const token of[
  "PERSONAL_CHALLENGE_SLICE='biblequest_personal_challenges_v1'",
  "PERSONAL_CHALLENGE_OWNER_KEY='biblequest_personal_challenges_owner_v1'",
  "PERSONAL_CHALLENGE_CACHE_PREFIX='biblequest_personal_challenges_cache_v1:'",
  "function normalizePersonalChallenges(input)",
  "function mergePersonalChallenges(localInput,remoteInput)",
  "function preparePersonalChallengeOwner()",
  "async function syncPersonalChallenges()",
  "from('bible_progress_snapshots')",
  ".eq('updated_at',row.updated_at)",
  "saved.error?.code!=='23505'",
  "function startPersonalChallenge(template)",
  "function nextPersonalChallengeDay(template,state=personalProgress(template))",
  "data-personal-challenge-state=",
  "day!==nextPersonalChallengeDay(t,state)",
  "View completed challenge",
  "Progress will resume with your BibleQuest account."
]) assert.ok(suite.includes(token),'Missing Personal Challenge lifecycle/account-resume contract: '+token);

assert.ok(/isDone\|\|locked\?'disabled'/.test(suite),'Completed and future Personal Challenge days must render disabled.');
assert.ok(/isNext=!isDone&&day===nextDay/.test(suite),'Only the earliest unfinished Personal Challenge day may be actionable.');
assert.ok(/if\(done\.has\(day\)\|\|day!==nextPersonalChallengeDay\(t,state\)\)return/.test(suite),'Personal Challenge completion handler must reject duplicate and out-of-order days.');
assert.ok(/if\(!local\.startedAt&&!complete\)startPersonalChallenge\(t\)/.test(suite),'Pressing Start must persist a started challenge before opening it.');
assert.ok(suite.includes("complete?")&&suite.includes("View completed challenge"),'Completed challenge must have a distinct completed lifecycle.');
assert.ok(suite.includes("[PERSONAL_CHALLENGE_SLICE]:merged"),'Personal Challenge sync must merge its slice without replacing unrelated account state.');

console.log('BibleQuest V5 Personal Challenge lifecycle/account-resume static regression passed.');
