import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [learn, games, progress, more, css, index] = await Promise.all([
  readFile(new URL('../../src/features/learn/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/games/views/launcher-memory.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/progress/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/features/more/index.js', import.meta.url), 'utf8'),
  readFile(new URL('../../src/ui/v6-secondary-experience.css', import.meta.url), 'utf8'),
  readFile(new URL('../../index.html', import.meta.url), 'utf8')
]);

test('Learn exposes five human-readable entry groups while preserving every route', () => {
  for (const heading of ['CONTINUE LEARNING','Read the Bible','Study a topic','Practice Scripture','My library']) assert.match(learn,new RegExp(heading));
  for (const hook of ['data-open-reader','data-open-study','data-open-deep-questions','data-open-story-journey','data-open-wisdom-situations','data-open-bible-world','data-open-explorer','data-open-adaptive-learning','data-open-open-review','data-open-private-notes','data-open-cloud-notes']) assert.ok(learn.includes(hook),`missing Learn route ${hook}`);
});

test('Play is organized for featured, quick, deeper, together and library scanning', () => {
  for (const heading of ['Quick games','Think deeper','PLAY TOGETHER','Bible library games']) assert.match(games,new RegExp(heading));
  assert.match(games,/gameCard\(byId\.get\('quick-recall'\)/);
  assert.match(games,/loading="lazy"/);
});

test('Grow keeps progress behavior but removes Psychometrics Lab terminology', () => {
  assert.doesNotMatch(progress,/Psychometrics Lab/);
  assert.match(progress,/Insight tools/);
  assert.match(css,/\.bq-badge-grid \{ display: flex/);
});

test('More remains route-complete while using compact grouped rows', () => {
  for (const hook of ['data-open-ministry-hub','data-open-congregation','data-open-team-center','data-open-content-review','data-open-community','data-open-calendar','data-open-mission','data-open-couples-family','data-open-journey-groups','data-open-workspace','data-open-notification-center','data-open-accessibility','data-open-help']) assert.ok(more.includes(hook),`missing More route ${hook}`);
  assert.match(css,/grid-template-columns: 38px minmax\(0,1fr\) auto/);
});

test('Phase 3 stylesheet loads after Phase 2 and supports narrow layouts', () => {
  assert.ok(index.indexOf('v6-secondary-experience.css') > index.indexOf('v6-core-experience.css'));
  assert.match(css,/@media \(max-width: 430px\)/);
  assert.match(css,/@media \(max-width: 340px\)/);
});
