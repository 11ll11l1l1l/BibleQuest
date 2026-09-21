import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const suite=fs.readFileSync('innovation-suite.js','utf8');

execFileSync(process.execPath,['--check','innovation-suite.js'],{stdio:'pipe'});

const templateKeys=[...suite.matchAll(/\{key:'([^']+)',title:/g)].map(match=>match[1]);
assert(new Set(templateKeys).size>=10,'V5 challenge library must expose at least ten distinct ready-made templates.');
for(const key of ['john21','psalms14','james5','prayer7','serve7']) assert(templateKeys.includes(key),`Missing expanded challenge template: ${key}`);

for(const token of [
  "PERSONAL_CHALLENGE_KEY='biblequest_personal_challenges_v1'",
  'function personalChallenge(t)',
  'data-personal-challenge-day',
  "done.has(day)",
  'savePersonalProgress(t,done',
  "EXPLORER_RECENT_KEY='biblequest_explorer_recent_v1'",
  "EXPLORER_SESSION_KEY='biblequest_explorer_session_v1'",
  'function chooseExplorerItem(kind)',
  'recentState[kind]={cycle:nextCycle,seen:[...nextSeen,chosen.name],last:chosen.name}',
  'saved.kind===kind&&!saved.revealed',
  'writeLocal(EXPLORER_SESSION_KEY'
]) assert(suite.includes(token),`Missing V5 variety/resume contract token: ${token}`);

assert(/if\(done\.has\(day\)\|\|day!==nextPersonalChallengeDay\(t,state\)\)return/.test(suite),'Personal challenge completion must reject duplicate and out-of-order day completion in the UI path.');
assert(/disabled/.test(suite)&&/isDone/.test(suite),'Completed personal challenge days must render disabled.');
assert(/available=pool\.filter\(p=>!seen\.includes\(p\.name\)\)/.test(suite),'Explorer selection must exhaust the full current pool before choosing a repeat.');
assert(/if\(!available\.length\)\{nextCycle=cycle\+1;nextSeen=\[\]/.test(suite),'Explorer fallback must advance to a new cycle only after the full pool is exhausted.');
assert(/p\.name!==last/.test(suite),'Explorer fallback must avoid an immediate repeat at cycle rollover when alternatives exist.');

console.log('BibleQuest V5 journey/challenge variety static regression passed.');
