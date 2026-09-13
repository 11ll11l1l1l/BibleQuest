// BibleQuest V5 Phase 1: Leader Center wiring/authorization static contract.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const bootstrap = read('src/app/bootstrap.js');
assert.ok(bootstrap.includes("import { createLeaderCenterService } from './leader-center.js';"), 'bootstrap.js must import the Leader Center service.');
assert.ok(bootstrap.includes("import { leaderCenterPage } from '../features/leader-center/index.js';"), 'bootstrap.js must import the Leader Center page.');
assert.ok(bootstrap.includes("'leader-center':()=>leaderCenterPage("), 'bootstrap.js must register the leader-center route.');
// TDZ ordering guard: this exact class of bug has broken app startup multiple
// times this project (Calendar, Avatar Vault v2, Home rail). Assert the
// dependency declaration order directly rather than trusting a manual review.
const presenceLine = bootstrap.split('\n').findIndex(line => line.includes('const presence=createPresenceService'));
const assignmentsLine = bootstrap.split('\n').findIndex(line => line.includes('const assignments=createAssignmentsService'));
const leaderCenterLine = bootstrap.split('\n').findIndex(line => line.includes('const leaderCenter=createLeaderCenterService'));
assert.ok(presenceLine >= 0 && assignmentsLine >= 0 && leaderCenterLine >= 0, 'Could not locate all three dependency declarations in bootstrap.js.');
assert.ok(presenceLine < leaderCenterLine, 'presence must be declared before leaderCenter (temporal-dead-zone guard).');
assert.ok(assignmentsLine < leaderCenterLine, 'assignments must be declared before leaderCenter (temporal-dead-zone guard).');

const service = read('src/app/leader-center.js');
assert.ok(service.includes("MINISTRY_ROLES = new Set(['facilitator', 'leader', 'pastor', 'admin'])"), 'Leader Center must use the same ministry-role set as the rest of the app, not a bespoke one.');
assert.ok(!/from\(['"]bible_/.test(service), 'Leader Center must never query Supabase tables directly - it must compose existing owners only.');

const ministryHub = read('src/app/ministry-hub.js');
assert.ok(/leader-dashboard['"][,:\s]*[\s\S]{0,200}available:true/.test(ministryHub) || ministryHub.includes("id:'leader-dashboard',label:'Leader Center',description:'Congregation activity, assignments, and groups composed from existing verified owners. Ministry role required.',route:'leader-center',available:true"), 'Ministry Hub must expose the Leader Center tool as available, not deferred.');

const page = read('src/features/leader-center/index.js');
assert.ok(page.includes('data-leader-center-denied'), 'Leader Center must render an explicit denied state for non-ministry roles, not a blank/silent failure.');
assert.ok(page.includes('enforced by the same server-side role check'), 'The denied state must be honest that hiding is not the real authorization boundary.');

console.log('BibleQuest v5 Leader Center static contract passed.');
