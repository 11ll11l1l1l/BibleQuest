import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const file = new URL('../src/features/community/index.js', import.meta.url);
const source = await readFile(file, 'utf8');

// This contract intentionally stays red until Community joins the reviewed
// localization foundation. It prevents the remaining member-facing surface
// from being marked localized based only on global locale support.
assert.match(source, /communityPage\(\{[^}]*\bt\b|\bt\(['"]community\./s,
  'Community must consume the shared localization lookup/key mechanism');

const hardCodedEnglish = [
  'Grow together without exposing private study.',
  'Sign in to connect',
  'Community connections are disabled in local preview.',
  'Community connections could not load.',
  'Try again',
  'Back to More',
  'Your congregation links',
  'Your Journey Group links',
  'What stays separate',
  'Membership & role',
  'Leaderboards',
  'Recognition',
  'Assignments',
  'Live Rooms',
  'Journey Groups',
  'Encouragements',
];

for (const text of hardCodedEnglish) {
  assert.equal(source.includes(text), false,
    `Community still leaks hard-coded English UI copy: ${text}`);
}

// Runtime/user/congregation data must remain escaped and must not be sent
// through translation lookup. These checks preserve that boundary for the
// later patch-capable implementation.
for (const expression of ['esc(row.name)', 'esc(row.role)', 'esc(row.roleLabel)', 'esc(String(row.memberCount))', 'esc(String(row.maxMembers))']) {
  assert.ok(source.includes(expression), `Community must preserve escaped runtime data: ${expression}`);
}

console.log('V5 Community localization characterization PASS');
