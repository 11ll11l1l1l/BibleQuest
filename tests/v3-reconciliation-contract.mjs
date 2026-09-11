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

for (const [name, text] of Object.entries({reconciliation, priority, status, handoff, continuation})) {
  requireText(text, '77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac', name);
  requireText(text, '73d39ce6fe0f9db20db62e25fd497a8711f921b0', name);
  requireText(text, '61ee54fac7d352312cef7ffd8010997fa8bc9e51', name);
  requireText(text, '01ba15e7cdc3f224509858fdd98c2f3b17d8a414', name);
  requirePattern(text, /no single cumulative latest exact-green post-release product SHA|no single cumulative latest exact-green product SHA|no single cumulative post-release product SHA/i, name);
}

requireText(reconciliation, 'main` product promotion is **BLOCKED**', 'reconciliation');
requireText(reconciliation, 'Chronological recency is not cumulative product truth', 'reconciliation');
requireText(reconciliation, 'ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md', 'reconciliation');

requireText(priority, 'Do **not** select a global “latest” SHA by date.', 'priority');
requireText(priority, 'supabase/migrations/20260911131000_assignment_response_presence.sql', 'priority');
requireText(priority, 'bbbceb057c631f08ec32826384ef6fcd61da4527', 'priority');

requireText(status, 'cumulative Assignment → Workspace line', 'status');
requireText(status, 'divergent Calendar line', 'status');
requireText(status, 'NOT RECORDED AS APPLIED', 'status');

requireText(handoff, 'cumulative exact-green candidate SHA, or explicitly `NONE`', 'handoff');
requireText(continuation, 'Do not confuse recency with cumulative product truth'.toUpperCase(), 'continuation heading');
requireText(continuation, 'generate → choose → optimize → implement → test', 'continuation visual rule');
requireText(continuation, 'docs/V3_ICON_ASSET_MAP.md', 'continuation icon-map rule');

requireText(calendar, 'Scope authority:', 'calendar');
requireText(calendar, 'implemented feature contract through Calendar v1.5', 'calendar');
requireText(calendar, '01ba15e7cdc3f224509858fdd98c2f3b17d8a414', 'calendar');
requireText(calendar, '20260911140000_calendar_congregation_sharing.sql', 'calendar');
requireText(calendar, 'divergent line', 'calendar');

requireText(migrationGuide, 'bbbceb057c631f08ec32826384ef6fcd61da4527', 'migration guide');
requirePattern(migrationGuide, /UNAPPLIED until positively verified/i, 'migration guide');
requirePattern(migrationGuide, /compare the currently deployed helper definition/i, 'migration guide');
requirePattern(migrationGuide, /do\s*(?:\*\*)?not(?:\*\*)?\s+apply it merely because a newer unrelated Calendar\/visual\/docs branch exists/i, 'migration guide');
requireText(migrationGuide, 'APPLIED + LIVE VERIFIED', 'migration guide');

console.log('BibleQuest v3 reconciliation documentation contract: PASS');
