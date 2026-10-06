import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const foundation = readFileSync(
  new URL('../../supabase/migrations/20261004051000_v7_library_discipleship_foundation.sql', import.meta.url),
  'utf8',
);
const evidence = readFileSync(
  new URL('../../supabase/tests/v7-curriculum-stale-tenant-rls.test.sql', import.meta.url),
  'utf8',
);

function policy(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return foundation.match(new RegExp(`create policy "${escaped}"[\\s\\S]*?(?=create policy|\\n\\ncreate|$)`, 'i'))?.[0] ?? '';
}

test('published curriculum ancestry remains bound to current congregation membership', () => {
  for (const name of [
    'v7 tracks published read',
    'v7 modules published read',
    'v7 lessons published read',
    'v7 lesson revision read',
    'v7 lesson steps read',
  ]) {
    assert.match(
      policy(name),
      /private\.is_bible_congregation_member\(/,
      `${name} must retain current-membership authorization`,
    );
  }
});

test('curriculum editor policies remain bound to current review authority', () => {
  for (const name of [
    'v7 tracks editor insert',
    'v7 tracks editor update',
    'v7 modules editor',
    'v7 lessons editor',
    'v7 lesson revision editor',
    'v7 lesson steps editor',
  ]) {
    assert.match(
      policy(name),
      /private\.bible_can_review_content\(/,
      `${name} must retain current review authority`,
    );
  }
});

test('A3 executable evidence covers member and leader curriculum A-to-B switches', () => {
  for (const marker of [
    'Member A sees global and congregation A published curriculum before switch',
    'Member A cannot force a congregation B track through a client filter',
    'Switched member cannot force stale congregation A track through a client filter',
    'Switched member immediately sees congregation B published track',
    'Switched member sees only global and congregation B lesson steps',
    'Leader A can update congregation A draft track before membership revocation',
    'Leader A cannot update congregation B draft track',
    'Switched former leader cannot review congregation B draft track after role downgrade',
    'Switched leader cannot update stale congregation A draft track',
    'Switched leader cannot create new congregation A curriculum',
  ]) {
    assert.match(evidence, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
