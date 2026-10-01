import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  assertPasswordNotCompromised as assertBrowserPassword,
  pwnedCountFromRange as browserRangeCount,
  sha1Hex as browserSha1Hex,
} from '../../src/security/password-breach.js';
import {
  assertPasswordNotCompromised as assertServerPassword,
  pwnedCountFromRange as serverRangeCount,
  sha1Hex as serverSha1Hex,
} from '../../supabase/functions/_shared/password-security.ts';

const PASSWORD_HASH = '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8';
const PASSWORD_PREFIX = PASSWORD_HASH.slice(0, 5);
const PASSWORD_SUFFIX = PASSWORD_HASH.slice(5);
const CLEAN_PASSWORD = 'BibleQuest-Only-Test-Vector-2026!';
const CLEAN_HASH = await browserSha1Hex(CLEAN_PASSWORD);

function pwnedFetcher(calls: Array<{ url: string; init: RequestInit | undefined }>) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return new Response(`${PASSWORD_SUFFIX}:3861493\r\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0\r\n`, {
      status: 200,
      headers: { 'content-type': 'text/plain' },
    });
  };
}

test('password screening uses the HIBP k-anonymity prefix and never sends the password or full hash', async () => {
  assert.equal(await browserSha1Hex('password'), PASSWORD_HASH);
  assert.equal(await serverSha1Hex('password'), PASSWORD_HASH);

  for (const assertSafe of [assertBrowserPassword, assertServerPassword]) {
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    await assert.rejects(
      () => assertSafe('password', { fetcher: pwnedFetcher(calls) as typeof fetch, timeoutMs: 1000 }),
      (error: any) => error?.code === 'BQ_PASSWORD_COMPROMISED',
    );
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `https://api.pwnedpasswords.com/range/${PASSWORD_PREFIX}`);
    assert.equal(calls[0].url.includes('password'), false);
    assert.equal(calls[0].url.includes(PASSWORD_HASH), false);
    const headers = new Headers(calls[0].init?.headers);
    assert.equal(headers.get('Add-Padding'), 'true');
  }
});

test('range parsing ignores padding rows and accepts a password absent from the returned suffixes', async () => {
  assert.equal(browserRangeCount(`${PASSWORD_SUFFIX}:12\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0\n`, PASSWORD_SUFFIX), 12);
  assert.equal(serverRangeCount(`${PASSWORD_SUFFIX}:12\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0\n`, PASSWORD_SUFFIX), 12);

  const cleanSuffix = CLEAN_HASH.slice(5);
  const fetcher = async () => new Response(`AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0\n${PASSWORD_SUFFIX}:1\n`, { status: 200 });
  assert.equal(await assertBrowserPassword(CLEAN_PASSWORD, { fetcher: fetcher as typeof fetch, timeoutMs: 1000 }), true);
  assert.equal(await assertServerPassword(CLEAN_PASSWORD, { fetcher: fetcher as typeof fetch, timeoutMs: 1000 }), true);
  assert.notEqual(cleanSuffix, PASSWORD_SUFFIX);
});

test('password screening fails closed when the breach service is unavailable', async () => {
  const unavailable = async () => new Response('unavailable', { status: 503 });
  for (const assertSafe of [assertBrowserPassword, assertServerPassword]) {
    await assert.rejects(
      () => assertSafe(CLEAN_PASSWORD, { fetcher: unavailable as typeof fetch, timeoutMs: 1000 }),
      (error: any) => error?.code === 'BQ_PASSWORD_BREACH_CHECK_UNAVAILABLE',
    );
  }
});

test('first-party signup, recovery and signed-in password change paths invoke breach screening before mutation', async () => {
  const session = await readFile(new URL('../../src/app/session.js', import.meta.url), 'utf8');
  const signup = await readFile(new URL('../../supabase/functions/bq-signup/index.ts', import.meta.url), 'utf8');
  const reset = await readFile(new URL('../../supabase/functions/bq-password-reset/index.ts', import.meta.url), 'utf8');

  assert.match(session, /await assertPasswordNotCompromised\(next\);[\s\S]*auth\.updatePassword\(next\)/);
  assert.match(signup, /await assertPasswordNotCompromised\(password\);[\s\S]*auth\.admin\.createUser/);
  assert.match(reset, /safeEqual\(suppliedHash[\s\S]*await assertPasswordNotCompromised\(password\);[\s\S]*auth\.admin\.updateUserById/);
});
