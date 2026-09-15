import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [home, week, checklist] = await Promise.all([
  read('src/features/home/index.js'),
  read('src/features/home/today-this-week.js'),
  read('V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md')
]);

// Preserve the current-architecture owners already composed on Home/This Week.
for (const marker of [
  'data-home-this-week',
  'data-home-next-event',
  'data-home-continue-reading',
  'data-home-latest-service',
  'data-home-transformation-prompt',
  'data-home-congregation-assignments',
  'data-open-this-week-calendar'
]) {
  assert.match(home, new RegExp(marker), `Home must retain existing-owner marker ${marker}`);
}
assert.match(week, /Keep your week connected/);
assert.match(week, /Panatilihing magkakaugnay ang linggo mo/);

// P0.6 must remain composition, not a replacement workflow/data engine.
for (const forbidden of [
  /localStorage\s*\./,
  /sessionStorage\s*\./,
  /createClient\s*\(/,
  /from\s*\(['"](?:weekly|journey|sermon)/i
]) {
  assert.doesNotMatch(week, forbidden, `This Week helper must not become an authoritative data/state owner: ${forbidden}`);
}

// Characterize the remaining accepted gap at this exact integration line.
const section = checklist.match(/## M\. P0 — connected weekly spiritual journey([\s\S]*?)## N\./)?.[1] || '';
assert.ok(section, 'Checklist section M must exist');
const openItems = [...section.matchAll(/^- \[ \] (.+)$/gm)].map(match => match[1]);
assert.equal(openItems.length, 5, 'All five connected-weekly-journey acceptance items are still open on this base');

const requiredConcepts = [
  /service\/sermon.*Scripture/i,
  /Transformation\/reflection.*service\/Scripture/i,
  /discussion\/prayer.*assignment\/action/i,
  /Calendar context.*without a new workflow engine/i,
  /weekly chain.*without duplicate authoritative records/i
];
for (const concept of requiredConcepts) {
  assert.ok(openItems.some(item => concept.test(item)), `Missing P0.6 acceptance concept: ${concept}`);
}

// The existing intro only links the current task to Calendar; it does not yet claim
// sermon -> Scripture -> Transformation -> discussion/prayer -> action composition.
assert.doesNotMatch(week, /sermon|service|scripture|transformation|reflection|discussion|prayer/i);

console.log('V5 connected weekly journey gap characterization: PASS');
console.log('Current owners preserved; exact remaining P0.6 delta is five open checklist items.');
