import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

try {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.evaluate(async () => {
    const [{ homePage }, { localization }] = await Promise.all([
      import('/src/features/home/index.js'),
      import('/src/app/localization.js')
    ]);

    window.__renderHomeForV5 = ({ locale = 'en', populated = false } = {}) => {
      window.__homeCleanup?.();
      localization.setLocale(locale);
      window.__homeNav = [];

      const event = Object.freeze({ date: '2026-09-20', title: 'Sunday Worship' });
      const calendarState = populated ? { agenda: [{ events: [event] }] } : { agenda: [] };
      const latestService = populated ? { id: 'service-1', title: 'Sunday Service 2026-09-13' } : null;
      const notificationState = { unread: populated ? 4 : 0 };
      const readerState = populated ? { book: 'GEN', chapter: 3 } : null;

      const feature = homePage({
        progress: { getState: () => ({ xp: 120, streak: 3, totalActivities: 7, badges: [] }) },
        dailyMission: { today: () => null },
        assignments: { load: async () => ({ status: 'ready', assignments: [] }), open() {} },
        calendar: { getState: () => calendarState, load: async () => calendarState },
        reader: { getState: () => readerState, books: [{ code: 'GEN', name: 'Genesis' }] },
        recordings: { getLatestService: () => latestService, load: async () => ({ latestService }) },
        transform: { getState: () => populated ? { spiritual: { result: { completed: true } } } : {} },
        notifications: { snapshot: () => notificationState, load: async () => notificationState },
        onAssignments: () => window.__homeNav.push('assignments'),
        onMission: () => window.__homeNav.push('mission'),
        onRecordings: () => window.__homeNav.push('recordings'),
        onMedia: () => window.__homeNav.push('media'),
        onTutorial: () => window.__homeNav.push('tutorial'),
        onReader: () => window.__homeNav.push('reader'),
        onCalendar: () => window.__homeNav.push('calendar'),
        onGrow: () => window.__homeNav.push('grow'),
        onTransformation: () => window.__homeNav.push('transformation'),
        onNotifications: () => window.__homeNav.push('notifications')
      });

      document.body.innerHTML = '<main id="home-root"></main>';
      const root = document.querySelector('#home-root');
      root.innerHTML = feature.html;
      window.__homeCleanup = feature.mount(root);
      window.__homeTitle = feature.title;
    };

    window.__renderHomeForV5({ locale: 'en', populated: false });
  });

  await page.waitForSelector('[data-home-assignment-state="empty"]');
  assert.equal(await page.locator('[data-home-today-composition] .bq-home-tile').count(), 5, 'Home must expose all five accepted owner-composition tiles');
  await assertDetail('[data-home-next-event-detail]', 'No upcoming events yet.');
  await assertDetail('[data-home-continue-reading-detail]', 'Open the Bible to start or continue reading.');
  await assertDetail('[data-home-latest-service-detail]', 'No confirmed latest service yet.');
  await assertDetail('[data-home-unread-notifications-count]', '0');

  const emptyGeometry = await geometry();
  assert.equal(emptyGeometry.visibleTiles, 5, 'all five Home composition tiles must be visible at 390px');
  assert.ok(emptyGeometry.scrollWidth <= emptyGeometry.innerWidth + 1, `empty Home composition overflows at 390px: ${emptyGeometry.scrollWidth} > ${emptyGeometry.innerWidth}`);

  await page.locator('[data-open-home-next-event]').click();
  await page.locator('[data-open-home-continue-reading]').click();
  await page.locator('[data-home-latest-service] [data-open-recordings]').click();
  await page.locator('[data-open-home-transformation]').click();
  await page.locator('[data-open-home-notifications]').click();
  assert.deepEqual(await page.evaluate(() => window.__homeNav), ['calendar', 'reader', 'recordings', 'transformation', 'notifications'], 'Home composition must hand off to existing owners only');

  await page.evaluate(() => window.__renderHomeForV5({ locale: 'en', populated: true }));
  await page.waitForSelector('[data-home-assignment-state="empty"]');
  await assertDetail('[data-home-next-event-detail]', '2026-09-20 · Sunday Worship');
  await assertDetail('[data-home-continue-reading-detail]', 'Genesis 3');
  await assertDetail('[data-home-latest-service-detail]', 'Sunday Service 2026-09-13');
  await assertDetail('[data-home-unread-notifications-count]', '4');
  assert.equal(await page.locator('[data-home-transformation-prompt] small').textContent(), 'View reflection', 'Transformation tile must reflect existing Transform owner state');
  const populatedGeometry = await geometry();
  assert.ok(populatedGeometry.scrollWidth <= populatedGeometry.innerWidth + 1, `populated Home composition overflows at 390px: ${populatedGeometry.scrollWidth} > ${populatedGeometry.innerWidth}`);

  await page.evaluate(() => window.__renderHomeForV5({ locale: 'tl', populated: false }));
  await page.waitForSelector('[data-home-assignment-state="empty"]');
  await assertDetail('[data-home-next-event-detail]', 'Wala pang paparating na event.');
  await assertDetail('[data-home-continue-reading-detail]', 'Buksan ang Biblia para magsimula o magpatuloy sa pagbabasa.');
  await assertDetail('[data-home-latest-service-detail]', 'Wala pang kumpirmadong pinakabagong recording ng service.');
  const tagalogGeometry = await geometry();
  assert.ok(tagalogGeometry.scrollWidth <= tagalogGeometry.innerWidth + 1, `Tagalog Home composition overflows at 390px: ${tagalogGeometry.scrollWidth} > ${tagalogGeometry.innerWidth}`);

  assert.deepEqual(pageErrors, [], `Browser page errors occurred: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Home/Today empty + populated owner composition, EN/TL, navigation handoffs, 390px overflow');

  async function assertDetail(selector, expected) {
    const actual = (await page.locator(selector).textContent())?.trim();
    assert.equal(actual, expected, `${selector} must show an intentional accepted value`);
  }

  async function geometry() {
    return page.evaluate(() => {
      const tiles = [...document.querySelectorAll('[data-home-today-composition] .bq-home-tile')];
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        visibleTiles: tiles.filter(node => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length
      };
    });
  }
} finally {
  await browser.close();
}
