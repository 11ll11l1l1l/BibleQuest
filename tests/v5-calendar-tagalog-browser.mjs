import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
try {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ calendarPage }, { localization }] = await Promise.all([
      import('/src/features/calendar/index.js'),
      import('/src/app/localization.js')
    ]);
    localization.setLocale('tl');
    document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="/src/ui/calendar.css">');
    const state = {
      owner: 'account:leader-1', accountUserId: 'leader-1', scope: 'account-cloud',
      canShareWithCongregation: true, congregationId: 'cong-active', congregationName: 'ICAC Tsukuba',
      events: [], agenda: []
    };
    const build = ({ startDate, days }) => {
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
    window.__bqCalendarFeatureTitle = feature.title;
  });

  await page.waitForSelector('.bq-calendar-grid-day');
  assert.equal(await page.evaluate(() => window.__bqCalendarFeatureTitle), 'Kalendaryo');
  assert.equal((await page.locator('.bq-calendar-intro h1').textContent())?.trim(), 'Buwanang plano');
  assert.equal((await page.locator('[data-calendar-today]').textContent())?.trim(), 'Ngayon');
  assert.equal(await page.locator('.bq-calendar-month').getAttribute('aria-label'), 'Buwanang kalendaryo');
  assert.equal(await page.locator('[data-calendar-month-prev]').getAttribute('aria-label'), 'Nakaraang buwan');
  assert.equal(await page.locator('[data-calendar-month-next]').getAttribute('aria-label'), 'Susunod na buwan');
  assert.equal(await page.locator('.bq-calendar-legend').getAttribute('aria-label'), 'Mga kategorya ng kalendaryo');
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Gawain', { exact: true }).count(), 1);
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Kongregasyon', { exact: true }).count(), 1);
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Personal', { exact: true }).count(), 1);
  assert.equal((await page.locator('[data-calendar-add] button[type="submit"]').textContent())?.trim(), 'Magdagdag ng event');
  assert.equal(await page.locator('[name="title"]').getAttribute('aria-label'), 'Pamagat ng event');
  assert.equal(await page.locator('[name="eventDate"]').getAttribute('aria-label'), 'Petsa ng event');
  assert.equal((await page.locator('.bq-calendar-agenda h2').textContent())?.trim(), 'Susunod na 30 araw');

  const day = page.locator('.bq-calendar-grid-day').nth(9);
  const selectedDate = await day.getAttribute('data-calendar-day');
  await day.click();
  assert.equal(await day.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[name="eventDate"]').inputValue(), selectedDate);
  const dayAria = await day.getAttribute('aria-label');
  assert.ok(dayAria?.includes('3 event:'), `Tagalog event summary missing from day aria-label: ${dayAria}`);
  const dayText = (await day.textContent()) || '';
  assert.ok(dayText.includes('Gawain:') && dayText.includes('Kongregasyon:') && dayText.includes('Personal:'), `localized category labels missing from day cell: ${dayText}`);
  assert.ok(dayText.includes('Read Romans') && dayText.includes('Church service') && dayText.includes('Prayer reminder'), `source event titles must remain unchanged: ${dayText}`);

  const initialHeading = await page.locator('.bq-calendar-month-toolbar h2').textContent();
  await page.locator('[data-calendar-month-next]').click();
  assert.notEqual(await page.locator('.bq-calendar-month-toolbar h2').textContent(), initialHeading, 'localized next-month control must remain functional');

  for (const leak of ['Month planner','Previous month','Next month','Calendar categories','SELECTED DAY','Add event','Next 30 days','Nothing in the next 30 days.']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Calendar exposes migrated English UI text: ${leak}`);
  }

  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    minToolbarHeight: Math.min(...[...document.querySelectorAll('[data-calendar-month-prev], [data-calendar-month-next], [data-calendar-today]')].map(node => node.getBoundingClientRect().height)),
    minDayHeight: Math.min(...[...document.querySelectorAll('.bq-calendar-grid-day')].map(node => node.getBoundingClientRect().height))
  }));
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `Tagalog Calendar overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minToolbarHeight >= 44, `Calendar toolbar control regressed below 44px: ${geometry.minToolbarHeight}`);
  assert.ok(geometry.minDayHeight >= 44, `Calendar day target regressed below 44px: ${geometry.minDayHeight}`);
  assert.deepEqual(pageErrors, [], `Browser page errors occurred: ${pageErrors.join(' | ')}`);

  console.log('BROWSER-AUTO PASS: Tagalog Calendar month-grid, interaction, source-data preservation, 390px accessibility/overflow');
} finally {
  await browser.close();
}