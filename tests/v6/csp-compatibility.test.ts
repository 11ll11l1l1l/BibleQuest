import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const apiSource = fs.readFileSync(new URL('../../src/core/api.js', import.meta.url), 'utf8');
const pushSource = fs.readFileSync(new URL('../../src/app/push-subscription.js', import.meta.url), 'utf8');
const youtubeSource = fs.readFileSync(new URL('../../src/v6/media/youtube-iframe-adapter.ts', import.meta.url), 'utf8');
const headersSource = fs.readFileSync(new URL('../../_headers', import.meta.url), 'utf8');
const inventory = fs.readFileSync(new URL('../../docs/v6/V6_CSP_COMPATIBILITY.md', import.meta.url), 'utf8');

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
  assert.doesNotMatch(inventory, /\*\.supabase\.co/);
});

test('CSP inventory preserves the official YouTube player contract without wildcarding provider origins', () => {
  assert.match(youtubeSource, /kind:\s*'youtube'/);
  assert.match(youtubeSource, /new api\.Player\(/);
  assert.match(youtubeSource, /enablejsapi:\s*1/);

  assert.ok(inventory.includes('https://www.youtube.com'));
  assert.doesNotMatch(inventory, /https:\/\/\*\.youtube\.com/);
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
  assert.match(inventory, /default-src 'self';/);
  assert.match(inventory, /script-src 'self' https:\/\/cdn\.jsdelivr\.net https:\/\/www\.youtube\.com;/);
  assert.match(
    inventory,
    /connect-src 'self' https:\/\/zkfmgezvzugchcwppreq\.supabase\.co wss:\/\/zkfmgezvzugchcwppreq\.supabase\.co;/,
  );
  assert.match(inventory, /frame-src 'self' https:\/\/www\.youtube\.com;/);
  assert.match(inventory, /object-src 'none';/);
  assert.match(inventory, /frame-ancestors 'self';/);
});
