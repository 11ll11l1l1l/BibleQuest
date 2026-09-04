import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

async function closeInnovation(id) {
  const layer = page.locator(`#${id}`);
  if (await layer.count()) {
    const close = layer.locator('[data-study-close],[data-mission-close],[data-world-close],[data-explorer-close],[data-workspace-close],[data-room-close],[data-challenge-close],[data-couple-cloud-close]').first();
    if (await close.count()) await close.click();
  }
}

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.modern-home');

  const manifest = await page.evaluate(() => fetch('manifest.webmanifest').then(r => r.json()));
  assert.equal(manifest.display, 'standalone', 'PWA should launch standalone');
  assert.equal(manifest.start_url, './', 'PWA start URL should stay within the GitHub Pages scope');
  assert.ok(manifest.icons?.some(x => x.src === 'app-icon.svg'), 'PWA should expose a production app icon');

  assert.equal(await page.locator('.modern-hub').count(), 4, 'Home should expose exactly four primary hubs');
  for (const label of ['Daily 5','Play','Read','Grow','Together']) assert.match(await page.locator('.modern-home').innerText(), new RegExp(label));
  const oldStackDisplay = await page.locator('.feature-stack').evaluate(el => getComputedStyle(el).display);
  assert.equal(oldStackDisplay, 'none', 'Legacy feature catalog should be visually hidden on modern Home');

  await page.locator('[data-modern-sources]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  const sources = await page.locator('.modern-source-list').innerText();
  assert.match(sources, /Berean Standard Bible/);
  assert.match(sources, /Tagalog ULB/);
  assert.match(sources, /New Living Translation/);
  assert.match(sources, /Open Bible Stories/);
  await page.locator('.modern-sheet-head [data-modern-close]').click();

  // Play hub: existing source-grounded game + new Characters & Places explorer.
  await page.locator('[data-modern-hub="play"]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  assert.match(await page.locator('.modern-sheet-list').innerText(), /Characters & Places/);
  await page.getByRole('button', { name: /Who Said It/ }).click();
  await page.waitForSelector('[data-speaker-answer]', { timeout: 15000 });
  assert.match(await page.locator('.extra-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.speaker-verse').innerText()).length > 12, 'Who Said It should display actual Bible text');
  await page.locator('[data-extra-close]').click();

  await page.locator('[data-modern-hub="play"]').click();
  await page.getByRole('button', { name: /Characters & Places/ }).click();
  await page.waitForSelector('#bqExplorerLayer:not(.hidden)');
  assert.match(await page.locator('#bqExplorerLayer').innerText(), /Who Am I/);
  assert.match(await page.locator('#bqExplorerLayer').innerText(), /Where Is It/);
  await page.locator('#bqExplorerLayer [data-explorer-close]').click();

  await page.locator('[data-modern-review]').click();
  await page.waitForSelector('.open-review-overlay.open');
  await page.waitForSelector('[data-open-review-reveal]', { timeout: 15000 });
  const firstQuestion = await page.locator('.open-review-card h1').innerText();
  assert.ok(firstQuestion.length > 8, 'Open review should show a real source question');
  await page.locator('[data-open-review-reveal]').click();
  await page.waitForSelector('[data-open-review-rate="got"]');
  assert.match(await page.locator('.open-review-card').innerText(), /Translation Questions v90/);
  await page.locator('[data-open-review-rate="got"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest_open_review_v1') || '{}'));
  assert.ok(Object.keys(stored.items || {}).length >= 1, 'Open review should persist spaced-review evidence');
  const closeReview = page.locator('[data-open-review-close]').first();
  if (await closeReview.count()) await closeReview.click();

  // Read hub: primary translations, Tagalog bundled reader, Guided Study, Workspace.
  await page.locator('[data-modern-hub="read"]').click();
  const readHubText = await page.locator('.modern-sheet-list').innerText();
  assert.match(readHubText, /Guided Study/);
  assert.match(readHubText, /Bible Workspace/);
  await page.getByRole('button', { name: /Bible Reader/ }).click();
  await page.waitForSelector('[data-reader-book="GEN"]', { timeout: 15000 });
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list', { timeout: 15000 });
  await page.waitForSelector('#bqTranslationSelect');
  const versionOptions = await page.locator('#bqTranslationSelect').innerText();
  for (const label of ['BSB','TGL','NLT']) assert.match(versionOptions, new RegExp(label));
  assert.ok((await page.locator('.verse-list p[data-verse]').count()) >= 20, 'BSB verses should expose verse IDs for highlights');
  assert.ok((await page.locator('.verse-list').innerText()).length > 100, 'Reader should display BSB text');

  await page.locator('#bqTranslationSelect').selectOption('TGL');
  await page.waitForFunction(() => document.querySelector('.verse-list')?.dataset?.bqScripture === 'TGL', null, { timeout: 15000 });
  assert.match(await page.locator('.reader-panel').innerText(), /Tagalog Unlocked Literal Bible|banal na Bibliya/);
  assert.ok((await page.locator('.verse-list').innerText()).length > 100, 'Tagalog reader should display bundled Scripture text');
  await page.locator('[data-reader-close]').first().click();

  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button', { name: /Guided Study/ }).click();
  await page.waitForSelector('#bqStudyLayer:not(.hidden)');
  assert.match(await page.locator('#bqStudyLayer').innerText(), /READ.*OBSERVE.*UNDERSTAND.*DISCUSS.*APPLY.*PRAY/s);
  await page.locator('#bqStudyLayer [data-study-track]').first().click();
  await page.waitForSelector('#bqStudyLayer [data-bq-scripture="BSB"]', { timeout: 15000 });
  assert.ok((await page.locator('#bqStudyLayer [data-bq-scripture="BSB"]').innerText()).length > 100, 'Guided Study should open actual BSB Scripture');
  await page.locator('#bqStudyLayer [data-study-list]').click();
  await page.locator('#bqStudyLayer [data-study-close]').click();

  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button', { name: /Bible Workspace/ }).click();
  await page.waitForSelector('#bqWorkspaceLayer:not(.hidden)');
  assert.match(await page.locator('#bqWorkspaceLayer').innerText(), /Sign in.*cloud Bible workspace/s);
  await page.locator('#bqWorkspaceLayer [data-workspace-close]').click();

  // Grow hub: adaptive Mission + visual Bible World without adding Home clutter.
  await page.locator('[data-modern-hub="grow"]').click();
  const growText = await page.locator('.modern-sheet-list').innerText();
  assert.match(growText, /My Mission/);
  assert.match(growText, /Bible World/);
  await page.getByRole('button', { name: /My Mission/ }).click();
  await page.waitForSelector('#bqMissionLayer:not(.hidden)');
  assert.match(await page.locator('#bqMissionLayer').innerText(), /PERSONAL.*6 MINUTES/s);
  await page.locator('#bqMissionLayer [data-mission-close]').click();

  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button', { name: /Bible World/ }).click();
  await page.waitForSelector('#bqWorldLayer:not(.hidden)');
  assert.match(await page.locator('#bqWorldLayer').innerText(), /Creation & Beginnings/);
  assert.match(await page.locator('#bqWorldLayer').innerText(), /Jesus & Gospels/);
  await page.locator('#bqWorldLayer [data-world-close]').click();

  // Existing couples flow remains available inside the streamlined Together hub.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Grow Together/ }).click();
  await page.waitForSelector('.couples-layer:not(.hidden)');
  assert.match(await page.locator('.couples-panel').innerText(), /Hindi contest ang marriage/);
  assert.match(await page.locator('.couples-panel').innerText(), /Listen First/);
  await page.locator('[data-couples-close]').click();

  // New cloud-oriented Together features degrade safely on localhost instead of writing production data.
  await page.locator('[data-modern-hub="together"]').click();
  assert.match(await page.locator('.modern-sheet-list').innerText(), /Live BibleQuest Room/);
  assert.match(await page.locator('.modern-sheet-list').innerText(), /Church Challenges/);
  assert.match(await page.locator('.modern-sheet-list').innerText(), /Couple Journey/);
  await page.getByRole('button', { name: /Live BibleQuest Room/ }).click();
  await page.waitForSelector('#bqRoomLayer:not(.hidden)');
  assert.match(await page.locator('#bqRoomLayer').innerText(), /Sign in required/);
  await page.locator('#bqRoomLayer [data-room-close]').click();

  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Church Challenges/ }).click();
  await page.waitForSelector('#bqChallengeLayer:not(.hidden)');
  const challenges = await page.locator('#bqChallengeLayer').innerText();
  assert.match(challenges, /7-Day Gospel Challenge/);
  assert.match(challenges, /30-Day Proverbs Challenge/);
  assert.match(challenges, /Acts Month/);
  await page.locator('#bqChallengeLayer [data-challenge-close]').click();

  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Couple Journey/ }).click();
  await page.waitForSelector('#bqCoupleCloudLayer:not(.hidden)');
  assert.match(await page.locator('#bqCoupleCloudLayer').innerText(), /Sign in to use|Link two BibleQuest accounts/);
  await page.locator('#bqCoupleCloudLayer [data-couple-cloud-close]').click();

  // Congregation leaderboard has real period switching and eight ranking lanes.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Leaderboards & Awards/ }).click();
  await page.waitForSelector('.community-layer:not(.hidden)');
  assert.match(await page.locator('.board-head').innerText(), /Today/);
  assert.match(await page.locator('.board-head').innerText(), /This Week/);
  assert.match(await page.locator('.board-head').innerText(), /All Time/);
  const lanes = await page.locator('.lane-tabs').innerText();
  for (const label of ['Overall','Knowledge','Reading','Wisdom','Mastery','Consistency','Group','Couples']) assert.match(lanes, new RegExp(label));
  await page.locator('[data-community-home]').click();
  await page.locator('[data-community-close]').click();

  // Local congregation roster never invents fake people; add a second real test participant.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Congregation Roster/ }).click();
  await page.waitForSelector('[data-roster-form]');
  await page.locator('[data-roster-form] input[name="name"]').fill('Alex');
  await page.locator('[data-roster-form] button').click();
  assert.equal(await page.locator('.roster-list article').count(), 2, 'Roster should contain only the current profile and explicitly added participant');
  await page.locator('[data-community-home]').click();
  assert.ok((await page.locator('.award-grid article').count()) >= 8, 'Community dashboard should expose multiple weekly field awards');
  await page.locator('[data-community-close]').click();

  // Group play works from one phone and uses the congregation roster.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Play Together/ }).click();
  await page.waitForSelector('.group-layer:not(.hidden)');
  assert.match(await page.locator('.group-mode-grid').innerText(), /Team Bible Sprint/);
  assert.match(await page.locator('.group-mode-grid').innerText(), /Conversation Circle/);
  assert.match(await page.locator('.group-mode-grid').innerText(), /Pair & Share/);
  await page.getByRole('button', { name: /Team Bible Sprint/ }).click();
  await page.waitForSelector('[data-sprint-answer]', { timeout: 15000 });
  assert.equal(await page.locator('.participant-bar button[data-group-person]').count(), 2, 'Team game should expose both participants');
  await page.locator('[data-sprint-answer]').first().click();
  await page.waitForSelector('.group-feedback');
  await page.locator('[data-group-home]').click();
  await page.locator('[data-group-close]').click();

  // Bridge future solo/couples progress into dated community score events.
  await page.evaluate(() => {
    const app = JSON.parse(localStorage.getItem('biblequest_state_v4') || '{}');
    app.answered = (app.answered || 0) + 1;
    app.correct = (app.correct || 0) + 1;
    app.xp = (app.xp || 0) + 10;
    app.streak = (app.streak || 1) + 1;
    app.mastery = { ...(app.mastery || {}), Genesis: (app.mastery?.Genesis || 0) + 5 };
    localStorage.setItem('biblequest_state_v4', JSON.stringify(app));

    const couple = JSON.parse(localStorage.getItem('biblequest_couples_v1') || '{}');
    couple.history = [...(couple.history || []), { id: 'smoke-discussion', at: new Date().toISOString() }];
    localStorage.setItem('biblequest_couples_v1', JSON.stringify(couple));
  });
  await page.waitForTimeout(100);
  const community = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest_community_v1') || '{}'));
  assert.ok(community.events.some(e => e.category === 'knowledge' && e.source === 'Solo Bible Game'), 'Solo learning should feed the community leaderboard');
  assert.ok(community.events.some(e => e.category === 'couples' && e.source === 'Couples Conversation'), 'Couples activity should feed its own leaderboard lane');
  assert.ok(community.events.some(e => e.category === 'mastery'), 'Mastery growth should feed its own leaderboard lane');
  assert.ok(community.events.some(e => e.category === 'consistency'), 'Streak growth should feed its own leaderboard lane');

  // Large badge catalog is discoverable without crowding Home.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Congregation Badges/ }).click();
  await page.waitForSelector('.badge-grid');
  assert.ok((await page.locator('.badge-grid article').count()) >= 45, 'Congregation mode should expose a large achievement catalog');
  assert.match(await page.locator('.badge-head').innerText(), /Knowledge/);
  assert.match(await page.locator('.badge-head').innerText(), /Consistency/);
  assert.match(await page.locator('.badge-head').innerText(), /Mastery/);
  await page.locator('[data-community-home]').click();
  await page.locator('[data-community-close]').click();

  assert.deepEqual(pageErrors, [], `Browser emitted uncaught errors: ${pageErrors.join(' | ')}`);
  console.log('BibleQuest innovation + congregation + translations mobile smoke test passed');
} finally {
  await browser.close();
}
