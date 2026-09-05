import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const journey=read('journey-loop.js');
const journeyCloud=read('journey-cloud-sync.js');
const daily=read('frontpage-daily.js');
const translations=read('translations.js');
const sources=read('source-labels.js');
const cloud=read('cloud-config.js');
const doctrinalAudit=read('scripts/doctrinal-audit.js');
const doctrinalApply=read('scripts/apply-doctrinal-safety.js');

assert.match(journey,/let booted=false,evidenceTimer=null/,'Journey must own a single bootstrap/timer state');
assert.match(journey,/function boot\(\)\{[\s\S]*if\(booted\)return;/,'Journey boot must be idempotent');
assert.match(journey,/diagnostics:\(\)=>\(\{booted,evidenceTimerActive:Boolean\(evidenceTimer\)\}\)/,'Journey diagnostics must expose bootstrap state');

assert.doesNotMatch(journeyCloud,/Daily 5|data-daily5-play/,'cloud compatibility layer must not reintroduce Daily 5');
assert.match(daily,/BQJourneyLoop\?\.open|BQJourneyLoop\.open/,'legacy daily compatibility entry must route to Daily Journey');

assert.match(translations,/NLT:\{code:'NLT',name:'New Living Translation',mode:'licensed-link'/,'production NLT runtime must be truthfully classified until live API integration ships');
assert.match(sources,/Opens the selected passage in a licensed reader/,'source sheet must correct NLT copy to match production runtime');
assert.match(sources,/replace\(\/Daily 5\/g,'Daily Journey'\)/,'tutorial compatibility copy must use Daily Journey');

assert.match(cloud,/authMode: 'email-password'/,'auth mode must describe the actual primary credential flow');
assert.match(cloud,/recoveryMode: 'instant-recovery-code'/,'recovery code behavior must be explicit without overloading auth mode');

assert.match(doctrinalAudit,/manifest\.doctrinal_safety\?\.version/,'doctrinal audit must verify generated corpus policy version');
assert.match(doctrinalAudit,/questions remain quarantined even though the current policy now permits/,'recoverable quarantined questions must block release');
assert.match(doctrinalApply,/const files = \[\.\.\.new Set\(\[\.\.\.packFiles, \.\.\.heldFiles\]\)\]\.sort\(\)/,'sanitizer must reconcile active and held corpus together');
assert.match(doctrinalApply,/stats\.recovered\+\+/,'sanitizer must record recovered questions');

console.log('BibleQuest production consistency static guard passed');
