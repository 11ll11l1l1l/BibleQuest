import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const assertNoOverflow = async label => {
  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `${label} overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
};

try {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  await page.locator('[data-locale-select]').waitFor();
  await page.locator('[data-locale-select]').selectOption('ceb');
  await page.waitForFunction(() => document.querySelector('[data-bq-shell="v3"]')?.dataset.locale === 'ceb');

  const shell = await page.evaluate(() => ({
    learn: document.querySelector('[data-route-link="learn"] small')?.textContent?.trim(),
    play: document.querySelector('[data-route-link="play"] small')?.textContent?.trim(),
    grow: document.querySelector('[data-route-link="grow"] small')?.textContent?.trim(),
    more: document.querySelector('[data-route-link="more"] small')?.textContent?.trim(),
    tagline: document.querySelector('.bq-brand small')?.textContent?.trim(),
    session: document.querySelector('[data-session-label]')?.textContent?.trim(),
    localeHeight: document.querySelector('[data-locale-select]')?.getBoundingClientRect().height || 0,
    accountHeight: document.querySelector('[data-session-open]')?.getBoundingClientRect().height || 0,
  }));
  assert.equal(shell.learn, 'Pagtuon');
  assert.equal(shell.play, 'Dula');
  assert.equal(shell.grow, 'Pagtubo');
  assert.equal(shell.more, 'Dugang');
  assert.equal(shell.tagline, 'Basa · Pagtuon · Pagtubo');
  assert.equal(shell.session, 'Bisita');
  assert.ok(shell.localeHeight >= 44 && shell.accountHeight >= 44, 'Cebuano shell touch targets must remain at least 44px');
  await assertNoOverflow('Cebuano shell');
  for (const leak of ['Learn', 'Play', 'Grow', 'More', 'Primary navigation', 'Guest']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `shell leaked English UI: ${leak}`);
  }

  // Community: representative ready member state with runtime data preserved.
  await page.evaluate(async () => {
    const [{ communityPage }, { localization }] = await Promise.all([
      import('/src/features/community/index.js'),
      import('/src/app/localization.js'),
    ]);
    localization.setLocale('ceb');
    const bridge = { load: async () => ({
      status: 'ready',
      congregations: [{ name: 'Runtime Congregation', roleLabel: 'Runtime Role', canMinistry: false }],
      groups: [{ name: 'Runtime Group', role: 'Runtime Facilitator', memberCount: 4, maxMembers: 8 }],
      encouragementCount: 2,
    }) };
    document.body.innerHTML = '<main id="surface-root"></main>';
    const root = document.querySelector('#surface-root');
    const feature = communityPage({ bridge, onNavigate() {}, onBack() {}, onAccount() {} });
    root.innerHTML = feature.html;
    feature.mount(root);
  });
  await page.waitForSelector('.bq-community-summary');
  assert.equal(await page.getByText('Magtubo nga magkuyog nga dili ibutyag ang pribadong pagtuon.', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Unsay magpabiling bulag', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Runtime Congregation', { exact: true }).count(), 1);
  for (const leak of ['Grow together without exposing private study.', 'What stays separate', 'Back to More', 'Assignments']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Community leaked English UI: ${leak}`);
  }
  const communityControls = await page.evaluate(() => [...document.querySelectorAll('[data-community-route], [data-community-back]')].map(node => node.getBoundingClientRect().height).filter(Boolean));
  assert.ok(communityControls.length >= 8 && Math.min(...communityControls) >= 44, 'Cebuano Community controls must remain accessible touch targets');
  await assertNoOverflow('Cebuano Community');

  // Account/settings: signed-in member state and error/status copy owner.
  await page.evaluate(async () => {
    const [{ accountPage }, { localization }] = await Promise.all([
      import('/src/features/account/index.js'),
      import('/src/app/localization.js'),
    ]);
    localization.setLocale('ceb');
    const session = { getState: () => ({ authenticated: true, user: { displayName: 'Runtime Member', email: 'member@example.test' } }), signOut: async () => {} };
    const account = {
      listDevices: async () => [{ id: 'current', label: 'Runtime Phone', platform: 'Android Runtime', current: true }],
      removeDevice: async () => {},
      issueRecoveryCode: async () => ({ recovery_code: 'BQ-TEST-CODE' }),
      changePassword: async () => {},
    };
    document.body.innerHTML = '<main id="surface-root"></main>';
    const root = document.querySelector('#surface-root');
    const feature = accountPage({ account, session, onHome() {} });
    root.innerHTML = feature.html;
    feature.mount(root);
  });
  await page.waitForSelector('[data-issue-recovery]');
  assert.equal(await page.getByText('Imong mga device', { exact: true }).count() >= 1, true);
  assert.equal(await page.getByText('Seguridad', { exact: true }).count() >= 1, true);
  assert.equal(await page.getByText('Runtime Member', { exact: true }).count(), 1);
  for (const leak of ['Remembered devices', 'Security & recovery', 'Generate new recovery code', 'Change password', 'Return home']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Account leaked English UI: ${leak}`);
  }
  const accountControls = await page.evaluate(() => [...document.querySelectorAll('[data-issue-recovery], [data-account-password] button, [data-account-home], [data-account-signout], [data-device-remove]')].map(node => node.getBoundingClientRect().height).filter(Boolean));
  assert.ok(accountControls.length >= 4 && Math.min(...accountControls) >= 44, 'Cebuano Account controls must remain accessible touch targets');
  await assertNoOverflow('Cebuano Account');

  // Calendar: translated month/category/member controls at 390px.
  await page.evaluate(async () => {
    const [{ calendarPage }, { localization }] = await Promise.all([
      import('/src/features/calendar/index.js'),
      import('/src/app/localization.js'),
    ]);
    localization.setLocale('ceb');
    const state = { owner: 'account:user-1', accountUserId: 'user-1', scope: 'account-cloud', canShareWithCongregation: true, congregationId: 'cong-1', congregationName: 'Runtime Church', events: [], agenda: [] };
    const build = ({ startDate, days }) => {
      const start = new Date(startDate);
      return Array.from({ length: days }, (_, index) => {
        const date = new Date(start);
        date.setUTCDate(date.getUTCDate() + index);
        const iso = date.toISOString().slice(0, 10);
        const events = index === 9 ? [
          { id: `a-${iso}`, source: 'assignment', date: iso, title: 'Runtime Assignment' },
          { id: `c-${iso}`, source: 'congregation', date: iso, title: 'Runtime Service', ownerId: 'leader-1' },
        ] : [];
        return { date: iso, events };
      });
    };
    const calendar = { getState: () => state, load: async () => state, getAgenda: build, addEvent: async () => state, removeEvent: async () => state, updateCongregationEvent: async () => state, removeCongregationEvent: async () => state };
    document.body.innerHTML = '<main id="surface-root"></main>';
    const root = document.querySelector('#surface-root');
    const feature = calendarPage({ calendar });
    root.innerHTML = feature.html;
    feature.mount(root);
  });
  await page.waitForSelector('.bq-calendar-grid-day');
  assert.equal((await page.locator('.bq-calendar-intro h1').textContent())?.trim(), 'Plano sa bulan');
  assert.equal(await page.locator('.bq-calendar-month').getAttribute('aria-label'), 'Kalendaryo sa bulan');
  assert.equal(await page.locator('[data-calendar-month-prev]').getAttribute('aria-label'), 'Miaging bulan');
  assert.equal(await page.locator('[data-calendar-month-next]').getAttribute('aria-label'), 'Sunod nga bulan');
  assert.equal(await page.locator('.bq-calendar-legend').getByText('Buluhaton', { exact: true }).count(), 1);
  for (const leak of ['Month planner', 'Previous month', 'Next month', 'Calendar categories', 'SELECTED DAY', 'No events']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Calendar leaked English UI: ${leak}`);
  }
  const calendarGeometry = await page.evaluate(() => ({
    controls: [...document.querySelectorAll('[data-calendar-month-prev], [data-calendar-month-next], [data-calendar-today], .bq-calendar-grid-day')].map(node => node.getBoundingClientRect().height).filter(Boolean),
  }));
  assert.ok(calendarGeometry.controls.length > 10 && Math.min(...calendarGeometry.controls) >= 44, 'Cebuano Calendar controls must remain accessible touch targets');
  await assertNoOverflow('Cebuano Calendar');

  // Videos/Recordings: complete CEB dictionary including previously inherited states.
  await page.evaluate(async () => {
    const [{ recordingsPage }, { localization }] = await Promise.all([
      import('/src/features/recordings/index.js'),
      import('/src/app/localization.js'),
    ]);
    localization.setLocale('ceb');
    const rows = [
      { id: 'v1', title: 'Runtime Worship', description: 'Runtime description', featured: true },
      { id: 'v2', title: 'Runtime Study', description: 'Runtime study description', featured: false },
    ];
    let state = { status: 'ready', rows, selectedId: null };
    const recordings = { load: async () => state, getState: () => state, select: id => { state = { ...state, selectedId: id }; }, addVideo: async () => state, leave() {} };
    document.body.innerHTML = '<main id="surface-root"></main>';
    const root = document.querySelector('#surface-root');
    const feature = recordingsPage({ recordings, onHome() {}, onAccount() {} });
    root.innerHTML = feature.html;
    feature.mount(root);
  });
  await page.waitForSelector('[data-video-select]');
  assert.equal((await page.locator('.bq-recordings-head h1').textContent())?.trim(), 'Mga video sa pagsimba ug pagtuon sa Bibliya');
  assert.equal((await page.locator('[data-video-curator-toggle]').textContent())?.trim(), 'Dugang og video');
  assert.equal(await page.getByText('Runtime Worship', { exact: true }).count(), 1);
  for (const leak of ['Worship and Bible study videos', 'Choose a video', 'No videos yet', 'Back home', 'Add a video']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Videos leaked English UI: ${leak}`);
  }
  const videoControls = await page.evaluate(() => [...document.querySelectorAll('[data-video-select], [data-video-curator-toggle], [data-recordings-home], [data-recordings-search], [data-recordings-feature-filter]')].map(node => node.getBoundingClientRect().height).filter(Boolean));
  assert.ok(videoControls.length >= 5 && Math.min(...videoControls) >= 44, 'Cebuano Videos controls must remain accessible touch targets');
  await assertNoOverflow('Cebuano Videos');

  // BibleQuest-authored weekly member content.
  await page.evaluate(async () => {
    const [{ homeThisWeekIntroHtml }, { localization }] = await Promise.all([
      import('/src/features/home/today-this-week.js'),
      import('/src/app/localization.js'),
    ]);
    localization.setLocale('ceb');
    document.body.innerHTML = `<main id="surface-root">${homeThisWeekIntroHtml('ceb')}</main>`;
  });
  assert.equal(await page.getByText('HISGOTAN SA PANIHAPON · OPSYONAL', { exact: true }).count(), 1);
  assert.equal(await page.getByText(/Unsay gipakita sa Dios kanato karong semanaha/).count(), 1);
  for (const leak of ['THIS WEEK', 'Keep your week connected', 'ASK AT DINNER · OPTIONAL', 'What did God show us this week']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Weekly journey leaked English UI: ${leak}`);
  }
  const weeklyControls = await page.evaluate(() => [...document.querySelectorAll('[data-weekly-journey-route], [data-open-this-week-calendar]')].map(node => node.getBoundingClientRect().height).filter(Boolean));
  assert.ok(weeklyControls.length >= 6 && Math.min(...weeklyControls) >= 44, 'Cebuano weekly journey controls must remain accessible touch targets');
  await assertNoOverflow('Cebuano weekly journey');

  assert.deepEqual(pageErrors, [], `Cebuano browser matrix emitted page errors: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Cebuano shell + Community + Account + Calendar + Videos + weekly authored content at 390px');
} finally {
  await browser.close();
}
