import fs from 'node:fs';
import assert from 'node:assert/strict';

const linked=fs.readFileSync('linked-activities.js','utf8');
const edge=fs.readFileSync('supabase/functions/bq-assignment/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20260905181000_linked_activity_assignment_groups.sql','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.match(index,/linked-activities\.js/,'linked activity adapter must load in production');
assert.match(edge,/\['all','member','team','group'\]/,'assignment Edge Function must accept Journey Group audiences');
assert.match(edge,/target_scope==='group'/,'assignment visibility must check Journey Group membership');
assert.match(edge,/Journey Group not found in this congregation/,'group target must be congregation-scoped');
assert.match(migration,/target_scope = 'group'/,'database visibility must implement group scope');
assert.match(migration,/bible_group_members/,'group assignment visibility must depend on group membership');
assert.match(linked,/One Journey Group/,'leader assignment UI must expose Journey Group targeting');
assert.match(linked,/BQCoupleCloud\?\.open/,'couples assignments must route to linked Couple Journey');
assert.match(linked,/BQJourneyGroups\?\.open/,'group assignments must route to Journey Groups');
assert.match(linked,/CLOUD MEMBERSHIP/,'congregation roster must render cloud membership rather than the local play roster');

console.log('linked activity static contracts: ok');
