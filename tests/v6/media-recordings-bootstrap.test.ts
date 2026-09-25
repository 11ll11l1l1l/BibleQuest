import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap = await readFile('src/app/bootstrap.js', 'utf8');

test('bootstrap hands the live Recordings service to the V6 media runtime', () => {
  assert.match(
    bootstrap,
    /import \{ createRecordingsMediaRuntime \} from '\.\.\/v6\/media\/recordings-runtime\.ts';/,
  );
  assert.doesNotMatch(
    bootstrap,
    /import \{ createAudioManager \} from '\.\/audio\.js';/,
    'Live bootstrap must not silently fall back to the legacy direct iframe audio owner.',
  );
  assert.match(bootstrap, /const recordingsMedia=createRecordingsMediaRuntime\(\);/);
  assert.match(
    bootstrap,
    /createRecordingsService\(\{media:api\.media,audio:recordingsMedia\.audio,session,congregation\}\)/,
  );
});

test('Recordings remains the route-facing owner and disposes the V6 media runtime through its audio facade', () => {
  assert.match(bootstrap, /recordings:\(\)=>recordingsPage\(\{recordings,/);
  assert.match(bootstrap, /media:\(\)=>recordingsPage\(\{recordings,/);
  assert.match(bootstrap, /recordings\.dispose\(\)/);
});
