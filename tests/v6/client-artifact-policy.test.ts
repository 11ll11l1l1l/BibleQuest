import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  findClientCredentialExposure,
  scanClientArtifactInputs,
} from '../../scripts/v6-client-artifact-policy.mjs';

test('client artifact policy allows ordinary public browser configuration', () => {
  const source = [
    "const PUBLIC_API_URL = 'https://example.invalid';",
    "const PUBLIC_CLIENT_ID = 'browser-client';",
    "const BUILD_SHA = 'abc123';",
  ].join('\n');
  assert.deepEqual(findClientCredentialExposure(source), []);
});

test('client artifact scan is limited to browser-shipped roots', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bq-v6-client-policy-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await mkdir(path.join(root, 'tests'), { recursive: true });
    await writeFile(path.join(root, 'src', 'safe.js'), "export const publicValue = 'ok';\n");
    await writeFile(path.join(root, 'tests', 'fixture.js'), "export const fixtureValue = 'test-only';\n");
    assert.deepEqual(await scanClientArtifactInputs(root), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
