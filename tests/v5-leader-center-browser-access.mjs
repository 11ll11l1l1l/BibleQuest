import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const APP_URL = process.env.BQ_V5_APP_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.setDefaultTimeout(12000);
page.setDefaultNavigationTimeout(20000);
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

async function mountLeaderCenter(role) {
  await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
  // The proof owns only Leader Center composition. Ignore any unrelated base-app
  // bootstrap error emitted before this fixture replaces the page body, then
  // retain page-error detection for everything the Leader Center itself does.
  pageErrors.length = 0;
  await page.evaluate(async requestedRole => {
    document.body.innerHTML = '<main id="v5LeaderProof"></main>';
    const [{ createLeaderCenterService }, { leaderCenterPage }] = await Promise.all([
      import('/src/app/leader-center.js'),
      import('/src/features/leader-center/index.js')
    ]);

    const assignments = {
      async load() {
        return {
          status: 'ready',
          role: requestedRole,
          congregationId: 'browser-proof-congregation',
          congregationName: 'Browser Proof Fellowship',
          assignments: [
            { id: 'open-now', title: 'Open now', scheduleAt: null },
            { id: 'scheduled', title: 'Scheduled', scheduleAt: new Date(Date.now() + 86_400_000).toISOString() }
          ]
        };
      },
      snapshot() { return { status: 'ready' }; }
    };
    const presence = {
      async activeCount() {
        window.__v5LeaderPresenceCalled = true;
        return { count: 3 };
      }
    };

    window.__v5LeaderPresenceCalled = false;
    const leaderCenter = createLeaderCenterService({ assignments, presence });
    const feature = leaderCenterPage({ leaderCenter });
    const root = document.querySelector('#v5LeaderProof');
    root.innerHTML = feature.html;
    feature.mount(root);
  }, role);
}

try {
  console.log('phase: ordinary member denied');
  await mountLeaderCenter('member');
  await page.waitForSelector('[data-leader-center-denied]');
  assert.match(await page.locator('[data-leader-center-denied]').innerText(), /Ministry role required/i);
  assert.equal(await page.locator('[data-leader-overview]').count(), 0, 'ordinary members must not see the leader overview');
  assert.equal(await page.evaluate(() => window.__v5LeaderPresenceCalled), false, 'denied users must not reach the leader presence aggregate');

  console.log('phase: authorized leader allowed');
  await mountLeaderCenter('leader');
  await page.waitForSelector('[data-leader-overview]');
  const overview = page.locator('[data-leader-overview]');
  assert.match(await overview.innerText(), /Browser Proof Fellowship/);
  assert.match(await overview.innerText(), /Your role: leader/i);
  assert.equal(await page.locator('[data-leader-active-count]').innerText(), '3');
  assert.equal(await page.locator('[data-leader-open-count]').innerText(), '1');
  assert.equal(await page.locator('[data-leader-scheduled-count]').innerText(), '1');
  assert.equal(await page.locator('[data-leader-center-denied]').count(), 0, 'authorized leaders must not see the denial state');
  assert.equal(await page.locator('[data-leader-quick-actions]').count(), 1, 'authorized leaders should receive the existing quick-action surface');
  assert.equal(await page.evaluate(() => window.__v5LeaderPresenceCalled), true, 'authorized leader composition should use the existing presence owner');

  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overview: document.querySelector('[data-leader-overview]')?.getBoundingClientRect().toJSON()
  }));
  assert.ok(geometry.overview, 'authorized overview must have browser geometry');
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `Leader Center must not horizontally overflow at 390px: ${geometry.scrollWidth}px > ${geometry.innerWidth}px`);
  assert.deepEqual(pageErrors, [], `Leader Center browser proof emitted page errors: ${pageErrors.join(' | ')}`);

  console.log('V5 Leader Center browser access proof passed');
} finally {
  await browser.close();
}
