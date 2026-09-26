import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const apiSource = fs.readFileSync(new URL('../../src/core/api.js', import.meta.url), 'utf8');
const pushSource = fs.readFileSync(new URL('../../src/app/push-subscription.js', import.meta.url), 'utf8');
const youtubeSource = fs.readFileSync(new URL('../../src/v6/media/youtube-iframe-adapter.ts', import.meta.url), 'utf8');
const headersSource = fs.readFileSync(new URL('../../_headers', import.meta.url), 'utf8');
const inventory = fs.readFileSync(new URL('../../docs/v6/V6_CSP_COMPATIBILITY.md', import.meta.url), 'utf8');
const provisionalPolicy = inventory.match(/## Provisional report-only policy shape[\s\S]*?```\n([\s\S]*?)\n```/)?.[1] ?? '';

const standalonePages = Object.freeze({
  index: fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8'),
  transform: fs.readFileSync(new URL('../../transform.html', import.meta.url), 'utf8'),
  psychometrics: fs.readFileSync(new URL('../../psychometrics.html', import.meta.url), 'utf8'),
  admin: fs.readFileSync(new URL('../../admin.html', import.meta.url), 'utf8'),
  adminOperations: fs.readFileSync(new URL('../../admin-operations.html', import.meta.url), 'utf8'),
  contentReview: fs.readFileSync(new URL('../../content-review.html', import.meta.url), 'utf8'),
});

function countInlineScripts(source: string): number {
  return [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/\bsrc\s*=/.test(match[1]) && match[2].trim().length > 0)
    .length;
}

function countInlineStyleBlocks(source: string): number {
  return [...source.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].length;
}

test('CSP inventory tracks the exact Supabase client, project HTTPS origin, and Realtime WSS origin', () => {
  assert.match(apiSource, /https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^'"]+\/\+esm/);
  const match = apiSource.match(/supabaseUrl:\s*['"](https:\/\/([a-z0-9]+)\.supabase\.co)['"]/);
  assert.ok(match, 'BibleQuest Supabase project origin must remain explicit in the client boundary');
  const httpsOrigin = match[1];
  const projectRef = match[2];

  assert.match(apiSource, /\.channel\(/, 'Realtime usage requires WebSocket compatibility evidence');
  assert.ok(inventory.includes('https://cdn.jsdelivr.net'));
  assert.ok(inventory.includes(httpsOrigin));
  assert.ok(inventory.includes(`wss://${projectRef}.supabase.co`));
  assert.doesNotMatch(provisionalPolicy, /\*\.supabase\.co/);
});

test('CSP inventory preserves the official YouTube player contract without wildcarding provider origins', () => {
  assert.match(youtubeSource, /kind:\s*'youtube'/);
  assert.match(youtubeSource, /new api\.Player\(/);
  assert.match(youtubeSource, /enablejsapi:\s*1/);

  assert.ok(inventory.includes('https://www.youtube.com'));
  assert.doesNotMatch(provisionalPolicy, /https:\/\/\*\.youtube\.com/);
});

test('Web Push remains browser-managed and does not justify arbitrary connect-src endpoints', () => {
  assert.match(pushSource, /pushManager\.subscribe\(/);
  assert.match(pushSource, /persistence\.save\(/);
  assert.doesNotMatch(pushSource, /\bfetch\s*\(/);

  assert.match(inventory, /browser-managed Web Push delivery is not an application fetch allowlist/i);
});

test('CSP tranche is characterization-only until report-only browser evidence exists', () => {
  assert.doesNotMatch(headersSource, /^\s*Content-Security-Policy\s*:/mi);
  assert.doesNotMatch(headersSource, /^\s*Content-Security-Policy-Report-Only\s*:/mi);

  assert.match(inventory, /NOT an enforcement authorization/);
  assert.match(inventory, /inline script\/style inventory/i);
  assert.match(inventory, /unsafe DOM sinks/i);
  assert.match(inventory, /report-only policy/i);
  assert.match(inventory, /built-artifact Chromium/i);
  assert.match(inventory, /checkbox remains open/i);
});

test('provisional CSP shape is least-broad for currently evidenced remote origins', () => {
  assert.ok(provisionalPolicy, 'inventory must expose a provisional report-only policy block');
  assert.match(provisionalPolicy, /default-src 'self';/);
  assert.match(provisionalPolicy, /script-src 'self' https:\/\/cdn\.jsdelivr\.net https:\/\/www\.youtube\.com;/);
  assert.match(
    provisionalPolicy,
    /connect-src 'self' https:\/\/zkfmgezvzugchcwppreq\.supabase\.co wss:\/\/zkfmgezvzugchcwppreq\.supabase\.co;/,
  );
  assert.match(provisionalPolicy, /frame-src 'self' https:\/\/www\.youtube\.com;/);
  assert.match(provisionalPolicy, /object-src 'none';/);
  assert.match(provisionalPolicy, /frame-ancestors 'self';/);
});


test('standalone HTML inline-block budget fails closed on new CSP compatibility debt', () => {
  const inlineBlockBudget = { index:[0,0], transform:[1,1], psychometrics:[1,1], admin:[0,0], adminOperations:[0,0], contentReview:[0,0] } as const;
  for (const [page, source] of Object.entries(standalonePages)) {
    const [scripts, styles] = inlineBlockBudget[page as keyof typeof inlineBlockBudget];
    assert.equal(countInlineScripts(source), scripts, `${page}: inline script block count changed`);
    assert.equal(countInlineStyleBlocks(source), styles, `${page}: inline style block count changed`);
  }

  assert.match(standalonePages.contentReview, /https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.112\.4/);
  assert.match(inventory, /`transform\.html`:[^\n]*inline script body[^\n]*inline `<style>` block/i);
  assert.match(inventory, /`psychometrics\.html`:[^\n]*inline script body[^\n]*inline `<style>` block/i);
  assert.match(inventory, /not.*blanket.*unsafe-inline/is);
});
