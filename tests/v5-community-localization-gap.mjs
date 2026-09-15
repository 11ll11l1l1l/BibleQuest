import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/features/community/index.js', import.meta.url), 'utf8');
const localization = await readFile(new URL('../src/app/localization.js', import.meta.url), 'utf8');
const checklist = await readFile(new URL('../V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md', import.meta.url), 'utf8');

// This is intentionally a gap/characterization contract, not a PASS claim for
// Community localization. It should fail once Community is genuinely migrated,
// at which point this file must be replaced by positive EN/TL parity + browser proof.
assert.match(checklist, /Community\/Media and remaining member-facing surfaces fully localized[\s\S]*remaining agreed surfaces still need completion/);
assert.match(localization, /export const localization = Object\.freeze/);
assert.match(localization, /const dictionaries = Object\.freeze\(\{ en, tl \}\)/);

// Current Community page is not wired to the integrated localization owner.
assert.doesNotMatch(source, /app\/localization\.js/);
assert.doesNotMatch(source, /localization\.t\(/);

// Representative BibleQuest-authored strings still hard-coded in English.
for (const text of [
  'Community',
  'Grow together without exposing private study.',
  'Membership & role',
  'View or join a congregation',
  'Sign in to connect',
  'Community connections are disabled in local preview.',
  'What stays separate',
  'Connecting verified community tools…',
  'Community connections could not load.',
  'Try again',
  'Back to More'
]) {
  assert.ok(source.includes(text), `Expected current English Community copy: ${text}`);
}

// Runtime/user-backed values must remain data, not translation dictionary content.
for (const runtimeExpression of [
  'esc(row.roleLabel)',
  'esc(row.name)',
  'esc(row.role)',
  'esc(String(row.memberCount))',
  'esc(String(row.maxMembers))'
]) {
  assert.ok(source.includes(runtimeExpression), `Expected escaped runtime Community data: ${runtimeExpression}`);
}

console.log('V5 Community localization gap characterized: current surface remains hard-coded English; runtime congregation/group data stays escaped and must not be translated.');
