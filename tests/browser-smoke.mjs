import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.modern-home');

  assert.equal(await page.locator('.modern-hub').count(), 4, 'Home should expose exactly four primary hubs');
  assert.match(await page.locator('.modern-home').innerText(), /Daily 5/);
  assert.match(await page.locator('.modern-home').innerText(), /Play/);
  assert.match(await page.locator('.modern-home').innerText(), /Read/);
  assert.match(await page.locator('.modern-home').innerText(), /Grow/);
  assert.match(await page.locator('.modern-home').innerText(), /Together/);
  const oldStackDisplay = await page.locator('.feature-stack').evaluate(el => getComputedStyle(el).display);
  assert.equal(oldStackDisplay, 'none', 'Legacy feature catalog should be visually hidden on modern Home');

  await page.locator('[data-modern-sources]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  assert.match(await page.locator('.modern-source-list').innerText(), /Berean Standard Bible/);
  assert.match(await page.locator('.modern-source-list').innerText(), /Open Bible Stories/);
  await page.locator('.modern-sheet-head [data-modern-close]').click();

  await page.locator('[data-modern-hub="play"]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  assert.match(await page.locator('.modern-sheet-list').innerText(), /Who Said It/);
  await page.getByRole('button', { name: /Who Said It/ }).click();
  await page.waitForSelector('[data-speaker-answer]', { timeout: 15000 });
  assert.match(await page.locator('.extra-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.speaker-verse').innerText()).length > 12, 'Who Said It should display actual Bible text');
  await page.locator('[data-extra-close]').click();

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

  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button', { name: /Bible Reader/ }).click();
  await page.waitForSelector('[data-reader-book="GEN"]', { timeout: 15000 });
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list', { timeout: 15000 });
  assert.match(await page.locator('.reader-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.verse-list').innerText()).length > 100, 'Reader should display Bible text');
  await page.locator('[data-reader-close]').first().click();

  // Existing couples flow remains available inside the streamlined Together hub.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Grow Together/ }).click();
  await page.waitForSelector('.couples-layer:not(.hidden)');
  assert.match(await page.locator('.couples-panel').innerText(), /Hindi contest ang marriage/);
  assert.match(await page.locator('.couples-panel').innerText(), /Listen First/);
  await page.locator('[data-couples-close]').click();

  // Congregation leaderboard has real period switching and eight ranking lanes.
  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Leaderboards & Awards/ }).click();
  await page.waitForSelector('.community-layer:not(.hidden)');
  assert.match(await page.locator('.board-head').innerText(), /Today/);
  assert.match(await page.locator('.board-head').innerText(), /This Week/);
  assert.match(await page.locator('.board-head').innerText(), /All Time/);
  const lanes = await page.locator('.lane-tabs').innerText();
  for (const label of ['Overall','Knowledge','Reading','Wisdom','Mastery','Consistency','Group','Couples']) assert.match(lanes, new RegExp(label));
  await page.locator('[data-xboard-home]').click();
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

  console.log('BibleQuest congregation + streamlined mobile browser smoke test passed');
} finally {
  await browser.close();
}
