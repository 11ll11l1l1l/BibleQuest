import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function coreServiceFlow(page) {
  const result = await page.evaluate(async () => {
    const [{ createStore }, { storage }] = await Promise.all([
      import('/src/app/store.js'),
      import('/src/core/storage.js')
    ]);

    const store = createStore({ route: 'home', count: 0 });
    let notifications = 0;
    const unsubscribe = store.subscribe(() => notifications++);
    store.setState(current => ({ ...current, route: 'learn', count: current.count + 1 }));
    unsubscribe();
    store.setState(current => ({ ...current, count: current.count + 1 }));

    storage.write('smoke', { ok: true, value: 7 });
    const stored = storage.read('smoke');
    localStorage.setItem('biblequest.v3.corrupt', '{not-json');
    const corruptFallback = storage.read('corrupt', { safe: true });
    localStorage.setItem('unrelated.key', 'keep');
    storage.remove('smoke');

    return { state: store.getState(), notifications, frozen: Object.isFrozen(store.getState()), stored, corruptFallback, unrelated: localStorage.getItem('unrelated.key'), removed: storage.read('smoke', null) };
  });

  assert(result.state.route === 'learn' && result.state.count === 2, 'Global store state transitions failed.');
  assert(result.notifications === 1, 'Global store subscription/unsubscribe contract failed.');
  assert(result.frozen, 'Global store snapshots must be frozen.');
  assert(result.stored?.ok === true && result.stored?.value === 7, 'Storage write/read contract failed.');
  assert(result.corruptFallback?.safe === true, 'Storage malformed-data recovery failed.');
  assert(result.unrelated === 'keep', 'Storage boundary modified an unrelated browser key.');
  assert(result.removed === null, 'Storage remove contract failed.');
}

async function sessionServiceFlow(page) {
  const result = await page.evaluate(async () => {
    const [{ createStore }, { createSessionService }] = await Promise.all([import('/src/app/store.js'), import('/src/app/session.js')]);
    let current = null;
    let signOutScope = '';
    const listeners = new Set();
    const makeSession = (expiresAt = Math.floor(Date.now() / 1000) + 3600) => ({ access_token: 'test-token', expires_at: expiresAt, user: { id: 'user-1', email: 'learner@example.com', user_metadata: { preferred_name: 'Learner' } } });
    const emit = (event, session) => listeners.forEach(listener => listener(event, session));
    const auth = {
      enabled: () => true,
      async subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      async getSession() { return { session: current }; },
      async getUser() { return { user: current?.user || null }; },
      async signIn(email, password) { if (email !== 'learner@example.com' || password !== 'correct-password') throw new Error('Invalid login credentials'); current = makeSession(); emit('SIGNED_IN', current); return { session: current, user: current.user }; },
      async signOut() { signOutScope = 'local'; current = null; emit('SIGNED_OUT', null); }
    };
    const storeA = createStore({ session: null });
    const serviceA = createSessionService({ auth, store: storeA });
    await serviceA.boot();
    const bootGuest = serviceA.getState();
    let invalidMessage = '';
    try { await serviceA.signIn('learner@example.com', 'wrong'); } catch (error) { invalidMessage = error.message; }
    const afterInvalid = serviceA.getState();
    await serviceA.signIn('learner@example.com', 'correct-password');
    const signedIn = serviceA.getState();
    const storeB = createStore({ session: null });
    const serviceB = createSessionService({ auth, store: storeB });
    await serviceB.boot();
    const reloaded = serviceB.getState();
    current = makeSession(Math.floor(Date.now() / 1000) - 5);
    emit('TOKEN_REFRESHED', current);
    const expired = serviceB.getState();
    current = makeSession();
    emit('SIGNED_IN', current);
    await serviceB.signOut();
    const signedOut = serviceB.getState();
    serviceA.dispose(); serviceB.dispose();
    return { bootGuest, invalidMessage, afterInvalid, signedIn, reloaded, expired, signedOut, signOutScope, listenersRemaining: listeners.size };
  });
  assert(result.bootGuest.status === 'guest' && result.bootGuest.authenticated === false, 'Session boot must resolve to guest without a saved session.');
  assert(/invalid/i.test(result.invalidMessage), 'Invalid login must return a controlled auth error.');
  assert(result.afterInvalid.status === 'guest' && result.afterInvalid.authenticated === false, 'Invalid login must not create an authenticated state.');
  assert(result.signedIn.status === 'authenticated' && result.signedIn.user?.email === 'learner@example.com', 'Valid login did not create authenticated state.');
  assert(result.reloaded.status === 'authenticated', 'Saved session did not survive service recreation/reload semantics.');
  assert(result.expired.status === 'guest' && /expired/i.test(result.expired.error), 'Expired session did not fall back to guest.');
  assert(result.signedOut.status === 'guest' && result.signedOut.authenticated === false, 'Logout did not return to guest.');
  assert(result.signOutScope === 'local', 'Logout contract must be local-device scoped.');
  assert(result.listenersRemaining === 0, 'Session service did not clean up auth subscriptions.');
}

async function desktopFlow() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor();
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Shell must mount exactly once.');
  assert((await page.locator('h1').first().textContent())?.trim() === 'BibleQuest', 'Home must render BibleQuest heading.');
  await page.locator('[data-session-label]', { hasText: 'Guest' }).waitFor();
  await coreServiceFlow(page); await sessionServiceFlow(page);
  await page.locator('[data-session-open]').click(); await page.waitForURL(/#\/account$/);
  assert((await page.locator('h1').first().textContent())?.trim() === 'Sign in', 'Guest account page did not render.');
  await page.locator('input[name="email"]').fill('learner@example.com'); await page.locator('input[name="password"]').fill('not-a-real-password');
  await page.locator('[data-account-login] button[type="submit"]').click(); await page.locator('[data-auth-message]', { hasText: 'local preview' }).waitFor();
  await page.locator('[data-account-guest]').click(); await page.waitForURL(/#\/home$/);
  await page.locator('[data-route-link="learn"]').click(); await page.waitForURL(/#\/learn$/); await page.locator('h1', { hasText: 'Learn' }).waitFor();
  assert(await page.locator('[data-route-link="learn"][aria-current]').count() === 1, 'Active nav state missing for Learn.');
  await page.reload({ waitUntil: 'networkidle' }); await page.locator('[data-session-label]', { hasText: 'Guest' }).waitFor();
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Deep-link reload did not preserve Learn route.');
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Reload created duplicate shell.');
  await page.locator('[data-route-link="play"]').click(); await page.locator('h1', { hasText: 'Play' }).waitFor(); await page.goBack(); await page.waitForURL(/#\/learn$/); await page.locator('h1', { hasText: 'Learn' }).waitFor();
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Browser back did not restore Learn.');
  await page.goForward(); await page.waitForURL(/#\/play$/); await page.locator('h1', { hasText: 'Play' }).waitFor();
  assert((await page.locator('h1').first().textContent())?.trim() === 'Play', 'Browser forward did not restore Play.');
  await page.goto(`${BASE}#/does-not-exist`, { waitUntil: 'networkidle' });
  assert((await page.locator('h1').first().textContent())?.trim() === 'Page not found', 'Unknown route did not use controlled not-found state.');
  await page.close();
}

async function mobileFlow() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'networkidle' }); await page.locator('[data-bq-shell="v3"]').waitFor(); await page.locator('[data-session-label]', { hasText: 'Guest' }).waitFor();
  const metrics = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, navHeight: document.querySelector('.bq-nav')?.getBoundingClientRect().height || 0, accountWidth: document.querySelector('[data-session-open]')?.getBoundingClientRect().width || 0 }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`); assert(metrics.navHeight >= 60, 'Mobile primary navigation is too small or missing.'); assert(metrics.accountWidth >= 44, 'Mobile account/session control is too small.');
  await page.locator('[data-session-open]').click(); await page.waitForURL(/#\/account$/); assert(await page.locator('[data-account-guest]').count() === 1, 'Mobile guest account action is missing.'); await page.locator('[data-account-guest]').click();
  for (const route of ['home','learn','play','grow','more']) { await page.locator(`[data-route-link="${route}"]`).click(); await page.waitForURL(new RegExp(`#/${route}$`)); await page.locator('h1').waitFor(); assert(await page.locator(`[data-route-link="${route}"][aria-current]`).count() === 1, `Mobile active nav missing for ${route}.`); }
  await page.close();
}

try { await desktopFlow(); await mobileFlow(); console.log('BibleQuest v3 auth/session + foundation browser regression passed.'); } finally { await browser.close(); }
