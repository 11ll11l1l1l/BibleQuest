import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('supabase/migrations/20260905183000_pair_link_couples_challenges.sql','utf8');
const couple=fs.readFileSync('couple-cloud.js','utf8');

assert.match(migration,/challenge_type/,'couples challenge linkage must inspect challenge type');
assert.match(migration,/IS DISTINCT FROM 'couples'/,'only couples-type challenges may enter pair history');
assert.match(migration,/item_type='challenge'/,'pair challenge records must use a distinct shared item type');
assert.match(migration,/bible_couple_shared_challenge_once_idx/,'pair challenge completion must be duplicate protected');
assert.match(migration,/ON CONFLICT DO NOTHING/,'repeat completion from either partner must remain idempotent');
assert.match(migration,/p\.status='active'/,'challenge linkage must only use an active couple pair');
assert.match(couple,/Shared challenge progress/,'Couple Journey must surface pair-linked challenge progress');
assert.match(couple,/Individual challenge points remain personal/,'UI must distinguish pair history from individual scoring');
assert.match(couple,/item_type==='challenge'/,'Couple Journey must filter shared challenge records explicitly');

console.log('couple challenge link static contracts: ok');
