import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const bootstrapPath = fileURLToPath(new URL('../../src/app/bootstrap.js', import.meta.url));

test('V6 route pages are discovered lazily instead of statically bundled into bootstrap', async () => {
  const source = await readFile(bootstrapPath, 'utf8');
  const readerBoot = await readFile(new URL('../../src/app/reader-v6-page.js', import.meta.url), 'utf8');

  assert.equal(source.includes('import.meta.glob(['), true);
  assert.equal(source.includes("'../features/*/index.js'"), true);
  assert.equal(source.includes("'!../features/tutorial/index.js'"), true);
  assert.equal(source.includes("import.meta.glob('../features/*/index.js')"), false);
  assert.equal(source.includes("createLazyPage"), true);

  const staticFeatureImports = source
    .split('\n')
    .filter(line => line.startsWith("import { ") && line.includes(" from '../features/") && line.endsWith("/index.js';"));

  assert.deepEqual(staticFeatureImports, [
    "import { mountTutorialOverlay } from '../features/tutorial/index.js';",
  ]);

  const lazyProxyLines = source
    .split('\n')
    .filter(line => line.startsWith('const ') && line.includes(" = args => lazyFeaturePage('"));

  assert.equal(lazyProxyLines.length, 44);
  for (const route of [
    "const bibleQuestPage = args => lazyFeaturePage('bible-quest', 'bibleQuestPage', args);",
    "const explorerPage = args => lazyFeaturePage('explorer', 'explorerPage', args);",
    "const challengesPage = args => lazyFeaturePage('challenges', 'challengesPage', args);",
    "const ministryAnnouncementsPage = args => lazyFeaturePage('ministry-announcements', 'ministryAnnouncementsPage', args);",
  ]) assert.ok(lazyProxyLines.includes(route), `V5.1 parity route must remain lazy: ${route}`);
  assert.match(source, /const readerPage = args => createLazyPage\(\{[\s\S]*?import\('\.\/reader-v6-page\.js'\)/);
  assert.match(readerBoot, /import\('\.\.\/v6\/reader\/browser-packages\.ts'\)/);
  assert.match(readerBoot, /import\('\.\.\/v6\/reader\/audio-provider\.ts'\)/);
  assert.equal(source.includes("import { createWisdomSituationsService } from './wisdom-situations.js';"), false);
  assert.equal(source.includes("import('./wisdom-situations.js')"), true);
  assert.equal(source.includes("featurePageModules['../features/wisdom-situations/index.js']"), true);
  assert.equal(source.includes("'wisdom-situations':()=>wisdomSituationsPage({lesson,progress,storage"), true);
  for(const owner of ['leaderboards','content-review']){
    assert.equal(source.includes(`from './${owner}.js';`),false,`${owner} owner must stay out of the startup bundle`);
    assert.equal(source.includes(`import('./${owner}.js')`),true,`${owner} owner should load with its lazy route`);
  }
  assert.match(source,/function leaderboardsPage\([\s\S]*?featurePageModules\['\.\.\/features\/leaderboards\/index\.js'\][\s\S]*?import\('\.\/leaderboards\.js'\)/);
  assert.match(source,/function contentReviewPage\([\s\S]*?featurePageModules\['\.\.\/features\/content-review\/index\.js'\][\s\S]*?import\('\.\/content-review\.js'\)/);
  assert.match(source,/leaderboards:\(\)=>leaderboardsPage\(\{api,session,congregation,/);
  assert.match(source,/'content-review':\(\)=>contentReviewPage\(\{api,session,congregation,recall,/);

  for (const line of lazyProxyLines) {
    const name = line.slice('const '.length, line.indexOf(' = args'));
    assert.equal(line.includes(`, '${name}', args);`), true);
  }
});
