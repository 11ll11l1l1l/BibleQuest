import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { CSP_POLICY } from '../../scripts/v6-csp-policy.mjs';

const base = new URL(process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173');
const routes = ['/', '/admin.html', '/admin-operations.html', '/content-review.html', '/transform.html', '/psychometrics.html', '/reset.html', '/classic.html', '/v5-push-device-field.html'];
const browser = await chromium.launch({ headless: true });
const failures = [];

async function architectureProbe(page) {
  await page.evaluate(async () => {
    const pending = [];
    try { pending.push(fetch('https://zkfmgezvzugchcwppreq.supabase.co/rest/v1/').catch(() => null)); } catch {}
    try { pending.push(fetch('https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3', { headers: { Range: 'bytes=0-0' } }).catch(() => null)); } catch {}
    try { pending.push(fetch('https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/base.dat.gz').catch(() => null)); } catch {}
    try {
      const socket = new WebSocket('wss://zkfmgezvzugchcwppreq.supabase.co/realtime/v1/websocket?apikey=invalid&vsn=1.0.0');
      setTimeout(() => { try { socket.close(); } catch {} }, 500);
    } catch {}
    try {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.append(script);
    } catch {}
    try {
      const frame = document.createElement('iframe');
      frame.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      frame.hidden = true;
      document.body.append(frame);
    } catch {}
    try {
      const image = document.createElement('img');
      image.src = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
      image.hidden = true;
      document.body.append(image);
    } catch {}
    try {
      const audio = document.createElement('audio');
      audio.src = 'https://openbible.com/audio/hays/BSB_01_Gen_001_H.mp3';
      audio.preload = 'metadata';
      document.body.append(audio);
      audio.load();
    } catch {}
    try {
      const blob = new Blob(['self.onmessage=()=>{}'], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      const worker = new Worker(url);
      worker.terminate();
      URL.revokeObjectURL(url);
    } catch {}
    try { await navigator.serviceWorker?.register('/offline-shell-sw.js'); } catch {}
    await Promise.race([Promise.allSettled(pending), new Promise(resolve => setTimeout(resolve, 1200))]);
  });
}

try {
  for (const pathname of routes) {
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await context.newPage();
    await page.addInitScript(() => {
      globalThis.__bqCspViolations = [];
      document.addEventListener('securitypolicyviolation', event => {
        globalThis.__bqCspViolations.push({
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
          disposition: event.disposition,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
        });
      });
    });
    await page.route(`${base.origin}/**`, async route => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': CSP_POLICY },
      });
    });
    const response = await page.goto(new URL(pathname, base).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(response?.ok(), `${pathname}: built route did not load`);
    if (pathname === '/') await architectureProbe(page);
    await page.waitForTimeout(1500);
    const violations = await page.evaluate(() => globalThis.__bqCspViolations ?? []);
    if (violations.length) failures.push({ pathname, violations });
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) console.error(JSON.stringify(failures, null, 2));
assert.deepEqual(failures, [], 'enforcing CSP produced built-artifact browser violations');
console.log(JSON.stringify({ policy: CSP_POLICY, routes, violations: 0 }, null, 2));
