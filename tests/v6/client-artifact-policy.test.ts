import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  findClientCredentialExposure,
  scanClientArtifactInputs,
} from '../../scripts/v6-client-artifact-policy.mjs';

function jwt(role: string) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, iss: 'supabase' })}.signatureplaceholder`;
}

test('client artifact policy allows ordinary public browser configuration and a Supabase anon key', () => {
  const source = [
    "const PUBLIC_API_URL = 'https://example.invalid';",
    "const PUBLIC_CLIENT_ID = 'browser-client';",
    "const BUILD_SHA = 'abc123';",
    `const SUPABASE_ANON_KEY = '${jwt('anon')}';`,
  ].join('\n');
  assert.deepEqual(findClientCredentialExposure(source), []);
});

test('client artifact policy rejects privileged markers, private keys, secret literals, and non-anon JWTs', () => {
  const samples = [
    'const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;',
    "const secret_token = 'abcdefghijklmnopqrstuvwxyz0123456789';",
    '-----BEGIN PRIVATE KEY-----',
    `const token = '${jwt('service_role')}';`,
    `const token = '${jwt('authenticated')}';`,
  ];
  for (const source of samples) {
    assert.notDeepEqual(findClientCredentialExposure(source), [], source);
  }
});

test('client artifact scan covers source and built artifact roots but ignores test-only fixtures', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bq-v6-client-policy-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await mkdir(path.join(root, 'dist-v6', 'assets'), { recursive: true });
    await mkdir(path.join(root, 'tests'), { recursive: true });

    await writeFile(path.join(root, 'src', 'safe.js'), "export const publicValue = 'ok';\n");
    await writeFile(path.join(root, 'tests', 'fixture.js'), "const SERVICE_ROLE_KEY = 'test-only';\n");
    await writeFile(path.join(root, 'dist-v6', 'assets', 'app.js'), `const token = '${jwt('service_role')}';\n`);

    const findings = await scanClientArtifactInputs(root);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].file, path.join('dist-v6', 'assets', 'app.js'));
    assert.ok(findings[0].matches.some((match) => match.includes('jwt-literal:service_role')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('client artifact scan remains clean when privileged-looking data exists only outside browser-shipped roots', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bq-v6-client-policy-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await mkdir(path.join(root, 'supabase', 'functions'), { recursive: true });
    await writeFile(path.join(root, 'src', 'safe.js'), "export const publicValue = 'ok';\n");
    await writeFile(path.join(root, 'supabase', 'functions', 'server.ts'), "const SERVICE_ROLE_KEY = 'server-only';\n");

    assert.deepEqual(await scanClientArtifactInputs(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
