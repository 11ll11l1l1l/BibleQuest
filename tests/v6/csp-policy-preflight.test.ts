import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  REQUIRED_CSP_SOURCES,
  auditCspCompatibility,
  auditRuntimeEvidence,
  rootCspFromHeaders,
  validatePolicyCompatibility,
} from '../../scripts/v6-csp-compatibility.mjs';

test('CSP preflight tracks external runtime sources that enforcement must preserve', () => {
  assert.ok(REQUIRED_CSP_SOURCES['script-src'].includes('https://cdn.jsdelivr.net'));
  assert.ok(REQUIRED_CSP_SOURCES['script-src'].includes('https://www.youtube.com'));
  assert.ok(REQUIRED_CSP_SOURCES['connect-src'].includes('https://zkfmgezvzugchcwppreq.supabase.co'));
  assert.ok(REQUIRED_CSP_SOURCES['connect-src'].includes('wss://zkfmgezvzugchcwppreq.supabase.co'));
  assert.ok(REQUIRED_CSP_SOURCES['connect-src'].includes('https://cdn.jsdelivr.net'));
  assert.ok(REQUIRED_CSP_SOURCES['connect-src'].includes('https://openbible.com'));
  assert.ok(REQUIRED_CSP_SOURCES['media-src'].includes('https://openbible.com'));
  assert.ok(REQUIRED_CSP_SOURCES['frame-src'].includes('https://www.youtube.com'));
  assert.ok(REQUIRED_CSP_SOURCES['img-src'].includes('https://i.ytimg.com'));
});

test('CSP runtime evidence remains bound to current Supabase, Kuromoji, OpenBible and YouTube seams', async () => {
  const evidence = await auditRuntimeEvidence(path =>
    readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));
  assert.equal(evidence.length, 8);
});

test('current root headers remain explicitly unenforced until browser validation is ready', async () => {
  const result = await auditCspCompatibility({
    readText: path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8'),
  });
  assert.equal(result.enforced, false);
  assert.equal(result.compatible, false);
  assert.match(result.reason, /No root Content-Security-Policy/);
});

test('root header parser does not mistake route-specific CSP for global enforcement', () => {
  const headers = `/*
  X-Content-Type-Options: nosniff

/admin
  Content-Security-Policy: default-src 'none'
`;
  assert.equal(rootCspFromHeaders(headers), null);
});

test('future enforced CSP fails closed if a required runtime origin is omitted or unsafe-eval is added', () => {
  const candidate = [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://www.youtube.com",
    "connect-src 'self' https://zkfmgezvzugchcwppreq.supabase.co wss://zkfmgezvzugchcwppreq.supabase.co https://cdn.jsdelivr.net https://openbible.com",
    "media-src 'self' https://openbible.com",
    "frame-src 'self' https://www.youtube.com",
    "img-src 'self' https://i.ytimg.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
  ].join('; ');

  assert.equal(validatePolicyCompatibility(candidate).compatible, true);

  const missingAudio = validatePolicyCompatibility(
    candidate.replace("media-src 'self' https://openbible.com", "media-src 'self'"),
  );
  assert.equal(missingAudio.compatible, false);
  assert.ok(missingAudio.missing.includes('media-src missing https://openbible.com'));

  const unsafeEval = validatePolicyCompatibility(
    candidate.replace("script-src 'self'", "script-src 'self' 'unsafe-eval'"),
  );
  assert.equal(unsafeEval.compatible, false);
  assert.ok(unsafeEval.missing.includes("script-src must not use 'unsafe-eval'"));
});
