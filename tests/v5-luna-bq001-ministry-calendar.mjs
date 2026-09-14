import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function proveStaticWiring() {
  const [hubService, hubFeature, bootstrap] = await Promise.all([
    fs.readFile('src/app/ministry-hub.js', 'utf8'),
    fs.readFile('src/features/ministry-hub/index.js', 'utf8'),
    fs.readFile('src/app/bootstrap.js', 'utf8'),
  ]);

  assert(/id:'calendar'[\s\S]*?route:'calendar'[\s\S]*?available:true/.test(hubService), 'Ministry Hub must expose the verified Calendar route as available.');
  assert(/data-ministry-route/.test(hubFeature) && /onNavigate\?\.\(button\.dataset\.ministryRoute\)/.test(hubFeature), 'Ministry Hub UI must delegate tool routes through its navigation callback.');
  assert(/createMinistryHubService\(\{congregation\}\)/.test(bootstrap), 'Ministry Hub must consume the canonical congregation owner.');
  assert(/createCalendarService\(\{session,privateStorage,api,assignments,congregation\}\)/.test(bootstrap), 'Calendar must consume the same canonical congregation owner.');
  assert(/'ministry-hub':\(\)=>ministryHubPage\(\{hub:ministryHub,onNavigate:route=>router\.navigate\(route\)/.test(bootstrap), 'Bootstrap must forward Ministry Hub navigation to the canonical router.');
  assert(/calendar:\(\)=>calendarPage\(\{calendar,onBack:\(\)=>router\.navigate\('more'\),onAccount:\(\)=>router\.navigate\('account'\)\}\)/.test(bootstrap), 'Bootstrap must register the canonical Calendar page route.');
}

async function proveBrowserFlow() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  try {
    await page.goto(`${BASE}tests/v5-luna-bq001-ministry-calendar.mjs`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      document.head.innerHTML = `
        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
        <link rel="stylesheet" href="/src/ui/app.css">
        <link rel="stylesheet" href="/src/ui/community.css">
        <link rel="stylesheet" href="/src/ui/community-visual-polish.css">
        <link rel="stylesheet" href="/src/ui/calendar.css">
        <link rel="stylesheet" href="/src/ui/calendar-phase-b.css">
        <link rel="stylesheet" href="/src/ui/v4-foundation.css">
        <link rel="stylesheet" href="/src/ui/ministry-ops-v4.css">
      `;
      document.body.innerHTML = '<main id="bq-luna-bq001-harness"></main>';

      const stamp = Date.now();
      const [{ createRouter }, { createMinistryHubService }, { ministryHubPage }, { calendarPage }] = await Promise.all([
        import(`/src/app/router.js?bq001=${stamp}`),
        import(`/src/app/ministry-hub.js?bq001=${stamp}`),
        import(`/src/features/ministry-hub/index.js?bq001=${stamp}`),
        import(`/src/features/calendar/index.js?bq001=${stamp}`),
      ]);

      let activeCongregationId = 'c-active';
      let activeContextMutations = 0;
      const congregation = {
        isAuthenticated: () => true,
        load: async () => [{ congregationId: activeCongregationId, role: 'member', roleKnown: true, roleLabel: 'Member', congregation: { id: activeCongregationId, name: 'Grace Active Church' } }],
        can: (id, capability) => id === activeCongregationId && capability === 'read',
        getActive: () => activeCongregationId,
        setActive: id => { activeContextMutations += 1; activeCongregationId = id; },
      };
      const hub = createMinistryHubService({ congregation });
      const calendarState = Object.freeze({
        scope: 'account-cloud', synced: true, accountUserId: 'u-member', congregationId: activeCongregationId,
        congregationName: 'Grace Active Church', canShareWithCongregation: false, agenda: [],
      });
      const calendar = {
        getState: () => calendarState,
        load: async () => calendarState,
        getAgenda: () => [],
        addEvent: async () => calendarState,
        removeEvent: async () => calendarState,
        updateCongregationEvent: async () => calendarState,
        removeCongregationEvent: async () => calendarState,
      };

      const host = document.querySelector('#bq-luna-bq001-harness');
      let cleanup = () => {};
      let router;
      const simplePage = (title, marker) => ({ title, html: `<section class="bq-panel" ${marker}><h1>${title}</h1></section>` });
      const routes = {
        home: () => simplePage('Home', 'data-bq001-home'),
        more: () => simplePage('More', 'data-bq001-more'),
        'ministry-hub': () => ministryHubPage({
          hub,
          onNavigate: route => router.navigate(route),
          onBack: () => router.navigate('more'),
          onAccount: () => router.navigate('account'),
          onCongregation: () => router.navigate('congregation'),
        }),
        calendar: () => calendarPage({ calendar, onBack: () => router.navigate('more'), onAccount: () => router.navigate('account') }),
        account: () => simplePage('Account', 'data-bq001-account'),
        congregation: () => simplePage('Congregation', 'data-bq001-congregation'),
        'not-found': () => simplePage('Not found', 'data-bq001-not-found'),
      };
      router = createRouter({
        routes,
        onRoute(route, renderPage) {
          cleanup?.();
          const view = renderPage();
          host.innerHTML = view.html;
          cleanup = view.mount?.(host) || (() => {});
          window.__bq001Route = route;
        },
      });
      history.replaceState(null, '', '#/ministry-hub');
      router.start();
      window.__bq001 = {
        router,
        getActive: () => activeCongregationId,
        getMutationCount: () => activeContextMutations,
        cleanup: () => cleanup?.(),
      };
    });

    const openCalendar = page.locator('[data-ministry-tool="calendar"] [data-ministry-route="calendar"]');
    await openCalendar.waitFor();
    const hubMetrics = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      controlHeight: document.querySelector('[data-ministry-tool="calendar"] [data-ministry-route="calendar"]')?.getBoundingClientRect().height || 0,
      route: window.__bq001Route,
      active: window.__bq001.getActive(),
    }));
    assert(hubMetrics.route === 'ministry-hub', `Expected Ministry Hub route before click, got ${hubMetrics.route}.`);
    assert(hubMetrics.active === 'c-active', 'Expected canonical active congregation before Calendar navigation.');
    assert(hubMetrics.width === 390, `Expected 390px viewport, got ${hubMetrics.width}.`);
    assert(hubMetrics.scrollWidth <= hubMetrics.width + 1, `Ministry Hub horizontal overflow: ${hubMetrics.scrollWidth}px > ${hubMetrics.width}px.`);
    assert(hubMetrics.controlHeight >= 44, `Open Calendar control is below 44px: ${hubMetrics.controlHeight}px.`);

    await openCalendar.click();
    await page.waitForFunction(() => location.hash === '#/calendar' && window.__bq001Route === 'calendar' && document.querySelector('[data-calendar-page]'));
    await page.locator('[data-calendar-page] h1').waitFor();
    const calendarMetrics = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('[data-calendar-page] button')].map(node => node.getBoundingClientRect().height).filter(Boolean);
      return {
        route: window.__bq001Route,
        hash: location.hash,
        active: window.__bq001.getActive(),
        mutations: window.__bq001.getMutationCount(),
        text: document.querySelector('[data-calendar-page]')?.textContent || '',
        scrollWidth: document.documentElement.scrollWidth,
        width: innerWidth,
        minControl: controls.length ? Math.min(...controls) : 0,
      };
    });
    assert(calendarMetrics.hash === '#/calendar' && calendarMetrics.route === 'calendar', 'Open Calendar must land on the canonical Calendar route, not Home/More.');
    assert(calendarMetrics.text.includes('Grace Active Church'), 'Calendar must retain the active congregation context presented by the shared owner.');
    assert(calendarMetrics.active === 'c-active' && calendarMetrics.mutations === 0, 'Calendar navigation must preserve, not replace, active congregation context.');
    assert(calendarMetrics.scrollWidth <= calendarMetrics.width + 1, `Calendar horizontal overflow: ${calendarMetrics.scrollWidth}px > ${calendarMetrics.width}px.`);
    assert(calendarMetrics.minControl >= 44, `Calendar has a visible control below 44px: ${calendarMetrics.minControl}px.`);

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => location.hash === '#/ministry-hub' && window.__bq001Route === 'ministry-hub' && document.querySelector('[data-ministry-tool="calendar"]'));
    assert(await page.locator('[data-ministry-tool="calendar"] [data-ministry-route="calendar"]').count() === 1, 'Browser Back must return coherently to Ministry Hub with Calendar still available.');
    assert((await page.evaluate(() => window.__bq001.getActive())) === 'c-active', 'Browser Back must preserve active congregation context.');
    assert(errors.length === 0, `Unexpected browser/page errors: ${errors.join(' | ')}`);
  } finally {
    await page.evaluate(() => window.__bq001?.cleanup?.()).catch(() => {});
    await browser.close();
  }
}

await proveStaticWiring();
await proveBrowserFlow();
console.log('V5 Luna BQ-001 Ministry Hub -> Calendar regression proof passed (STATIC + BROWSER-AUTO).');
