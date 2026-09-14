import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
try {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const { calendarPage } = await import('/src/features/calendar/index.js');
    document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="/src/ui/calendar.css">');
    const requests = [];
    const state = {
      owner: 'account:leader-1', accountUserId: 'leader-1', scope: 'account-cloud',
      canShareWithCongregation: true, congregationId: 'cong-active', congregationName: 'Active Church',
      events: [], agenda: []
    };
    const build = ({ startDate, days }) => {
      requests.push({ start: new Date(startDate).toISOString().slice(0, 10), days });
      const start = new Date(startDate);
      return Array.from({ length: days }, (_, index) => {
        const date = new Date(start); date.setUTCDate(date.getUTCDate() + index);
        const iso = date.toISOString().slice(0, 10);
        const events = index === 9 ? [
          { id: `a-${iso}`, source: 'assignment', date: iso, title: 'Read Romans' },
          { id: `c-${iso}`, source: 'congregation', date: iso, title: 'Church service', ownerId: 'leader-2' },
          { id: `p-${iso}`, source: 'personal', date: iso, title: 'Prayer reminder' }
        ] : [];
        return { date: iso, events };
      });
    };
    const calendar = {
      getState: () => state,
      load: async () => state,
      getAgenda: build,
      addEvent: async () => state,
      removeEvent: async () => state,
      updateCongregationEvent: async () => state,
      removeCongregationEvent: async () => state
    };
    document.body.innerHTML = '<main id="calendar-root"></main>';
    const root = document.querySelector('#calendar-root');
    const feature = calendarPage({ calendar });
    root.innerHTML = feature.html;
    feature.mount(root);
    window.__bqCalendarRequests = requests;
  });

  await page.waitForSelector('.bq-calendar-grid-day');
  assert.equal(await page.locator('.bq-calendar-grid-day').count(), 42, 'month view must render exactly 42 day cells');
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Assignment').count(), 1);
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Congregation').count(), 1);
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Personal').count(), 1);

  const firstHeading = await page.locator('.bq-calendar-month-toolbar h2').textContent();
  await page.locator('[data-calendar-month-next]').click();
  const nextHeading = await page.locator('.bq-calendar-month-toolbar h2').textContent();
  assert.notEqual(nextHeading, firstHeading, 'next month control must change the visible month');
  const requests = await page.evaluate(() => window.__bqCalendarRequests);
  assert.ok(requests.length >= 2 && requests.every(request => request.days === 42), 'visible months must request complete 42-day horizons');

  const day = page.locator('.bq-calendar-grid-day').nth(9);
  const selectedDate = await day.getAttribute('data-calendar-day');
  await day.click();
  assert.equal(await day.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[name="eventDate"]').inputValue(), selectedDate, 'selected day must drive the add-event date');
  assert.ok((await day.getAttribute('aria-label'))?.includes('3 events'), 'day accessibility label must summarize its events');

  const geometry = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
  assert.ok(geometry.scrollWidth <= geometry.innerWidth, `390px Calendar must not overflow: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  for (const selector of ['[data-calendar-month-prev]', '[data-calendar-month-next]', '[data-calendar-today]']) {
    const box = await page.locator(selector).boundingBox();
    assert.ok(box && box.height >= 44, `${selector} must remain at least 44px high`);
  }
  const dayBox = await page.locator('.bq-calendar-grid-day').first().boundingBox();
  assert.ok(dayBox && dayBox.height >= 44, 'mobile day targets must remain touch-safe');

  console.log('BROWSER-AUTO PASS: 42-day month horizon, navigation, day selection, categories, 390px overflow/touch targets');
} finally {
  await browser.close();
}
