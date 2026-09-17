import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [edge,api,owner,page]=await Promise.all([
  readFile(new URL('../supabase/functions/bq-assignment/index.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/core/api.js',import.meta.url),'utf8'),
  readFile(new URL('../src/app/assignments.js',import.meta.url),'utf8'),
  readFile(new URL('../src/features/leader-center/index.js',import.meta.url),'utf8')
]);

assert.match(edge,/action==='lifecycle'/);
assert.match(edge,/current-active-target-recipients/);
assert.match(edge,/recipientCount>0&&completedCount===recipientCount\?'completed':'published'/);
assert.match(edge,/bible_team_members/);
assert.match(edge,/bible_group_members/);
assert.match(edge,/bible_assignment_progress/);
assert.match(api,/async lifecycle\(congregationId\)/);
assert.match(owner,/function normalizeLifecycle/);
assert.match(owner,/async function loadLifecycle/);
assert.match(page,/data-leader-published-count/);
assert.match(page,/data-leader-completed-count/);
assert.match(page,/Status unavailable/);

console.log('BibleQuest v5 authoritative assignment lifecycle static regression passed.');
