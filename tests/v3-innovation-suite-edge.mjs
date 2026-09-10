import assert from 'node:assert/strict';
import { recommend } from '../src/engines/mission.js';
import { createMissionService } from '../src/app/mission.js';

// --- engine ---
let rec = recommend({ due: 3, weakest: 'Wisdom' });
assert.equal(rec.action, 'review', 'Due reviews must take priority over study recommendation.');
assert.match(rec.title, /3 review/, 'Recommendation title must surface the exact due count.');

rec = recommend({ due: 0, weakest: 'Gospels' });
assert.equal(rec.action, 'study', 'Zero due reviews must recommend study.');
assert.match(rec.title, /Gospels/, 'Study recommendation must name the weakest category.');

rec = recommend({ due: 0, weakest: '' });
assert.equal(rec.action, 'study', 'Missing weakest category must still fail closed to a study recommendation.');
assert.equal(rec.title, 'Continue your study', 'Missing weakest category must use the generic fallback title.');

rec = recommend({ due: -5, weakest: 'X' });
assert.equal(rec.action, 'study', 'Negative/garbage due count must fail closed to zero, not crash or recommend review.');

rec = recommend({});
assert.equal(rec.action, 'study', 'Missing input must fail closed to a safe study recommendation.');

// --- service: reuses Open Review, does not track its own state ---
let calls = 0;
const fakeOpenReview = { overview() { calls++; return { due: 2, weakest: 'Prophets' }; } };
const mission = createMissionService({ openReview: fakeOpenReview });
const result = mission.recommend();
assert.equal(calls, 1, 'Mission must call Open Review exactly once per recommend().');
assert.equal(result.action, 'review', 'Service must pass Open Review data through to the engine unchanged.');

assert.throws(() => createMissionService({}), /Open Review/, 'Mission must fail closed without the Open Review owner.');

console.log('BibleQuest v3 Innovation Suite (Personal Mission) edge regression passed.');
