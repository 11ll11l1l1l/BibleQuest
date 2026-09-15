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
