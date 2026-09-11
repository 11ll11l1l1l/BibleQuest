import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (text, needle, label) => assert.ok(text.includes(needle), `${label}: missing ${needle}`);
const requirePattern = (text, pattern, label) => assert.match(text, pattern, `${label}: missing required semantic contract`);

const reconciliation = read('RECONCILIATION_V3.md');
const priority = read('DEVELOPMENT_PRIORITY_V3.md');
const status = read('DEVELOPMENT_STATUS_V3.md');
const handoff = read('DEVELOPMENT_HANDOFF_V3.md');
const continuation = read('CONTINUE_PROMPT_V3.md');
const calendar = read('CALENDAR_V3.md');
const migrationGuide = read('ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md');
const iconMap = read('docs/V3_ICON_ASSET_MAP.md');

const controlling = {reconciliation, priority, status, handoff, continuation};
const expectedShas = [
  '77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac',
  '73d39ce6fe0f9db20db62e25fd497a8711f921b0',
  '61ee54fac7d352312cef7ffd8010997fa8bc9e51',
  '524adb11cd7e5ad877b5dcdb8f5c28373ad84932',
  '7ce6685a7383102f29797869a77eabcf7ab9c0c2',
  '01ba15e7cdc3f224509858fdd98c2f3b17d8a414'
];

for (const [name, text] of Object.entries(controlling)) {
  for (const sha of expectedShas) requireText(text, sha, name);
  requirePattern(text, /no single cumulative latest exact-green post-release product SHA|no single cumulative latest exact-green product SHA|no single cumulative post-release product SHA/i, name);
}

requirePattern(reconciliation, /`main`(?:\s+product)?\s+promotion\s+is\s+\*\*BLOCKED\*\*/i, 'reconciliation promotion gate');
requireText(reconciliation, 'Chronological recency is not cumulative product truth', 'reconciliation');
requireText(reconciliation, '545b5b98d88ca04001d3675317c37cbcd3306955', 'reconciliation merge base');
requireText(reconciliation, 'entire intended Line B delta', 'reconciliation line-B integration');
requireText(reconciliation, 'ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md', 'reconciliation');
requireText(reconciliation, 'docs/V3_ICON_ASSET_MAP.md', 'reconciliation icon map');
requirePattern(reconciliation, /assets\/icons\/v3\/.*not present on current `main`/is, 'reconciliation binary availability');

requireText(priority, 'Do **not** select a global “latest” SHA by date.', 'priority');
requireText(priority, 'whole intended Line B delta', 'priority');
requireText(priority, 'supabase/migrations/20260911131000_assignment_response_presence.sql', 'priority');
requireText(priority, 'bbbceb057c631f08ec32826384ef6fcd61da4527', 'priority');
requireText(priority, 'docs/V3_ICON_ASSET_MAP.md', 'priority icon map');

requireText(status, 'Line A — Assignment → Workspace', 'status');
requireText(status, 'Line B — Visual18 → Avatar Vault v2 → Calendar v1.5', 'status');
requireText(status, 'UNAPPLIED until positively verified', 'status');

requireText(handoff, 'cumulative exact-green candidate SHA, or explicitly `NONE`', 'handoff');
requireText(handoff, 'docs/V3_ICON_ASSET_MAP.md', 'handoff icon map');
requirePattern(handoff, /assets\/icons\/v3\/.*not present on `main`/is, 'handoff binary availability');

requirePattern(continuation, /do not confuse recency with cumulative product truth/i, 'continuation heading');
requireText(continuation, 'full intended Line B delta', 'continuation integration rule');
requireText(continuation, 'generate → choose → optimize → implement → test', 'continuation visual rule');
requireText(continuation, 'docs/V3_ICON_ASSET_MAP.md', 'continuation icon-map rule');
requirePattern(continuation, /assets\/icons\/v3\/.*not present on `main`/is, 'continuation binary availability');

requireText(calendar, 'Scope authority:', 'calendar');
requireText(calendar, 'implemented feature contract through Calendar v1.5', 'calendar');
requireText(calendar, '524adb11cd7e5ad877b5dcdb8f5c28373ad84932', 'calendar visual ancestor');
requireText(calendar, '7ce6685a7383102f29797869a77eabcf7ab9c0c2', 'calendar avatar ancestor');
requireText(calendar, '01ba15e7cdc3f224509858fdd98c2f3b17d8a414', 'calendar');
requireText(calendar, '20260911140000_calendar_congregation_sharing.sql', 'calendar migration');
requireText(calendar, 'full intended Line B chain', 'calendar integration rule');

requireText(migrationGuide, 'bbbceb057c631f08ec32826384ef6fcd61da4527', 'migration guide');
requirePattern(migrationGuide, /UNAPPLIED until positively verified/i, 'migration guide');
requirePattern(migrationGuide, /compare the currently deployed helper definition/i, 'migration guide');
requirePattern(migrationGuide, /do\s*(?:\*\*)?not(?:\*\*)?\s+apply it merely because a newer unrelated Calendar\/visual\/docs branch exists/i, 'migration guide');
requireText(migrationGuide, 'APPLIED + LIVE VERIFIED', 'migration guide');

requireText(iconMap, '70 unique PNG files', 'icon map inventory');
requireText(iconMap, 'Do not invent functionality to consume artwork', 'icon map product-boundary rule');
requireText(iconMap, 'No approval stop for mapped visual implementation', 'icon map approval rule');
requireText(iconMap, '`home.png`', 'icon map home assignment');
requireText(iconMap, '`bible.png`', 'icon map reader assignment');
requireText(iconMap, '`calendar.png`', 'icon map calendar assignment');
requireText(iconMap, '`assignments.png`', 'icon map assignment assignment');
requireText(iconMap, '`profile.png`', 'icon map avatar/profile assignment');

const mappedRows = [...iconMap.matchAll(/^\| `[^`]+\.png` \|/gm)];
assert.equal(mappedRows.length, 70, `icon map must contain exactly 70 PNG assignment rows, got ${mappedRows.length}`);

console.log('BibleQuest v3 reconciliation documentation contract: PASS');
