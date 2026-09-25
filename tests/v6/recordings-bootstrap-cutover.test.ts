import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const bootstrap = fs.readFileSync('src/app/bootstrap.js', 'utf8');

test('Recordings bootstrap uses one V6 Media runtime owner', () => {
  assert.match(
    bootstrap,
    /import \{ createRecordingsMediaRuntime \} from '\.\.\/v6\/media\/recordings-runtime\.ts';/,
  );
  assert.doesNotMatch(
    bootstrap,
    /createAudioManager/,
    'bootstrap must not recreate the retired legacy Recordings audio owner',
  );
  assert.match(
    bootstrap,
    /const recordingsMediaRuntime=createRecordingsMediaRuntime\(\{document,visibilityTarget:document,pageTarget:window\}\);/,
  );
  assert.match(
    bootstrap,
    /createRecordingsService\(\{media:api\.media,audio:recordingsMediaRuntime\.audio,session,congregation\}\)/,
  );
  assert.equal(
    (bootstrap.match(/createRecordingsMediaRuntime\(/g) ?? []).length,
    1,
    'bootstrap must create exactly one Recordings Media runtime',
  );
  assert.match(
    bootstrap,
    /recordings\.dispose\(\)/,
    'existing pagehide cleanup must continue disposing the Recordings service',
  );
});
