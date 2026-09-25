import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../src/features/games/index.js', import.meta.url), 'utf8');

test('Games route maps thrown failures through the shared safe V6 taxonomy', () => {
  assert.match(source, /import \{ toSafeFailure \} from '\.\.\/\.\.\/v6\/kernel\/errors\.ts';/);
  assert.match(source, /const failure=toSafeFailure\(error\)/);
  assert.match(source, /data-game-error=/);
  assert.match(source, /escapeHtml\(failure\.message\)/);
  assert.doesNotMatch(source, /error\?\.message/);
});

test('Games failure view keeps an explicit recovery route', () => {
  assert.match(source, /role="alert"/);
  assert.match(source, /data-game-launcher>Back to games/);
});
