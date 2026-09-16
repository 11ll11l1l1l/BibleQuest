import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const retiredOwners = [
  'src/app/media-library.js',
  'src/features/media-library/index.js'
];

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

test('abandoned Media Library owners stay retired', async () => {
  for (const path of retiredOwners) {
    assert.equal(await exists(path), false, `${path} must remain removed; Recordings owns V5 media playback.`);
  }
});

test('media route remains an alias of the verified Recordings page', async () => {
  const bootstrap = await readFile('src/app/bootstrap.js', 'utf8');
  assert.match(bootstrap, /import\s+\{\s*recordingsPage\s*\}\s+from\s+['"]\.\.\/features\/recordings\/index\.js['"]/);
  assert.match(bootstrap, /recordings:\(\)=>recordingsPage\(/, 'recordings route must stay on Recordings');
  assert.match(bootstrap, /media:\(\)=>recordingsPage\(/, 'media alias must stay on Recordings');
  assert.match(bootstrap, /onMedia:\(\)=>router\.navigate\('media'\)/, 'Home media navigation must keep the media alias available');
  assert.doesNotMatch(bootstrap, /createMediaLibraryService|mediaLibraryPage|features\/media-library|app\/media-library/);
});

test('architecture validator no longer requires the retired duplicate owner', async () => {
  const validator = await readFile('scripts/validate-v3-architecture.mjs', 'utf8');
  assert.doesNotMatch(validator, /onlyOwner\(\/export function createMediaLibraryService/,
    'architecture validator must not require a retired Media Library service owner');
  assert.doesNotMatch(validator, /['"]src\/app\/media-library\.js['"],/,
    'architecture required-file inventory must not restore the retired service');
  assert.doesNotMatch(validator, /['"]src\/features\/media-library\/index\.js['"],/,
    'architecture required-file inventory must not restore the retired page');
  assert.match(validator, /media-library\.js\/media-library UI were retired/,
    'architecture validator should retain an explicit retirement note');
});

test('V5 architecture documentation names Recordings as canonical media owner', async () => {
  const doc = await readFile('docs/v5/V5_MEDIA_ARCHITECTURE_OWNERSHIP.md', 'utf8');
  assert.match(doc, /src\/app\/recordings\.js.*sole V5 Recordings\/media playback orchestration owner/s);
  assert.match(doc, /src\/app\/media-library\.js/);
  assert.match(doc, /src\/features\/media-library\/index\.js/);
  assert.match(doc, /intentionally absent from V5 source/);
  assert.match(doc, /media.*route alias.*Recordings/s);
  assert.match(doc, /supersedes.*historical entry for V5/s,
    'V5 ownership overlay must explicitly resolve the historical V3 architecture entry');
});
