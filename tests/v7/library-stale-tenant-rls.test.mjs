import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const foundation = readFileSync(
  new URL('../../supabase/migrations/20261004051000_v7_library_discipleship_foundation.sql', import.meta.url),
  'utf8',
);
const evidence = readFileSync(
  new URL('../../supabase/tests/v7-library-stale-tenant-rls.test.sql', import.meta.url),
  'utf8',
);

test('published congregation-scoped Library reads require current membership', () => {
  const itemRead = foundation.match(/create policy "v7 library published read"[\s\S]*?;/i)?.[0] ?? '';
  const revisionRead = foundation.match(/create policy "v7 library revision read"[\s\S]*?\n\);/i)?.[0] ?? '';
  const translationRead = foundation.match(/create policy "v7 library translation read"[\s\S]*?\n\);/i)?.[0] ?? '';
  const taxonomyRead = foundation.match(/create policy "v7 taxonomy read"[\s\S]*?;/i)?.[0] ?? '';
  const revisionTaxonomyRead = foundation.match(/create policy "v7 revision taxonomy read"[\s\S]*?\n\);/i)?.[0] ?? '';

  assert.match(itemRead, /congregation_id is null or private\.is_bible_congregation_member\(congregation_id\)/);
  assert.match(revisionRead, /i\.congregation_id is null or private\.is_bible_congregation_member\(i\.congregation_id\)/);
  assert.match(translationRead, /i\.congregation_id is null or private\.is_bible_congregation_member\(i\.congregation_id\)/);
  assert.match(taxonomyRead, /congregation_id is null or private\.is_bible_congregation_member\(congregation_id\)/);
  assert.match(revisionTaxonomyRead, /i\.congregation_id is null or private\.is_bible_congregation_member\(i\.congregation_id\)/);
});

test('Library editor policies use live tenant review authority', () => {
  for (const marker of [
    'v7 library editor insert',
    'v7 library editor update',
    'v7 library revision editor insert',
    'v7 library revision editor update',
    'v7 library translation editor',
    'v7 taxonomy editor insert',
    'v7 taxonomy editor update',
    'v7 revision taxonomy editor',
  ]) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const policy = foundation.match(new RegExp(`create policy "${escaped}"[\\s\\S]*?(?=create policy|\\n\\ncreate|$)`, 'i'))?.[0] ?? '';
    assert.match(policy, /private\.bible_can_review_content\(/, `${marker} must retain live review authority`);
  }
});

test('A3 executable evidence covers member and leader A-to-B context switches', () => {
  assert.match(evidence, /Member A sees global and congregation A published Library items before switch/);
  assert.match(evidence, /Switched member loses stale congregation A Library rows and sees global plus congregation B content/);
  assert.match(evidence, /Switched member cannot force stale congregation A Library item through a client filter/);
  assert.match(evidence, /Switched member immediately sees congregation B published Library content/);
  assert.match(evidence, /Leader A can update congregation A draft before membership revocation/);
  assert.match(evidence, /Leader A cannot update congregation B draft/);
  assert.match(evidence, /Switched former leader can read congregation B published content as a member/);
  assert.match(evidence, /Switched former leader cannot review congregation B draft after role downgrade/);
  assert.match(evidence, /Switched leader cannot read stale congregation A draft/);
  assert.match(evidence, /Switched leader cannot update stale congregation A draft/);
  assert.match(evidence, /Switched leader cannot create new congregation A Library content/);
});
