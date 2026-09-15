import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const REQUIRED_KEYS = [
  'community.title',
  'community.eyebrow',
  'community.intro.heading',
  'community.intro.description',
  'community.backMore',
  'community.summary.aria',
  'community.summary.congregations',
  'community.summary.groups',
  'community.summary.encouragements',
  'community.congregations.heading',
  'community.groups.heading',
  'community.congregations.empty',
  'community.groups.empty',
  'community.role.ministry',
  'community.role.member',
  'community.members.count',
  'community.action.membership.title',
  'community.action.membership.description',
  'community.action.leaderboards.title',
  'community.action.leaderboards.description',
  'community.action.recognition.title',
  'community.action.recognition.description',
  'community.action.assignments.title',
  'community.action.assignments.description',
  'community.action.liveRooms.title',
  'community.action.liveRooms.description',
  'community.action.journeyGroups.title',
  'community.action.journeyGroups.description',
  'community.action.encouragements.title',
  'community.action.encouragements.description',
  'community.signedOut.heading',
  'community.signedOut.description',
  'community.openAccount',
  'community.localPreview.heading',
  'community.localPreview.description',
  'community.boundary.heading',
  'community.boundary.description',
  'community.loading',
  'community.error.heading',
  'community.error.fallback'
];

function literalFor(source, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`['\"]${escaped}['\"]\\s*:\\s*['\"]([^'\"]+)['\"]`));
  return match?.[1] || '';
}

test('Community consumes the reviewed localization owner instead of hard-coded authored copy', async () => {
  const source = await read('src/features/community/index.js');
  assert.match(source, /localization/);
  assert.match(source, /localization\.t|\btext\s*=|\bt\(/);
  for (const key of REQUIRED_KEYS) assert.ok(source.includes(key), `Community must consume ${key}`);

  for (const leak of [
    'Grow together without exposing private study.',
    'Sign in to connect',
    'Community connections are disabled in local preview.',
    'Community connections could not load.',
    'What stays separate'
  ]) {
    assert.equal(source.includes(`>${leak}<`), false, `authored English must not remain inline: ${leak}`);
  }
});

test('Community EN/TL dictionaries share the same complete key inventory with real Tagalog values', async () => {
  const [en, tl] = await Promise.all([read('src/content/locales/en.js'), read('src/content/locales/tl.js')]);
  for (const key of REQUIRED_KEYS) {
    const enValue = literalFor(en, key);
    const tlValue = literalFor(tl, key);
    assert.ok(enValue, `English dictionary missing ${key}`);
    assert.ok(tlValue, `Tagalog dictionary missing ${key}`);
    assert.notEqual(tlValue, enValue, `Tagalog value must not silently leak English for ${key}`);
  }
});

test('Community preserves escaped runtime congregation/group/user data instead of translating it', async () => {
  const source = await read('src/features/community/index.js');
  for (const runtimeValue of ['row.name', 'row.roleLabel', 'row.role', 'row.memberCount', 'row.maxMembers']) {
    assert.ok(source.includes(`esc(${runtimeValue}`), `runtime value must remain escaped: ${runtimeValue}`);
  }
  assert.doesNotMatch(source, /(?:localization\.t|\btext)\([^\n]*(?:row\.name|row\.roleLabel|row\.role|row\.memberCount|row\.maxMembers)/);
});

test('Community keeps intentional loading, error and retry semantics localization-ready', async () => {
  const source = await read('src/features/community/index.js');
  assert.ok(source.includes("community.loading"), 'localized loading state required');
  assert.ok(source.includes("community.error.heading"), 'localized error heading required');
  assert.ok(source.includes("community.error.fallback"), 'localized safe fallback required');
  assert.ok(source.includes("common.retry") || source.includes("community.retry"), 'localized retry control required');
  assert.match(source, /role=["'](?:status|alert)["']|role=\\?"(?:status|alert)\\?"/);
});
