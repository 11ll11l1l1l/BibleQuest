import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const leaderCenter = await readFile(new URL('../src/features/leader-center/index.js', import.meta.url), 'utf8');

const mustInclude = (needle, reason) => {
  assert.ok(leaderCenter.includes(needle), `${reason}: missing ${JSON.stringify(needle)}`);
};

const mustNotInclude = (needle, reason) => {
  assert.ok(!leaderCenter.includes(needle), `${reason}: unexpectedly found ${JSON.stringify(needle)}`);
};

// Preserve the current authorization boundary and existing product composition.
mustInclude("canAccessLeaderCenter(userRole)", 'Leader Center must remain role-gated');
mustInclude('data-leader-center-denied="true"', 'Denied users must keep an explicit denied surface');
mustInclude("listAssignments({ congregationId })", 'Leader Center must reuse Assignments as its source of assignment truth');
mustInclude("listActivityFeed({ congregationId, limit: 8 })", 'Leader Center must reuse the authorized activity feed');
mustInclude("navigate('assignments')", 'Leader Center must keep the Assignments navigation affordance');
mustInclude("navigate('assignment-review')", 'Leader Center must keep the response-review navigation affordance');
mustInclude("navigate('journey-groups')", 'Leader Center must keep the Groups navigation affordance');
mustInclude("navigate('team-center')", 'Leader Center must keep the Teams navigation affordance');

// A1 must not turn this page into a new backend/data owner.
mustNotInclude("from('", 'Leader Center must not query Supabase tables directly');
mustNotInclude('supabase.', 'Leader Center must not become a Supabase owner');

// Current-head characterization of the remaining accepted summary gaps.
// These are intentionally negative until a patch-capable owner adds the composition.
assert.equal(/member(s)?\s*(count|total)|total\s*members/i.test(leaderCenter), false,
  'Characterization changed: member-count composition now exists; update this contract to positive acceptance evidence');
assert.equal(/completed\s*assignment(s)?|assignment(s)?\s*completed/i.test(leaderCenter), false,
  'Characterization changed: completed-assignment count now exists; update this contract to positive acceptance evidence');

console.log('PASS v5-leader-center-acceptance: current authorized composition preserved; member-count and completed-assignment summary gaps remain explicitly characterized.');
